import { NextRequest } from 'next/server';
import { handleBookingVerifyGet } from '@/lib/booking-handlers';

export async function GET(req: NextRequest) {
  return handleBookingVerifyGet(req, process.env);
}
