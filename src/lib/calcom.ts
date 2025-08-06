import { createId } from '@paralleldrive/cuid2';

interface CalcomBookingRequest {
  start: string; // ISO 8601 UTC timestamp
  attendee: {
    name: string;
    email: string;
    timeZone: string;
    phoneNumber?: string;
    language?: string;
  };
  eventTypeId?: number;
  eventTypeSlug?: string;
  username?: string;
  teamSlug?: string;
  organizationSlug?: string;
  guests?: string[];
  location?: {
    type: string;
    value?: string;
  };
  metadata?: Record<string, any>;
  lengthInMinutes?: number;
  instant?: boolean;
}

interface CalcomBookingResponse {
  status: string;
  data: {
    id: number;
    uid: string;
    title: string;
    description?: string;
    hosts: Array<{
      id: number;
      name: string;
      email: string;
      username: string;
      timeZone: string;
    }>;
    status: string;
    start: string;
    end: string;
    duration: number;
    eventTypeId: number;
    meetingUrl?: string;
    location?: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
    attendees: Array<{
      name: string;
      email: string;
      timeZone: string;
      language: string;
      absent: boolean;
      phoneNumber?: string;
    }>;
    guests?: string[];
  };
}

export class CalcomService {
  private apiKey: string;
  private baseUrl: string;
  private apiVersion: string;

  constructor() {
    this.apiKey = process.env.CALCOM_API_KEY || '';
    this.baseUrl = process.env.CALCOM_API_URL || 'https://api.cal.com';
    this.apiVersion = '2024-08-13';

    if (!this.apiKey) {
      throw new Error('CALCOM_API_KEY environment variable is required');
    }
  }

  /**
   * Create a booking with Google Meet integration
   */
  async createBooking(params: {
    candidateName: string;
    candidateEmail: string;
    candidateTimeZone?: string;
    interviewerEmail?: string;
    startTime: Date;
    lengthInMinutes?: number;
    jobTitle?: string;
    eventTypeId?: number;
    eventTypeSlug?: string;
    username?: string;
    metadata?: Record<string, any>;
  }): Promise<CalcomBookingResponse> {
    const {
      candidateName,
      candidateEmail,
      candidateTimeZone = 'UTC',
      interviewerEmail,
      startTime,
      lengthInMinutes = 60,
      jobTitle = 'Interview',
      eventTypeId,
      eventTypeSlug = 'interview',
      username = 'interviewer',
      metadata = {}
    } = params;

    const bookingRequest: CalcomBookingRequest = {
      start: startTime.toISOString(),
      attendee: {
        name: candidateName,
        email: candidateEmail,
        timeZone: candidateTimeZone,
        language: 'en'
      },
      lengthInMinutes,
      location: {
        type: 'integrations:google:meet' // Google Meet integration
      },
      metadata: {
        ...metadata,
        jobTitle,
        bookingType: 'interview',
        createdBy: 'ats-system'
      }
    };

    // Add event type identification
    if (eventTypeId) {
      bookingRequest.eventTypeId = eventTypeId;
    } else {
      bookingRequest.eventTypeSlug = eventTypeSlug;
      bookingRequest.username = username;
    }

    // Add interviewer as guest if provided
    if (interviewerEmail) {
      bookingRequest.guests = [interviewerEmail];
    }

    try {
      const response = await fetch(`${this.baseUrl}/v2/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'cal-api-version': this.apiVersion
        },
        body: JSON.stringify(bookingRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Cal.com API error: ${response.status} - ${errorData}`);
      }

      const result: CalcomBookingResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating Cal.com booking:', error);
      throw error;
    }
  }

  /**
   * Get a booking by ID
   */
  async getBooking(bookingId: string): Promise<CalcomBookingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/bookings/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'cal-api-version': this.apiVersion
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Cal.com API error: ${response.status} - ${errorData}`);
      }

      const result: CalcomBookingResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching Cal.com booking:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/bookings/${bookingId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'cal-api-version': this.apiVersion
        },
        body: JSON.stringify({
          reason: reason || 'Cancelled by ATS system'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Cal.com API error: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Error cancelling Cal.com booking:', error);
      throw error;
    }
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    bookingId: string, 
    newStartTime: Date,
    reason?: string
  ): Promise<CalcomBookingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/bookings/${bookingId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'cal-api-version': this.apiVersion
        },
        body: JSON.stringify({
          start: newStartTime.toISOString(),
          reason: reason || 'Rescheduled by ATS system'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Cal.com API error: ${response.status} - ${errorData}`);
      }

      const result: CalcomBookingResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error rescheduling Cal.com booking:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const calcomService = new CalcomService();
