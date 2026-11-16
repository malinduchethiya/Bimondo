import { NextRequest } from 'next/server';
import {
  handleBookingSettingsGet,
  handleBookingSettingsPost,
} from '@/lib/booking-handlers';

export async function GET() {
  return handleBookingSettingsGet(process.env);
}

export async function POST(req: NextRequest) {
  return handleBookingSettingsPost(req, process.env);
}
