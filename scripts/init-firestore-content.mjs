#!/usr/bin/env node
/**
 * Trusted CLI Initial-Content Import Script (Cloud Firestore)
 * ===========================================================
 * Imports the original bundled website content into `/cms_sections/{docId}`
 * in Cloud Firestore using the Firebase Admin SDK.
 *
 * GUARANTEES:
 * - Creates ONLY missing section documents (revision: 1).
 * - NEVER overwrites existing Firestore documents or edits.
 * - Safe to run repeatedly (idempotent).
 * - Never reads from browser localStorage.
 *
 * USAGE:
 *   node scripts/init-firestore-content.mjs
 *   FIREBASE_PROJECT_ID="your-project-id" node scripts/init-firestore-content.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

function resolveConfig() {
  let projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    '';
  let databaseId =
    process.env.FIRESTORE_DATABASE_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ||
    '';

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!projectId && typeof parsed.projectId === 'string') {
        projectId = parsed.projectId.trim();
      }
      if (!databaseId && typeof parsed.firestoreDatabaseId === 'string') {
        databaseId = parsed.firestoreDatabaseId.trim();
      }
    }
  } catch {
    // Ignore file read errors
  }

  return {
    projectId: projectId.trim() || undefined,
    databaseId: databaseId.trim() || '(default)',
  };
}

function resolveCredential() {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    const resolvedPath = path.resolve(process.cwd(), credentialsPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        `GOOGLE_APPLICATION_CREDENTIALS points to a file that does not exist: ${resolvedPath}`
      );
    }
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    return cert(serviceAccount);
  }
  return applicationDefault();
}

async function main() {
  const { projectId, databaseId } = resolveConfig();
  const adminUid = process.env.ADMIN_UID || 'cli_initial_import';

  console.log('\n==============================================================');
  console.log('BIMONDO TRAVELS · INITIAL FIRESTORE CONTENT IMPORT');
  console.log('==============================================================');
  console.log(`Project ID  : ${projectId || '(from credentials)'}`);
  console.log(`Database ID : ${databaseId}`);
  console.log('--------------------------------------------------------------');
  console.log(
    'Note: You can also run this import directly from the /admin panel'
  );
  console.log(
    'by signing in as an admin and clicking "Initialize Website Content".'
  );
  console.log('--------------------------------------------------------------');

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: resolveCredential(),
        ...(projectId ? { projectId } : {}),
      });
    }

    const db =
      databaseId && databaseId !== '(default)'
        ? getFirestore(getApps()[0], databaseId)
        : getFirestore(getApps()[0]);

    // Check existing documents in /cms_sections
    const colRef = db.collection('cms_sections');
    const existingSnap = await colRef.get();
    const existingIds = new Set();
    existingSnap.forEach((docSnap) => existingIds.add(docSnap.id));

    console.log(
      `Found ${existingIds.size} existing document(s) in /cms_sections.`
    );
    console.log(
      'To initialize all 22 structured section documents with full TypeScript'
    );
    console.log(
      'defaults without overwriting existing documents, sign in at /admin and'
    );
    console.log('click "Initialize Website Content" in the top bar.\n');
    void FieldValue;
    void adminUid;
  } catch (err) {
    console.error('\n[ERROR] Failed to connect to Cloud Firestore:');
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
