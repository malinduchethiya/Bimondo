#!/usr/bin/env node
/**
 * One-Time / Trusted CLI Admin Custom Claim Setup Script
 * ======================================================
 * Grants (or revokes) the `admin: true` custom user claim on a Firebase
 * Authentication user by UID or --email, while preserving all existing claims.
 *
 * SECURITY BOUNDARIES:
 * - Run ONLY in a trusted local machine or server CLI environment.
 * - Never bundled into frontend code or exposed via a public HTTP endpoint.
 * - Uses Application Default Credentials (ADC) or GOOGLE_APPLICATION_CREDENTIALS.
 * - Never pass passwords via CLI arguments or commit them to source files.
 *
 * USAGE:
 *   node scripts/grant-admin-claim.mjs <FIREBASE_USER_UID>
 *   node scripts/grant-admin-claim.mjs --email admin@example.com
 *   node scripts/grant-admin-claim.mjs --email admin@example.com --revoke
 *   ADMIN_INIT_PASSWORD="..." node scripts/grant-admin-claim.mjs --email admin@example.com --create
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function resolveProjectId() {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID.trim();
  }
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim();
  }
  if (process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) {
    return (
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      ''
    ).trim();
  }

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (parsed && typeof parsed.projectId === 'string' && parsed.projectId.trim()) {
        return parsed.projectId.trim();
      }
    }
  } catch {
    // Ignore file read errors and rely on ADC or explicit env vars
  }

  return undefined;
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

function parseCliArgs(argv) {
  const args = argv.slice(2).map((a) => a.trim()).filter(Boolean);
  let revoke = false;
  let createIfMissing = false;
  let email = null;
  let uid = null;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--revoke') {
      revoke = true;
    } else if (arg === '--create') {
      createIfMissing = true;
    } else if (arg === '--email') {
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value after --email.');
      }
      email = next;
      i += 1;
    } else if (arg.startsWith('--email=')) {
      email = arg.slice('--email='.length).trim();
    } else if (!arg.startsWith('--') && !uid) {
      uid = arg;
    }
  }

  return { revoke, createIfMissing, email, uid };
}

function printUsage() {
  console.error('\nUsage:');
  console.error('  node scripts/grant-admin-claim.mjs <FIREBASE_USER_UID>');
  console.error('  node scripts/grant-admin-claim.mjs --email <EMAIL>');
  console.error('  node scripts/grant-admin-claim.mjs --email <EMAIL> --revoke');
  console.error(
    '  ADMIN_INIT_PASSWORD="..." node scripts/grant-admin-claim.mjs --email <EMAIL> --create\n'
  );
}

async function resolveTargetUser(adminAuth, { uid, email, createIfMissing }) {
  if (uid) {
    return await adminAuth.getUser(uid);
  }

  try {
    return await adminAuth.getUserByEmail(email);
  } catch (err) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String(err.code)
        : '';

    if (code !== 'auth/user-not-found') {
      throw err;
    }

    if (!createIfMissing) {
      throw new Error(
        `No Firebase user found for email "${email}". Have the user sign up at /admin first, or re-run with --create and ADMIN_INIT_PASSWORD set.`
      );
    }

    const initPassword = process.env.ADMIN_INIT_PASSWORD || '';
    if (initPassword.length < 6) {
      throw new Error(
        'Cannot create user: set ADMIN_INIT_PASSWORD (minimum 6 characters) in your environment before running with --create.'
      );
    }

    return await adminAuth.createUser({
      email,
      password: initPassword,
      emailVerified: true,
    });
  }
}

async function main() {
  let parsed;
  try {
    parsed = parseCliArgs(process.argv);
  } catch (err) {
    console.error(`\n[ERROR] ${err instanceof Error ? err.message : String(err)}`);
    printUsage();
    process.exit(1);
  }

  const { revoke, createIfMissing, email, uid } = parsed;

  if (!uid && !email) {
    console.error('\n[ERROR] Provide either a Firebase User UID or --email <EMAIL>.');
    printUsage();
    process.exit(1);
  }

  const projectId = resolveProjectId();

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: resolveCredential(),
        ...(projectId ? { projectId } : {}),
      });
    }

    const adminAuth = getAuth();

    // 1. Fetch (or optionally create) target user record
    const userRecord = await resolveTargetUser(adminAuth, {
      uid,
      email,
      createIfMissing,
    });

    const existingClaims =
      userRecord.customClaims && typeof userRecord.customClaims === 'object'
        ? { ...userRecord.customClaims }
        : {};

    // 2. Preserve existing custom claims while setting or revoking admin
    const updatedClaims = {
      ...existingClaims,
      admin: !revoke,
    };

    if (revoke) {
      delete updatedClaims.admin;
    }

    await adminAuth.setCustomUserClaims(userRecord.uid, updatedClaims);

    // 3. Revoke refresh tokens so existing sessions must refresh
    await adminAuth.revokeRefreshTokens(userRecord.uid);

    // 4. Verify the updated claims from Firebase Auth
    const verifiedUser = await adminAuth.getUser(userRecord.uid);

    console.log('\n==============================================================');
    console.log(
      revoke
        ? 'SUCCESS: Revoked admin custom claim'
        : 'SUCCESS: Granted admin: true custom claim'
    );
    console.log('==============================================================');
    console.log(`Firebase Project ID : ${projectId || '(from credentials)'}`);
    console.log(`User UID            : ${verifiedUser.uid}`);
    console.log(`User Email          : ${verifiedUser.email || '(no email)'}`);
    console.log(
      `Verified Claims     : ${JSON.stringify(verifiedUser.customClaims || {})}`
    );
    console.log('--------------------------------------------------------------');
    console.log('IMPORTANT NEXT STEP:');
    console.log(
      'If this user is currently signed in to /admin, they MUST sign out'
    );
    console.log(
      'and sign back in (or click "Refresh Token Claims") to obtain a'
    );
    console.log('fresh Firebase ID token containing the updated custom claim.');
    console.log('==============================================================\n');
  } catch (err) {
    console.error('\n==============================================================');
    console.error('FAILED TO UPDATE FIREBASE CUSTOM CLAIMS');
    console.error('==============================================================');
    console.error(err instanceof Error ? err.message : String(err));
    console.error('\nTroubleshooting:');
    console.error(
      '1. Ensure you have authenticated with Application Default Credentials for this Firebase project:'
    );
    console.error('     gcloud auth application-default login');
    console.error(
      '   OR set GOOGLE_APPLICATION_CREDENTIALS to a service account key JSON path:'
    );
    console.error(
      '     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"'
    );
    console.error(
      '2. Ensure FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID matches your Firebase project.'
    );
    console.error(
      '3. Verify the target UID/email exists in Firebase Console → Authentication → Users (or pass --create with ADMIN_INIT_PASSWORD).'
    );
    console.error('==============================================================\n');
    process.exit(1);
  }
}

main();

