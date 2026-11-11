# Firestore Zero-Trust Security Specification (Cloudflare R2 + Firebase)

## 1. Data Invariants
1. **Zero Image Storage in Firestore Invariant**: Firestore documents in `/site_cms/{docId}` and `/r2_media/{mediaId}` MUST NEVER store raw binary or `data:image/...;base64` strings. All images live exclusively in the Cloudflare R2 bucket and are accessed in Firebase only via `https://` R2 CDN links (`cdnUrl.size() <= 500 && cdnUrl.matches('^https?://[^\\s]+$')`).
2. **Admin Identity Invariant**: Write operations to `/site_cms/{docId}`, `/r2_media/{mediaId}`, and `/admins/{adminUid}`, as well as read/update/delete operations on `/enquiries/{enquiryId}`, require a verified administrator (`isSignedIn() && request.auth.token.email_verified == true && (request.auth.token.email == 'merlinfiverr0@gmail.com' || exists(/databases/$(database)/documents/admins/$(request.auth.uid)))`).
3. **PII Isolation Invariant**: Customer enquiries in `/enquiries/{enquiryId}` contain traveller PII (`name`, `email`, `message`) and MUST NOT be readable (`get` or `list`) by unauthenticated visitors or non-admin users.
4. **Strict Key & Size Enforcement Invariant**: Every string field enforces strict `.size()` bounds and `keys().hasAll(...)` / `keys().hasOnly(...)` guards to prevent Shadow Updates and Denial-of-Wallet attacks.
5. **Temporal & Immutable Identity Invariant**: `createdAt` must equal `request.time` on creation and remain immutable on update; `updatedAt` must equal `request.time` on update.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Base64 Image Injection in `r2_media`)**: Attempting to write `cdnUrl: "data:image/png;base64,iVBORw0KGgoAAAANS..."` to `/r2_media/img_1`. -> `PERMISSION_DENIED`.
2. **Payload 2 (Unverified Admin Email Spoof)**: Authenticated user with `email: "merlinfiverr0@gmail.com"` but `email_verified: false` attempting to update `/site_cms/main`. -> `PERMISSION_DENIED`.
3. **Payload 3 (Shadow Ghost Field on `site_cms`)**: Admin sending valid `SiteCmsConfig` fields plus `"isSuperAdmin": true` to `/site_cms/main`. -> `PERMISSION_DENIED`.
4. **Payload 4 (Unauthorized PII Read on `enquiries`)**: Non-admin user attempting `get` or `list` on `/enquiries/enq_1`. -> `PERMISSION_DENIED`.
5. **Payload 5 (ID Poisoning Attack)**: Creating `/r2_media/{maliciousId}` with a 300-character or special-character document ID. -> `PERMISSION_DENIED`.
6. **Payload 6 (Timestamp Forgery on `r2_media`)**: Creating `/r2_media/img_1` with a past or future client-supplied `createdAt` timestamp instead of `request.time`. -> `PERMISSION_DENIED`.
7. **Payload 7 (Immutable `createdAt` Mutation)**: Updating `/r2_media/img_1` while altering `createdAt`. -> `PERMISSION_DENIED`.
8. **Payload 8 (Privilege Escalation in `/admins`)**: Non-admin authenticated user attempting to create `/admins/{theirUid}`. -> `PERMISSION_DENIED`.
9. **Payload 9 (Oversized String Denial-of-Wallet in `enquiries`)**: Submitting an enquiry with a 50,000-character `message` field (limit is 2000). -> `PERMISSION_DENIED`.
10. **Payload 10 (Invalid Status Enum on `enquiries`)**: Creating `/enquiries/enq_1` with `status: "replied"` instead of initial `"new"`, or updating to `"hacked"`. -> `PERMISSION_DENIED`.
11. **Payload 11 (Unbounded Array Injection in `site_cms`)**: Writing 500 items into `tours` array (limit is 50). -> `PERMISSION_DENIED`.
12. **Payload 12 (Identity Mismatch on `r2_media`)**: Admin creating `/r2_media/img_1` where `uploadedBy` does not match `request.auth.uid`. -> `PERMISSION_DENIED`.
