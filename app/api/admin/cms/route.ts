import { NextRequest, NextResponse } from 'next/server';
import {
  appendCustomerEnquiry,
  getDefaultCmsData,
  readSiteCmsData,
  SiteCmsData,
  writeSiteCmsData,
} from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = readSiteCmsData();
  return NextResponse.json({ cms: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body?.action === 'submit_enquiry' && body?.enquiry) {
      const created = appendCustomerEnquiry({
        name: String(body.enquiry.name || '').trim(),
        email: String(body.enquiry.email || '').trim(),
        phone: String(body.enquiry.phone || '').trim(),
        bookingMethod: body.enquiry.bookingMethod || 'direct_admin',
        selectedPackage: String(
          body.enquiry.selectedPackage || 'Custom Tailor-Made Journey'
        ).trim(),
        arrival: String(body.enquiry.arrival || '').trim(),
        guests: String(body.enquiry.guests || '').trim(),
        duration: String(body.enquiry.duration || '').trim(),
        style: String(body.enquiry.style || '').trim(),
        message: String(body.enquiry.message || '').trim(),
      });
      return NextResponse.json({
        ok: true,
        enquiry: created,
        cms: readSiteCmsData(),
      });
    }

    if (body?.action === 'reset_defaults') {
      const defaults = getDefaultCmsData();
      const updated = writeSiteCmsData(defaults);
      return NextResponse.json({ ok: true, cms: updated });
    }

    const patch: Partial<SiteCmsData> = body?.cms || {};
    const updated = writeSiteCmsData(patch);
    return NextResponse.json({ ok: true, cms: updated });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to update CMS store.',
      },
      { status: 400 }
    );
  }
}
