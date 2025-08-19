import { calcomService } from '@/lib/calcom';

/**
 * Determines the status of an interview based on its start and end times.
 */
export function getInterviewStatus(
  startTime: Date | null,
  endTime: Date | null
): 'scheduled' | 'in_progress' | 'completed' | 'cancelled' {
  const now = new Date();
  // If startTime is missing, treat as scheduled (cannot have started)
  if (!startTime) return 'scheduled';
  if (now < startTime) return 'scheduled';
  // If endTime is present, use it to determine in_progress vs completed
  if (endTime) {
    if (now <= endTime) return 'in_progress';
    return 'completed';
  }
  // If endTime is missing, assume interview is in progress once started
  return 'in_progress';
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
