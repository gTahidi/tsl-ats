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
  timeZone: string; // FIX: Added required timeZone property
  language: string; // FIX: Added required language property
  metadata?: Record<string, any>;
  title?: string;
  description?: string;
  location?: string;
}

interface CalcomBookingResponse {
  // This interface should match the structure of the booking object
  // returned by the Cal.com API. It's kept brief here for clarity.
  data: {
    id: number;
    uid: string;
    title: string;
    meetingUrl?: string;
    // ... other properties
  };
}

// --- REFACTORED SERVICE ---

// The class itself must be exported to be visible to other modules.
export class CalcomService {
  private apiKey: string;
  private baseUrl: string;
  private apiVersion: string;

  constructor() {
    this.apiKey = process.env.CALCOM_API_KEY || '';
    this.baseUrl = process.env.CALCOM_API_URL || 'https://api.cal.com';
    this.apiVersion = '2024-06-14'; // Lock the API version for stability

    if (!this.apiKey) {
      throw new Error('CALCOM_API_KEY environment variable is required');
    }
  }

  /**
   * Creates a static event type. This method now ONLY creates and does not
   * handle get-or-create logic, which is better handled by the caller.
   */
  async createStaticEventType(eventDetails: {
    title: string;
    slug: string;
    lengthInMinutes: number;
    description?: string;
  }): Promise<any> {
    const { title, slug, lengthInMinutes, description } = eventDetails;
    try {
      // This method now ONLY attempts to create.
      const response = await fetch(`${this.baseUrl}/v2/event-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}`, 'cal-api-version': this.apiVersion },
        body: JSON.stringify({ title, slug, lengthInMinutes, description }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        // The caller is now responsible for handling conflicts.
        throw new Error(`Failed to create static event type: ${errorData}`);
      }

      const newEventType = await response.json();
      return newEventType.data;

    } catch (error) {
      // We re-throw the original error to allow for specific handling by the caller.
      throw error;
    }
  }

  /**
   * Get an event type by its slug with improved error handling.
   */
  async getEventTypeBySlug(slug: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/event-types?slug=${slug}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}`, 'cal-api-version': this.apiVersion },
      });

      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch Cal.com event type: ${response.status} - ${errorData}`);
      }

      const eventTypes = await response.json();
      const eventType = eventTypes.data.find((et: any) => et.slug === slug);
      return eventType || null;
    } catch (error) {
      console.error('Error in getEventTypeBySlug:', error);
      throw error;
    }
  }

  /**
   * Create a booking with Google Meet integration, using best practices.
   */
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
      location: "integrations:google:meet",
      // FIX: Add the missing top-level timeZone and language properties.
      // We use the candidate's timezone as the primary for the event.
      timeZone: candidateTimeZone,
      language: 'en', // Setting language to English as a default
      metadata: { ...metadata, jobTitle, bookingType: 'interview', createdBy: 'ats-system' },
      title: `Interview: ${jobTitle} with ${candidateName}`,
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
}

// The singleton instance MUST be exported to be used in other files.
// It is created from the exported CalcomService class defined above.
export const calcomService = new CalcomService();
