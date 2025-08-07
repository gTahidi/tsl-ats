import { calcomService } from '@/lib/calcom';

/**
 * Determines the status of an interview based on its start and end times.
 */
export function getInterviewStatus(
  startTime: Date,
  endTime: Date
): 'scheduled' | 'in_progress' | 'completed' | 'cancelled' {
  const now = new Date();
  if (now < startTime) {
    return 'scheduled';
  }
  if (now >= startTime && now <= endTime) {
    return 'in_progress';
  }
  return 'completed';
}

/**
 * Fetches the meeting URL from Cal.com if a booking ID exists.
 */
export async function getMeetingUrl(calComBookingId: string | null): Promise<string | null> {
  if (!calComBookingId) {
    return null;
  }
  try {
    const booking = await calcomService.getBooking(calComBookingId);
    return booking.data.meetingUrl || null;
  } catch (error) {
    console.error(`Failed to fetch meeting URL for booking ${calComBookingId}:`, error);
    return null;
  }
}
