import { createId } from '@paralleldrive/cuid2';

// --- TYPE DEFINITIONS for better type safety and code clarity ---

interface CalcomAttendee {
  name: string;
  email: string;
  timeZone: string;
}

interface CalcomBookingRequest {
  eventTypeId: number;
  start: string;
  attendees: CalcomAttendee[];
  idempotencyKey: string;
  lengthInMinutes: number;
  timeZone: string;
  language: string;
  metadata?: Record<string, any>;
  title?: string;
  description?: string;
  // The location field is intentionally omitted to debug the 500 error
}

interface CalcomBookingResponse {
  data: {
    id: number;
    uid: string;
    title: string;
    meetingUrl?: string;
  };
}

// --- REFACTORED SERVICE ---

export class CalcomService {
  private apiKey: string;
  private baseUrl: string;
  private apiVersion: string;

  constructor() {
    this.apiKey = process.env.CALCOM_API_KEY || '';
    this.baseUrl = process.env.CALCOM_API_URL || 'https://api.cal.com';
    this.apiVersion = '2024-06-14';

    if (!this.apiKey) {
      throw new Error('CALCOM_API_KEY environment variable is required');
    }
  }

  async createStaticEventType(eventDetails: {
    title: string;
    slug: string;
    lengthInMinutes: number;
    description?: string;
  }): Promise<any> {
    const { title, slug, lengthInMinutes, description } = eventDetails;
    try {
      const response = await fetch(`${this.baseUrl}/v2/event-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}`, 'cal-api-version': this.apiVersion },
        body: JSON.stringify({ title, slug, lengthInMinutes, description }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create static event type: ${errorData}`);
      }
      return (await response.json()).data;
    } catch (error) {
      throw error;
    }
  }

  async getEventTypeBySlug(slug: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/event-types?slug=${slug}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}`, 'cal-api-version': this.apiVersion },
      });

      if (response.status === 404) return null;
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch Cal.com event type: ${response.status} - ${errorData}`);
      }
      const eventTypes = await response.json();
      return eventTypes.data.find((et: any) => et.slug === slug) || null;
    } catch (error) {
      console.error('Error in getEventTypeBySlug:', error);
      throw error;
    }
  }

  async createBooking(params: {
    candidateName: string;
    candidateEmail: string;
    candidateTimeZone?: string;
    interviewerEmail?: string;
    interviewerName?: string;
    interviewerTimeZone?: string;
    startTime: Date;
    jobTitle?: string;
    eventTypeId: number;
    lengthInMinutes: number;
    metadata?: Record<string, any>;
  }): Promise<CalcomBookingResponse> {
    const {
      candidateName,
      candidateEmail,
      candidateTimeZone = 'UTC',
      interviewerEmail,
      interviewerName = 'Interviewer',
      interviewerTimeZone = 'UTC',
      startTime,
      jobTitle = 'Interview',
      eventTypeId,
      lengthInMinutes,
      metadata = {}
    } = params;

    const attendees: CalcomAttendee[] = [{ name: candidateName, email: candidateEmail, timeZone: candidateTimeZone }];
    if (interviewerEmail) {
      attendees.push({ name: interviewerName, email: interviewerEmail, timeZone: interviewerTimeZone });
    }

    const bookingRequest: CalcomBookingRequest = {
      eventTypeId,
      start: startTime.toISOString(),
      attendees,
      lengthInMinutes,
      idempotencyKey: createId(),
      timeZone: candidateTimeZone,
      language: 'en',
      metadata: { ...metadata, bookingType: 'interview', createdBy: 'ats-system' },
      title: `Interview: ${jobTitle} with ${candidateName}`,
      description: `Candidate interview for the ${jobTitle} position.`,
      // FIX: The `location` field has been removed. If this request succeeds,
      // the root cause is the Google Meet integration configuration on your Cal.com account.
    };

    try {
      const response = await fetch(`${this.baseUrl}/v2/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}`, 'cal-api-version': this.apiVersion },
        body: JSON.stringify(bookingRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Cal.com API error creating booking: ${response.status} - ${errorData}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating Cal.com booking:', error);
      throw error;
    }
  }

  async rescheduleBooking(
    bookingId: string,
    start: Date,
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/bookings/${bookingId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
          body: JSON.stringify({ start: start.toISOString() }),
        });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to reschedule Cal.com booking: ${errorData}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in rescheduleBooking:', error);
      throw error;
    }
  }

  async getBooking(bookingId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/bookings/${bookingId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}`, 'cal-api-version': this.apiVersion },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch Cal.com booking: ${response.status} - ${errorData}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in getBooking:', error);
      throw error;
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/bookings/${bookingId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
        });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to cancel Cal.com booking: ${errorData}`);
      }
    } catch (error) {
      console.error('Error in cancelBooking:', error);
      throw error;
    }
  }
}

export const calcomService = new CalcomService();
