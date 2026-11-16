import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="section wrap" style={{ paddingTop: '140px', paddingBottom: '120px' }}>
      <p className="eyebrow" style={{ color: 'var(--terracotta)' }}>
        404 — PAGE NOT FOUND
      </p>
      <h1 className="serif" style={{ fontSize: '42px', margin: '10px 0 14px' }}>
        This page could not be found
      </h1>
      <p style={{ color: 'var(--muted)', maxWidth: '480px', marginBottom: '24px' }}>
        The route you requested does not exist or has moved.
      </p>
      <Link href="/" className="pill dark">
        RETURN HOME
      </Link>
    </main>
  );
}
