import { NextRequest } from 'next/server';
import { handleBookingAvailabilityGet } from '@/lib/booking-handlers';

export async function GET(req: NextRequest) {
  return handleBookingAvailabilityGet(req, process.env);
}
