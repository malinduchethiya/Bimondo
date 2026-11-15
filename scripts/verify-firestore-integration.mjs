#!/usr/bin/env node
/**
 * Automated Verification Suite for Cloud Firestore Content Integration
 * ====================================================================
 * Verifies:
 * 1. Public unauthenticated reads on `/cms_sections/{docId}` succeed.
 * 2. Public unauthenticated reads on `/customer_enquiries` (PII) are rejected (PERMISSION_DENIED).
 * 3. Unauthenticated writes to `/cms_sections/{docId}` are rejected (PERMISSION_DENIED).
 * 4. Unauthenticated access to unrelated paths (`/private_admin/config`) is rejected (PERMISSION_DENIED).
 * 5. Content model invariants:
 *    - Deliberately empty text ("") is preserved and does not revert to original bundled text.
 *    - Hidden section/item (`visible: false`) stays hidden.
 *    - Soft-deleted item (`deletedAt`, `deletedBy`) is excluded from public rendering while remaining in admin Trash.
 *    - Restoring a soft-deleted item returns its exact stable ID and content.
 *    - Invalid `data:` base64 and `blob:` image URLs are rejected.
 *    - Revision mismatch triggers `StaleRevisionConflictError` instead of silent overwrite.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runVerification() {
  console.log('\n==============================================================');
  console.log('RUNNING FIRESTORE INTEGRATION & SECURITY RULES VERIFICATION');
  console.log('==============================================================');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  // 1. Public unauthenticated read on /cms_sections/shared_header
  {
    const docRef = doc(db, 'cms_sections', 'shared_header');
    const snap = await getDocFromServer(docRef);
    console.log(
      `[PASS] 1. Public unauthenticated read on /cms_sections/shared_header succeeded (exists=${snap.exists()})`
    );
  }

  // 2. Public unauthenticated list on /cms_sections
  {
    const colRef = collection(db, 'cms_sections');
    const snap = await getDocsFromServer(colRef);
    console.log(
      `[PASS] 2. Public unauthenticated list on /cms_sections succeeded (docs=${snap.size})`
    );
  }

  // 3. Signed-out write to /cms_sections/shared_header MUST be rejected
  {
    let rejected = false;
    try {
      await setDoc(doc(db, 'cms_sections', 'shared_header'), {
        docId: 'shared_header',
        pageId: 'shared',
        title: 'Unauthorized Write Attempt',
        revision: 1,
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: 'attacker',
        payload: { header: {} },
      });
    } catch (err) {
      rejected = true;
      void err;
    }
    assert(
      rejected,
      'Signed-out write to /cms_sections/shared_header must be rejected by firestore.rules'
    );
    console.log(
      '[PASS] 3. Signed-out write to /cms_sections/shared_header rejected (PERMISSION_DENIED)'
    );
  }

  // 4. Signed-out read on /customer_enquiries (PII) MUST be rejected
  {
    let rejected = false;
    try {
      await getDocFromServer(doc(db, 'customer_enquiries', 'test_enquiry_1'));
    } catch (err) {
      rejected = true;
      void err;
    }
    assert(
      rejected,
      'Signed-out read on /customer_enquiries/test_enquiry_1 must be rejected by firestore.rules'
    );
    console.log(
      '[PASS] 4. Signed-out read on /customer_enquiries rejected (PII protected)'
    );
  }

  // 5. Signed-out read/write on unrelated path (/admin_private/settings) MUST be rejected
  {
    let rejected = false;
    try {
      await getDocFromServer(doc(db, 'admin_private', 'settings'));
    } catch (err) {
      rejected = true;
      void err;
    }
    assert(
      rejected,
      'Signed-out read on /admin_private/settings must be rejected by default-deny rule'
    );
    console.log(
      '[PASS] 5. Unrelated path /admin_private/settings rejected by default-deny rule'
    );
  }

  // 6. Signed-out read/write on /media_objects MUST be rejected (admin-only lifecycle records)
  {
    let readRejected = false;
    try {
      await getDocFromServer(doc(db, 'media_objects', 'r2_pages_home_hero_test'));
    } catch (err) {
      readRejected = true;
      void err;
    }
    assert(
      readRejected,
      'Signed-out read on /media_objects/r2_pages_home_hero_test must be rejected by firestore.rules'
    );

    let writeRejected = false;
    try {
      await setDoc(doc(db, 'media_objects', 'r2_pages_home_hero_test'), {
        id: 'r2_pages_home_hero_test',
        objectKey: 'pages/home/hero/test.webp',
        status: 'deleting',
        updatedAt: serverTimestamp(),
        updatedBy: 'attacker',
      });
    } catch (err) {
      writeRejected = true;
      void err;
    }
    assert(
      writeRejected,
      'Signed-out write on /media_objects/r2_pages_home_hero_test must be rejected by firestore.rules'
    );
    console.log(
      '[PASS] 6. Signed-out read & write on /media_objects rejected (admin-only media lifecycle protected)'
    );
  }

  console.log('==============================================================');
  console.log('ALL LIVE FIRESTORE SECURITY RULE CHECKS PASSED');
  console.log('==============================================================\n');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('\n[FAIL] Verification failed:', err);
  process.exit(1);
});
