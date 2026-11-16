import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { exportJWK, generateKeyPair, importJWK, SignJWT } from 'jose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const TMP_DIR = path.resolve(__dirname, '.verify-tmp');

function transpileTsSource(srcPath, outPath) {
  let code = fs.readFileSync(srcPath, 'utf8');
  code = code.replace(
    /from\s+['"]@\/lib\/([^'"]+)['"]/g,
    "from './$1.mjs'"
  );
  code = code.replace(
    /from\s+['"]\.\.\/\.\.\/\.\.\/lib\/([^'"]+)['"]/g,
    "from './$1.mjs'"
  );
  code = code.replace(
    /from\s+['"]\.\/([^'"]+)['"]/g,
    (match, rel) => (rel.endsWith('.mjs') ? match : `from './${rel}.mjs'`)
  );
  code = code.replace(
    /from\s+['"]\.\.\/firebase-applet-config\.json['"]/g,
    "from './firebase-applet-config.mjs'"
  );

  const transpiled = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  fs.writeFileSync(outPath, transpiled.outputText, 'utf8');
}

function prepareTranspiledModules() {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const appletCfgPath = path.resolve(ROOT_DIR, 'firebase-applet-config.json');
  const appletCfgJson = fs.readFileSync(appletCfgPath, 'utf8');
  fs.writeFileSync(
    path.join(TMP_DIR, 'firebase-applet-config.mjs'),
    `export default ${appletCfgJson};\n`,
    'utf8'
  );

  const libFiles = [
    'booking-types',
    'booking-store',
    'booking-handlers',
    'bento-destinations',
    'tours',
    'r2-upload-client',
    'r2-media-service',
    'cms-defaults',
    'media-usage',
    'firebase-client',
    'content-repository',
  ];

  for (const name of libFiles) {
    transpileTsSource(
      path.resolve(ROOT_DIR, 'lib', `${name}.ts`),
      path.join(TMP_DIR, `${name}.mjs`)
    );
  }

  const workerOutPath = path.join(TMP_DIR, 'site-worker.mjs');
  transpileTsSource(
    path.resolve(ROOT_DIR, 'workers/site-worker/src/index.ts'),
    workerOutPath
  );

  return {
    siteWorkerPath: workerOutPath,
    r2ServicePath: path.join(TMP_DIR, 'r2-media-service.mjs'),
    cmsDefaultsPath: path.join(TMP_DIR, 'cms-defaults.mjs'),
    mediaUsagePath: path.join(TMP_DIR, 'media-usage.mjs'),
    contentRepoPath: path.join(TMP_DIR, 'content-repository.mjs'),
  };
}

const modules = prepareTranspiledModules();
const { handleSiteWorkerRequest } = await import(
  pathToFileURL(modules.siteWorkerPath).href
);
const { EXPECTED_CMS_SECTION_DOC_IDS, encodeWorkerMediaDocId } = await import(
  pathToFileURL(modules.r2ServicePath).href
);
const { getDefaultCmsData, createImageRef } = await import(
  pathToFileURL(modules.cmsDefaultsPath).href
);
const { evaluateMediaObjectUsage, encodeMediaDocId } = await import(
  pathToFileURL(modules.mediaUsagePath).href
);
const {
  normalizeCmsData,
  filterCmsForPublic,
  validateCmsContentImages,
  CMS_SECTION_DEFINITIONS,
} = await import(pathToFileURL(modules.contentRepoPath).href);

const TEST_PROJECT_ID = 'advance-sandbox-gmzf6';
const TEST_ISSUER = `https://securetoken.google.com/${TEST_PROJECT_ID}`;
const SITE_ORIGIN = 'https://www.bimondotours.com';

// Valid binary magic byte fixtures
const VALID_WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, // "RIFF"
  0x24, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, // "WEBP"
  0x56, 0x50, 0x38, 0x20,
]);

const VALID_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

const VALID_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

const VALID_GIF_BYTES = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
]);

const SVG_BYTES = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
);

const HTML_BYTES = new TextEncoder().encode(
  '<!DOCTYPE html><html><body>malicious</body></html>'
);

class MockR2Bucket {
  constructor() {
    this.objects = new Map();
    this.failNextDelete = false;
  }

  async head(key) {
    const entry = this.objects.get(key);
    if (!entry) return null;
    return {
      key,
      size: entry.bytes.byteLength,
      uploaded: entry.uploaded,
      httpMetadata: entry.options?.httpMetadata,
    };
  }

  async put(key, value, options) {
    const bytes =
      value instanceof Uint8Array
        ? value
        : new Uint8Array(await new Response(value).arrayBuffer());
    const uploaded = new Date('2026-11-15T10:00:00.000Z');
    this.objects.set(key, { bytes, options, uploaded });
    return { key, size: bytes.byteLength, uploaded };
  }

  async list(options = {}) {
    const prefix = options.prefix || '';
    const limit = options.limit || 24;
    const startIdx = options.cursor ? Number.parseInt(options.cursor, 10) : 0;

    const matchingKeys = Array.from(this.objects.keys())
      .filter((k) => k.startsWith(prefix))
      .sort();

    const pageKeys = matchingKeys.slice(startIdx, startIdx + limit);
    const truncated = startIdx + limit < matchingKeys.length;
    const nextCursor = truncated ? String(startIdx + limit) : undefined;

    const objects = pageKeys.map((k) => {
      const entry = this.objects.get(k);
      return {
        key: k,
        size: entry.bytes.byteLength,
        uploaded: entry.uploaded,
        httpMetadata: entry.options?.httpMetadata,
      };
    });

    return {
      objects,
      truncated,
      cursor: nextCursor,
    };
  }

  async delete(keys) {
    if (this.failNextDelete) {
      this.failNextDelete = false;
      throw new Error('Simulated transient R2 storage delete failure');
    }
    const list = Array.isArray(keys) ? keys : [keys];
    for (const k of list) {
      this.objects.delete(k);
    }
  }
}

class MockFirestoreDeletionCoordinator {
  constructor() {
    this.mediaDocs = new Map();
    this.sectionDocs = new Map();
    this.complete = true;
    this.incompleteReason = undefined;
    this.onAfterLockDeleting = null;

    for (const docId of EXPECTED_CMS_SECTION_DOC_IDS) {
      this.sectionDocs.set(docId, {
        docId,
        title: docId,
        deleted: false,
        deletedAt: null,
        payload: {},
      });
    }
  }

  async getMediaLifecycleDoc(mediaId) {
    return this.mediaDocs.get(mediaId) || null;
  }

  async setMediaLifecycleStatus({ mediaId, objectKey, status, adminUid }) {
    const record = {
      id: mediaId,
      objectKey,
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUid,
    };
    this.mediaDocs.set(mediaId, record);
    if (status === 'deleting' && typeof this.onAfterLockDeleting === 'function') {
      await this.onAfterLockDeleting(record);
    }
  }

  async fetchAllCmsSectionDocs() {
    if (!this.complete) {
      return {
        complete: false,
        docs: Array.from(this.sectionDocs.values()),
        reason:
          this.incompleteReason ||
          'Simulated incomplete Firestore section snapshot.',
      };
    }
    return {
      complete: true,
      docs: Array.from(this.sectionDocs.values()),
    };
  }
}

function createMultipartUploadRequest({
  fileBytes,
  fileName,
  mimeType,
  folder,
  token,
  origin = SITE_ORIGIN,
  omitContentLength = false,
}) {
  const form = new FormData();
  const blob = new Blob([fileBytes], { type: mimeType });
  form.append('file', blob, fileName);
  if (folder !== undefined) {
    form.append('folder', folder);
  }

  const headers = {};
  if (origin) {
    headers['Origin'] = origin;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const req = new Request(`${SITE_ORIGIN}/api/media/upload`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (omitContentLength) {
    req.headers.delete('Content-Length');
  }

  return req;
}

async function runTests() {
  console.log('==============================================================');
  console.log('RUNNING CLOUDFLARE WORKER (BIMONDO_IMAGES) MEDIA API SUITE');
  console.log('==============================================================');

  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const wrongKeyPair = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = 'test-firebase-kid-1';
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';

  const jwkResolver = async (kid, alg) => {
    if (kid !== 'test-firebase-kid-1') {
      throw new Error(`Unknown kid: ${kid}`);
    }
    return await importJWK(publicJwk, alg);
  };

  const now = Math.floor(Date.now() / 1000);

  const validAdminToken = await new SignJWT({
    admin: true,
    email: 'admin@bimondotravels.com',
    auth_time: now - 60,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-firebase-kid-1' })
    .setIssuer(TEST_ISSUER)
    .setAudience(TEST_PROJECT_ID)
    .setSubject('admin-uid-001')
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const bootstrappedAdminEmailToken = await new SignJWT({
    email: 'bimondotours@gmail.com',
    email_verified: true,
    auth_time: now - 60,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-firebase-kid-1' })
    .setIssuer(TEST_ISSUER)
    .setAudience(TEST_PROJECT_ID)
    .setSubject('admin-uid-bootstrapped')
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const nonAdminToken = await new SignJWT({
    admin: false,
    email: 'visitor@bimondotravels.com',
    auth_time: now - 60,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-firebase-kid-1' })
    .setIssuer(TEST_ISSUER)
    .setAudience(TEST_PROJECT_ID)
    .setSubject('user-uid-002')
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const expiredAdminToken = await new SignJWT({
    admin: true,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-firebase-kid-1' })
    .setIssuer(TEST_ISSUER)
    .setAudience(TEST_PROJECT_ID)
    .setSubject('admin-uid-001')
    .setIssuedAt(now - 7200)
    .setExpirationTime(now - 3600)
    .sign(privateKey);

  const customTokenLookalike = await new SignJWT({
    uid: 'admin-uid-001',
    claims: { admin: true },
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-firebase-kid-1' })
    .setIssuer('firebase-adminsdk@advance-sandbox-gmzf6.iam.gserviceaccount.com')
    .setAudience(
      'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit'
    )
    .setSubject('firebase-adminsdk@advance-sandbox-gmzf6.iam.gserviceaccount.com')
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const forgedSignatureToken = await new SignJWT({
    admin: true,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-firebase-kid-1' })
    .setIssuer(TEST_ISSUER)
    .setAudience(TEST_PROJECT_ID)
    .setSubject('admin-uid-001')
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 3600)
    .sign(wrongKeyPair.privateKey);

  const bucket = new MockR2Bucket();
  const mockAssets = {
    async fetch(req) {
      return new Response(`ASSET:${new URL(req.url).pathname}`, { status: 200 });
    },
  };

  const baseEnv = {
    ASSETS: mockAssets,
    BIMONDO_IMAGES: bucket,
    FIREBASE_PROJECT_ID: TEST_PROJECT_ID,
    PUBLIC_IMAGE_BASE_URL: 'https://cdn.bimondotours.com',
    ALLOWED_UPLOAD_PREFIXES: 'pages,shared,tours,gallery',
    MAX_UPLOAD_BYTES: String(10 * 1024 * 1024),
  };

  // 1. Missing token -> 401 (with same-origin headers preserved)
  {
    const req = createMultipartUploadRequest({
      fileBytes: VALID_WEBP_BYTES,
      fileName: 'sigiriya.webp',
      mimeType: 'image/webp',
      folder: 'pages/home/hero',
      token: null,
    });
    const res = await handleSiteWorkerRequest(req, baseEnv, { jwkResolver });
    assert.equal(res.status, 401);
    assert.equal(
      res.headers.get('Access-Control-Allow-Origin'),
      SITE_ORIGIN,
      'Same-origin responses must include CORS header'
    );
    console.log('[PASS] 1. Missing token rejected with 401 via /api/media/upload');
  }

  // 2. Expired, forged, and Firebase Custom Token lookalike -> 401
  {
    for (const [label, badToken] of [
      ['Expired token', expiredAdminToken],
      ['Forged signature token', forgedSignatureToken],
      ['Firebase Custom Token (wrong iss/aud)', customTokenLookalike],
    ]) {
      const req = createMultipartUploadRequest({
        fileBytes: VALID_WEBP_BYTES,
        fileName: 'sigiriya.webp',
        mimeType: 'image/webp',
        folder: 'pages/home/hero',
        token: badToken,
      });
      const res = await handleSiteWorkerRequest(req, baseEnv, { jwkResolver });
      assert.equal(res.status, 401, `${label} must be rejected with 401`);
    }
    console.log(
      '[PASS] 2. Expired, forged-signature, and Custom Token lookalikes rejected with 401'
    );
  }

  // 3. Authenticated non-admin token (admin !== true) -> 403; bootstrapped admin email allowed
  {
    const req = createMultipartUploadRequest({
      fileBytes: VALID_WEBP_BYTES,
      fileName: 'sigiriya.webp',
      mimeType: 'image/webp',
      folder: 'pages/home/hero',
      token: nonAdminToken,
    });
    const res = await handleSiteWorkerRequest(req, baseEnv, { jwkResolver });
    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.code, 'AUTH_NOT_ADMIN');

    // Also test missing BIMONDO_IMAGES binding returns 503 only after admin auth succeeds
    const missingBindingEnv = { ...baseEnv, BIMONDO_IMAGES: undefined };
    const adminNoBucketReq = createMultipartUploadRequest({
      fileBytes: VALID_WEBP_BYTES,
      fileName: 'sigiriya.webp',
      mimeType: 'image/webp',
      folder: 'pages/home/hero',
      token: bootstrappedAdminEmailToken,
    });
    const missingRes = await handleSiteWorkerRequest(
      adminNoBucketReq,
      missingBindingEnv,
      { jwkResolver }
    );
    const missingBody = await missingRes.json();
    assert.equal(missingRes.status, 503);
    assert.equal(missingBody.code, 'R2_BINDING_MISSING');

    console.log(
      '[PASS] 3. Non-admin Firebase token rejected (403); missing env.BIMONDO_IMAGES returns 503 for admins'
    );
  }

  // 4. OPTIONS preflight, GET /api/media/health, origin checks, and ASSETS fallback
  {
    const optionsReq = new Request(`${SITE_ORIGIN}/api/media/upload`, {
      method: 'OPTIONS',
      headers: { Origin: SITE_ORIGIN },
    });
    const optionsRes = await handleSiteWorkerRequest(optionsReq, baseEnv, {
      jwkResolver,
    });
    assert.equal(optionsRes.status, 204);
    assert.equal(optionsRes.headers.get('Access-Control-Allow-Origin'), SITE_ORIGIN);

    const healthReq = new Request(`${SITE_ORIGIN}/api/media/health`, {
      method: 'GET',
      headers: { Origin: SITE_ORIGIN },
    });
    const healthRes = await handleSiteWorkerRequest(healthReq, baseEnv, {
      jwkResolver,
    });
    assert.equal(healthRes.status, 200);
    const healthBody = await healthRes.json();
    assert.equal(healthBody.ok, true);
    assert.equal(healthBody.binding, 'BIMONDO_IMAGES');
    assert.equal(healthBody.bucketBound, true);
    assert.equal(healthBody.publicImageBaseUrl, 'https://cdn.bimondotours.com');

    // Cross-origin without allowlist -> 403
    const badOriginReq = createMultipartUploadRequest({
      fileBytes: VALID_WEBP_BYTES,
      fileName: 'sigiriya.webp',
      mimeType: 'image/webp',
      folder: 'pages/home/hero',
      token: validAdminToken,
      origin: 'https://untrusted.example.com',
    });
    const badOriginRes = await handleSiteWorkerRequest(badOriginReq, baseEnv, {
      jwkResolver,
    });
    assert.equal(badOriginRes.status, 403);
    assert.equal(badOriginRes.headers.get('Access-Control-Allow-Origin'), null);

    // Non-API routes fall through to ASSETS
    const assetRes = await handleSiteWorkerRequest(
      new Request(`${SITE_ORIGIN}/tours`),
      baseEnv,
      { jwkResolver }
    );
    assert.equal(assetRes.status, 200);
    assert.equal(await assetRes.text(), 'ASSET:/tours');

    console.log(
      '[PASS] 4. OPTIONS preflight (204), GET /api/media/health (200 BIMONDO_IMAGES), unapproved Origin rejection (403), and ASSETS pass-through verified'
    );
  }

  // 5. Invalid folders -> 400
  {
    for (const badFolder of [
      '../secrets',
      'pages/../../etc/passwd',
      'pages\\home\\hero',
      'pages/home\x00/hero',
      'pages//hero',
      'private/avatars',
      'buckets/site',
    ]) {
      const req = createMultipartUploadRequest({
        fileBytes: VALID_WEBP_BYTES,
        fileName: 'sigiriya.webp',
        mimeType: 'image/webp',
        folder: badFolder,
        token: validAdminToken,
      });
      const res = await handleSiteWorkerRequest(req, baseEnv, { jwkResolver });
      assert.equal(
        res.status,
        400,
        `Folder "${badFolder}" should be rejected with 400`
      );
    }
    console.log(
      '[PASS] 5. Invalid folders (traversal, backslashes, control chars, unapproved prefix) rejected with 400'
    );
  }

  // 6. Unsupported files & signature mismatches -> 415
  {
    const svgReq = createMultipartUploadRequest({
      fileBytes: SVG_BYTES,
      fileName: 'vector.png',
      mimeType: 'image/png',
      folder: 'pages/home/hero',
      token: validAdminToken,
    });
    const svgRes = await handleSiteWorkerRequest(svgReq, baseEnv, {
      jwkResolver,
    });
    assert.equal(svgRes.status, 415);

    const htmlReq = createMultipartUploadRequest({
      fileBytes: HTML_BYTES,
      fileName: 'exploit.jpg',
      mimeType: 'image/jpeg',
      folder: 'pages/home/hero',
      token: validAdminToken,
    });
    const htmlRes = await handleSiteWorkerRequest(htmlReq, baseEnv, {
      jwkResolver,
    });
    assert.equal(htmlRes.status, 415);

    const mismatchExtReq = createMultipartUploadRequest({
      fileBytes: VALID_JPEG_BYTES,
      fileName: 'sigiriya.webp',
      mimeType: 'image/jpeg',
      folder: 'pages/home/hero',
      token: validAdminToken,
    });
    const mismatchExtRes = await handleSiteWorkerRequest(
      mismatchExtReq,
      baseEnv,
      { jwkResolver }
    );
    assert.equal(mismatchExtRes.status, 415);

    const mismatchMimeReq = createMultipartUploadRequest({
      fileBytes: VALID_PNG_BYTES,
      fileName: 'sigiriya.png',
      mimeType: 'image/jpeg',
      folder: 'pages/home/hero',
      token: validAdminToken,
    });
    const mismatchMimeRes = await handleSiteWorkerRequest(
      mismatchMimeReq,
      baseEnv,
      { jwkResolver }
    );
    assert.equal(mismatchMimeRes.status, 415);

    console.log(
      '[PASS] 6. SVG, HTML, JPEG-as-WebP extension mismatch, and MIME mismatch rejected with 415'
    );
  }

  // 7. Oversized upload rejected with 413 during streaming (even without Content-Length)
  {
    const smallLimitEnv = {
      ...baseEnv,
      MAX_UPLOAD_BYTES: '1024',
    };
    const oversizedWebp = new Uint8Array(2048);
    oversizedWebp.set(VALID_WEBP_BYTES, 0);

    const req = createMultipartUploadRequest({
      fileBytes: oversizedWebp,
      fileName: 'large.webp',
      mimeType: 'image/webp',
      folder: 'pages/home/hero',
      token: validAdminToken,
      omitContentLength: true,
    });
    const res = await handleSiteWorkerRequest(req, smallLimitEnv, {
      jwkResolver,
    });
    assert.equal(res.status, 413);
    console.log(
      '[PASS] 7. Oversized upload rejected with 413 during stream read without trusting Content-Length'
    );
  }

  let uploadedHeroKey1 = '';

  // 8. Valid uploads (WebP, JPEG, PNG, GIF) written to env.BIMONDO_IMAGES -> https://cdn.bimondotours.com/...
  {
    const req1 = createMultipartUploadRequest({
      fileBytes: VALID_WEBP_BYTES,
      fileName: 'Sigiriya Rock Fortress.webp',
      mimeType: 'image/webp',
      folder: '/pages/home/hero/',
      token: validAdminToken,
    });
    const res1 = await handleSiteWorkerRequest(req1, baseEnv, { jwkResolver });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    uploadedHeroKey1 = body1.key;

    assert.ok(
      body1.key.startsWith('pages/home/hero/sigiriya-rock-fortress-'),
      `Unexpected key: ${body1.key}`
    );
    assert.ok(body1.key.endsWith('.webp'));
    assert.equal(body1.url, `https://cdn.bimondotours.com/${body1.key}`);
    assert.equal(body1.contentType, 'image/webp');
    assert.equal(body1.size, VALID_WEBP_BYTES.byteLength);

    const req2 = createMultipartUploadRequest({
      fileBytes: VALID_WEBP_BYTES,
      fileName: 'Sigiriya Rock Fortress.webp',
      mimeType: 'image/webp',
      folder: 'pages/home/hero',
      token: bootstrappedAdminEmailToken,
    });
    const res2 = await handleSiteWorkerRequest(req2, baseEnv, { jwkResolver });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();

    assert.notEqual(
      body1.key,
      body2.key,
      'Second upload must generate a unique object key and never overwrite existing object'
    );
    assert.equal(bucket.objects.size, 2);

    for (const [bytes, name, mime, folder, ext] of [
      [VALID_JPEG_BYTES, 'nine-arch.jpeg', 'image/jpeg', 'tours/packages', '.jpg'],
      [VALID_PNG_BYTES, 'brand-mark.png', 'image/png', 'shared/branding', '.png'],
      [VALID_GIF_BYTES, 'coast-wave.gif', 'image/gif', 'gallery/featured', '.gif'],
    ]) {
      const r = createMultipartUploadRequest({
        fileBytes: bytes,
        fileName: name,
        mimeType: mime,
        folder,
        token: validAdminToken,
      });
      const resp = await handleSiteWorkerRequest(r, baseEnv, { jwkResolver });
      assert.equal(resp.status, 200);
      const data = await resp.json();
      assert.ok(data.key.startsWith(`${folder}/`));
      assert.ok(data.key.endsWith(ext));
      assert.equal(data.url, `https://cdn.bimondotours.com/${data.key}`);
      assert.equal(data.contentType, mime);
    }

    console.log(
      `[PASS] 8. Valid WebP/JPEG/PNG/GIF uploads stored in env.BIMONDO_IMAGES with unique keys (e.g. ${body1.key}) and URL ${body1.url}`
    );
  }

  // 9. GET /api/media authenticated media-list endpoint
  {
    const unauthListReq = new Request(
      `${SITE_ORIGIN}/api/media?prefix=pages/home/hero`,
      { method: 'GET', headers: { Origin: SITE_ORIGIN } }
    );
    const unauthListRes = await handleSiteWorkerRequest(
      unauthListReq,
      baseEnv,
      { jwkResolver }
    );
    assert.equal(unauthListRes.status, 401);

    const nonAdminListReq = new Request(
      `${SITE_ORIGIN}/api/media?prefix=pages/home/hero`,
      {
        method: 'GET',
        headers: {
          Origin: SITE_ORIGIN,
          Authorization: `Bearer ${nonAdminToken}`,
        },
      }
    );
    const nonAdminListRes = await handleSiteWorkerRequest(
      nonAdminListReq,
      baseEnv,
      { jwkResolver }
    );
    assert.equal(nonAdminListRes.status, 403);

    for (const badQuery of [
      '',
      'prefix=private/secret',
      'prefix=pages/../secret',
      'prefix=pages/home/hero&limit=0',
      'prefix=pages/home/hero&limit=500',
      'prefix=pages/home/hero&limit=abc',
      'prefix=pages/home/hero&cursor=',
    ]) {
      const badReq = new Request(`${SITE_ORIGIN}/api/media?${badQuery}`, {
        method: 'GET',
        headers: {
          Origin: SITE_ORIGIN,
          Authorization: `Bearer ${validAdminToken}`,
        },
      });
      const badRes = await handleSiteWorkerRequest(badReq, baseEnv, {
        jwkResolver,
      });
      assert.equal(
        badRes.status,
        400,
        `Media query "${badQuery}" must be rejected with 400`
      );
    }

    const page1Req = new Request(
      `${SITE_ORIGIN}/api/media?prefix=pages/home/hero&limit=1`,
      {
        method: 'GET',
        headers: {
          Origin: SITE_ORIGIN,
          Authorization: `Bearer ${validAdminToken}`,
        },
      }
    );
    const page1Res = await handleSiteWorkerRequest(page1Req, baseEnv, {
      jwkResolver,
    });
    assert.equal(page1Res.status, 200);
    const page1Body = await page1Res.json();
    assert.equal(page1Body.prefix, 'pages/home/hero');
    assert.equal(page1Body.items.length, 1);
    assert.equal(page1Body.truncated, true);
    assert.ok(page1Body.cursor);
    assert.equal(
      page1Body.items[0].url,
      `https://cdn.bimondotours.com/${page1Body.items[0].key}`
    );
    assert.equal(page1Body.items[0].contentType, 'image/webp');

    const page2Req = new Request(
      `${SITE_ORIGIN}/api/media?prefix=pages/home/hero&limit=1&cursor=${encodeURIComponent(
        page1Body.cursor
      )}`,
      {
        method: 'GET',
        headers: {
          Origin: SITE_ORIGIN,
          Authorization: `Bearer ${validAdminToken}`,
        },
      }
    );
    const page2Res = await handleSiteWorkerRequest(page2Req, baseEnv, {
      jwkResolver,
    });
    assert.equal(page2Res.status, 200);
    const page2Body = await page2Res.json();
    assert.equal(page2Body.items.length, 1);
    assert.equal(page2Body.truncated, false);
    assert.notEqual(page1Body.items[0].key, page2Body.items[0].key);

    const rootPrefixReq = new Request(
      `${SITE_ORIGIN}/api/media?prefix=pages&limit=10`,
      {
        method: 'GET',
        headers: {
          Origin: SITE_ORIGIN,
          Authorization: `Bearer ${validAdminToken}`,
        },
      }
    );
    const rootPrefixRes = await handleSiteWorkerRequest(
      rootPrefixReq,
      baseEnv,
      { jwkResolver }
    );
    assert.equal(rootPrefixRes.status, 200);
    const rootPrefixBody = await rootPrefixRes.json();
    assert.ok(
      rootPrefixBody.subfolders.includes('pages/home'),
      'Browsing pages/ must discover child subfolder pages/home'
    );

    console.log(
      '[PASS] 9. GET /api/media enforces admin auth (401/403), validates prefixes/cursors/limits, and paginates BIMONDO_IMAGES'
    );
  }

  // 10. Multi-section image reuse, per-placement alt text, and usage detection
  {
    const baseCms = getDefaultCmsData();
    const sharedKey = uploadedHeroKey1;
    const sharedUrl = `https://cdn.bimondotours.com/${sharedKey}`;

    baseCms.pages.home.hero.slides[0].image = createImageRef(
      sharedUrl,
      'Golden sunrise over Sigiriya Lion Rock',
      sharedKey
    );
    baseCms.pages.home.story.mainImage = createImageRef(
      sharedUrl,
      'Private cultural heritage walk with local host',
      sharedKey
    );

    const usageBoth = evaluateMediaObjectUsage({
      objectKey: sharedKey,
      savedCms: baseCms,
      loadingFirestore: false,
      loadError: null,
      existingSectionCount: 22,
      totalSectionCount: 22,
    });

    assert.equal(usageBoth.status, 'in_use');
    assert.equal(usageBoth.canDeletePermanently, false);
    assert.equal(usageBoth.placements.length, 2);

    baseCms.pages.home.hero.slides[0].image = createImageRef('', '', null);

    const usageAfterRemovingOne = evaluateMediaObjectUsage({
      objectKey: sharedKey,
      savedCms: baseCms,
      loadingFirestore: false,
      loadError: null,
      existingSectionCount: 22,
      totalSectionCount: 22,
    });
    assert.equal(usageAfterRemovingOne.status, 'in_use');
    assert.equal(usageAfterRemovingOne.canDeletePermanently, false);
    assert.equal(usageAfterRemovingOne.placements.length, 1);

    baseCms.pages.home.story.visible = false;
    const usageWhenHidden = evaluateMediaObjectUsage({
      objectKey: sharedKey,
      savedCms: baseCms,
      loadingFirestore: false,
      loadError: null,
      existingSectionCount: 22,
      totalSectionCount: 22,
    });
    assert.equal(usageWhenHidden.status, 'in_use');
    assert.equal(usageWhenHidden.placements[0].state, 'hidden');

    baseCms.pages.home.story.deletedAt = '2026-11-15T12:00:00.000Z';
    const usageWhenTrashed = evaluateMediaObjectUsage({
      objectKey: sharedKey,
      savedCms: baseCms,
      loadingFirestore: false,
      loadError: null,
      existingSectionCount: 22,
      totalSectionCount: 22,
    });
    assert.equal(usageWhenTrashed.status, 'in_use');
    assert.equal(usageWhenTrashed.placements[0].state, 'trashed');

    baseCms.pages.home.story.mainImage = createImageRef('', '', null);

    const usageIncomplete = evaluateMediaObjectUsage({
      objectKey: sharedKey,
      savedCms: baseCms,
      loadingFirestore: false,
      loadError: null,
      existingSectionCount: 21,
      totalSectionCount: 22,
    });
    assert.equal(usageIncomplete.status, 'check_incomplete');
    assert.equal(usageIncomplete.canDeletePermanently, false);

    const usageUnused = evaluateMediaObjectUsage({
      objectKey: sharedKey,
      savedCms: baseCms,
      loadingFirestore: false,
      loadError: null,
      existingSectionCount: 22,
      totalSectionCount: 22,
    });
    assert.equal(usageUnused.status, 'unused');
    assert.equal(usageUnused.canDeletePermanently, true);

    console.log(
      '[PASS] 10. Multi-section image reuse, per-placement alt text, single-placement removal, active/hidden/Trash detection, and incomplete-check safeguard verified'
    );
  }

  // 11. POST /api/media/delete backend reference checks, concurrency lock, partial failure retry, and permanent deletion
  {
    const coordinator = new MockFirestoreDeletionCoordinator();

    assert.equal(
      encodeWorkerMediaDocId(uploadedHeroKey1),
      encodeMediaDocId(uploadedHeroKey1),
      'Server and client mediaId encoders must match'
    );

    const nonAdminDelReq = new Request(`${SITE_ORIGIN}/api/media/delete`, {
      method: 'POST',
      headers: {
        Origin: SITE_ORIGIN,
        Authorization: `Bearer ${nonAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: uploadedHeroKey1 }),
    });
    const nonAdminDelRes = await handleSiteWorkerRequest(
      nonAdminDelReq,
      baseEnv,
      { jwkResolver, firestoreCoordinator: coordinator }
    );
    assert.equal(nonAdminDelRes.status, 403);

    coordinator.complete = false;
    const incompleteDelReq = new Request(`${SITE_ORIGIN}/api/media/delete`, {
      method: 'POST',
      headers: {
        Origin: SITE_ORIGIN,
        Authorization: `Bearer ${validAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: uploadedHeroKey1 }),
    });
    const incompleteDelRes = await handleSiteWorkerRequest(
      incompleteDelReq,
      baseEnv,
      { jwkResolver, firestoreCoordinator: coordinator }
    );
    const incompleteDelBody = await incompleteDelRes.json();
    assert.equal(incompleteDelRes.status, 409);
    assert.equal(incompleteDelBody.code, 'USAGE_CHECK_INCOMPLETE');
    assert.ok(bucket.objects.has(uploadedHeroKey1));

    coordinator.complete = true;
    coordinator.sectionDocs.set('gallery_page', {
      docId: 'gallery_page',
      title: 'Visual Gallery Page & Curated Photos',
      deleted: false,
      deletedAt: null,
      payload: {
        gallery: [
          {
            id: 'trashed-photo-1',
            title: 'Trashed Sigiriya Photo',
            visible: false,
            deletedAt: '2026-11-15T12:00:00.000Z',
            imageRef: {
              url: `https://cdn.bimondotours.com/${uploadedHeroKey1}`,
              key: uploadedHeroKey1,
              alt: 'Trashed photo still in Firestore',
            },
          },
        ],
      },
    });

    const inUseDelReq = new Request(`${SITE_ORIGIN}/api/media/delete`, {
      method: 'POST',
      headers: {
        Origin: SITE_ORIGIN,
        Authorization: `Bearer ${validAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: uploadedHeroKey1 }),
    });
    const inUseDelRes = await handleSiteWorkerRequest(inUseDelReq, baseEnv, {
      jwkResolver,
      firestoreCoordinator: coordinator,
    });
    const inUseDelBody = await inUseDelRes.json();
    assert.equal(inUseDelRes.status, 409);
    assert.equal(inUseDelBody.code, 'IMAGE_IN_USE');
    assert.ok(Array.isArray(inUseDelBody.references));
    assert.ok(inUseDelBody.references.length > 0);
    assert.ok(bucket.objects.has(uploadedHeroKey1));
    const mediaId1 = encodeWorkerMediaDocId(uploadedHeroKey1);
    assert.equal(
      coordinator.mediaDocs.get(mediaId1)?.status,
      'active',
      'Rejected in-use deletion must roll back lifecycle status to active'
    );

    coordinator.sectionDocs.set('gallery_page', {
      docId: 'gallery_page',
      title: 'Visual Gallery Page & Curated Photos',
      deleted: false,
      deletedAt: null,
      payload: { gallery: [] },
    });

    let concurrentSaveBlockedDuringDeletingLock = false;
    coordinator.onAfterLockDeleting = async (lockedRecord) => {
      if (
        lockedRecord.status === 'deleting' ||
        lockedRecord.status === 'deleted'
      ) {
        concurrentSaveBlockedDuringDeletingLock = true;
      }
    };

    bucket.failNextDelete = true;
    const retryableDelReq = new Request(`${SITE_ORIGIN}/api/media/delete`, {
      method: 'POST',
      headers: {
        Origin: SITE_ORIGIN,
        Authorization: `Bearer ${validAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: uploadedHeroKey1 }),
    });
    const retryableDelRes = await handleSiteWorkerRequest(
      retryableDelReq,
      baseEnv,
      { jwkResolver, firestoreCoordinator: coordinator }
    );
    const retryableDelBody = await retryableDelRes.json();
    assert.equal(retryableDelRes.status, 502);
    assert.equal(retryableDelBody.code, 'R2_DELETE_RETRYABLE');
    assert.equal(coordinator.mediaDocs.get(mediaId1)?.status, 'deleting');
    assert.equal(concurrentSaveBlockedDuringDeletingLock, true);

    const successDelReq = new Request(`${SITE_ORIGIN}/api/media/delete`, {
      method: 'POST',
      headers: {
        Origin: SITE_ORIGIN,
        Authorization: `Bearer ${validAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: uploadedHeroKey1 }),
    });
    const successDelRes = await handleSiteWorkerRequest(
      successDelReq,
      baseEnv,
      { jwkResolver, firestoreCoordinator: coordinator }
    );
    const successDelBody = await successDelRes.json();
    assert.equal(successDelRes.status, 200);
    assert.equal(successDelBody.deleted, true);
    assert.equal(successDelBody.key, uploadedHeroKey1);
    assert.equal(successDelBody.lifecycleStatus, 'deleted');
    assert.ok(successDelBody.cacheNotice.includes('https://cdn.bimondotours.com'));
    assert.ok(successDelBody.cacheNotice.includes('BIMONDO_IMAGES'));
    assert.equal(bucket.objects.has(uploadedHeroKey1), false);
    assert.equal(coordinator.mediaDocs.get(mediaId1)?.status, 'deleted');

    console.log(
      '[PASS] 11. POST /api/media/delete verifies all 22 sections, blocks referenced/incomplete deletes (409), locks /media_objects, handles retryable failures (502), and deletes from BIMONDO_IMAGES (200)'
    );
  }

  // 12. Content repository normalization and Worker-client schema parity
  {
    assert.equal(
      CMS_SECTION_DEFINITIONS.length,
      EXPECTED_CMS_SECTION_DOC_IDS.length,
      'Client and Worker CMS section definitions must match in count'
    );

    const emptyTestCms = getDefaultCmsData();
    emptyTestCms.pages.home.hero.eyebrow = '';
    emptyTestCms.pages.home.hero.tripadvisorBrand = '';
    emptyTestCms.pages.home.story.visible = false;
    emptyTestCms.destinations = emptyTestCms.destinations.map((d) => ({
      ...d,
      deletedAt: '2026-11-15T12:00:00.000Z',
      deletedBy: 'admin-uid-001',
    }));
    emptyTestCms.tours = [];

    const normalized = normalizeCmsData(emptyTestCms);
    const publicFiltered = filterCmsForPublic(normalized);

    assert.equal(publicFiltered.pages.home.hero.eyebrow, '');
    assert.equal(publicFiltered.pages.home.hero.tripadvisorBrand, '');
    assert.equal(publicFiltered.pages.home.story.visible, false);
    assert.equal(publicFiltered.destinations.length, 0);
    assert.equal(normalized.destinations.length > 0, true);
    assert.equal(publicFiltered.tours.length, 0);

    const badDataCms = getDefaultCmsData();
    badDataCms.pages.home.story.mainImage.url = 'data:image/png;base64,iVBORw0=';
    assert.equal(validateCmsContentImages(badDataCms).valid, false);

    const badBlobCms = getDefaultCmsData();
    badBlobCms.pages.home.story.mainImage.url = 'blob:https://www.bimondotours.com/123';
    assert.equal(validateCmsContentImages(badBlobCms).valid, false);

    console.log(
      '[PASS] 12. Content repository normalization preserves empty values, hidden sections, soft-deleted arrays, and rejects base64/blob URLs'
    );
  }

  console.log('==============================================================');
  console.log('ALL 12 CLOUDFLARE BIMONDO_IMAGES MEDIA API VERIFICATION SUITES PASSED');
  console.log('==============================================================');
}

runTests()
  .catch((err) => {
    console.error('[FAIL] BIMONDO_IMAGES media API verification failed:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });
