/**
 * Firestore Security Rules Specification Test Suite
 * Verifies that all "Dirty Dozen" adversarial payloads and R2/CMS security constraints
 * are strictly enforced.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TEST_CASES: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Reject Base64 data:image payload in r2_media (Enforce Cloudflare R2 CDN URLs only)',
    collection: 'r2_media',
    docId: 'media_1',
    operation: 'create',
    auth: {
      uid: 'admin_1',
      email: 'merlinfiverr0@gmail.com',
      email_verified: true,
    },
    payload: {
      id: 'media_1',
      objectKey: 'tours/test.png',
      cdnUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
      folder: 'tours',
      fileName: 'test.png',
      contentType: 'image/png',
      sizeBytes: 1024,
      uploadedBy: 'admin_1',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Reject unverified admin email spoof on site_cms',
    collection: 'site_cms',
    docId: 'main',
    operation: 'update',
    auth: {
      uid: 'spoof_uid',
      email: 'merlinfiverr0@gmail.com',
      email_verified: false,
    },
    payload: { id: 'main' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Reject client-supplied actor bypass (bimondo-cms-admin) without verified admin auth',
    collection: 'site_cms',
    docId: 'main',
    operation: 'update',
    auth: null,
    payload: {
      id: 'main',
      updatedBy: 'bimondo-cms-admin',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Reject non-admin PII read on enquiries',
    collection: 'enquiries',
    docId: 'enq_1',
    operation: 'get',
    auth: {
      uid: 'visitor_1',
      email: 'visitor@example.com',
      email_verified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Reject public get on legacy faqs/r2_system_config document',
    collection: 'faqs',
    docId: 'r2_system_config',
    operation: 'get',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Reject public list containing legacy faqs/r2_system_config document',
    collection: 'faqs',
    docId: 'r2_system_config',
    operation: 'list',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Reject unauthenticated delete on r2_media or CMS collections',
    collection: 'r2_media',
    docId: 'media_1',
    operation: 'delete',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Reject self-assigned admin creation by non-admin user',
    collection: 'admins',
    docId: 'attacker_uid',
    operation: 'create',
    auth: {
      uid: 'attacker_uid',
      email: 'attacker@example.com',
      email_verified: true,
    },
    payload: {
      uid: 'attacker_uid',
      email: 'attacker@example.com',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Reject oversized message in enquiries (Denial of Wallet guard)',
    collection: 'enquiries',
    docId: 'enq_oversized',
    operation: 'create',
    auth: null,
    payload: {
      message: 'x'.repeat(5000),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Reject invalid status enum on enquiry update',
    collection: 'enquiries',
    docId: 'enq_1',
    operation: 'update',
    auth: {
      uid: 'admin_1',
      email: 'merlinfiverr0@gmail.com',
      email_verified: true,
    },
    payload: {
      status: 'invalid_state',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Reject unbounded array on site_cms',
    collection: 'site_cms',
    docId: 'main',
    operation: 'update',
    auth: {
      uid: 'admin_1',
      email: 'merlinfiverr0@gmail.com',
      email_verified: true,
    },
    payload: {
      tours: new Array(100).fill({}),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Reject spoofed uploadedBy UID on r2_media create',
    collection: 'r2_media',
    docId: 'media_3',
    operation: 'create',
    auth: {
      uid: 'admin_1',
      email: 'merlinfiverr0@gmail.com',
      email_verified: true,
    },
    payload: {
      uploadedBy: 'other_uid',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
