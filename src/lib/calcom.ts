import { createId } from '@paralleldrive/cuid2';

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
    this.apiVersion = '2024-06-14';

    if (!this.apiKey) {
      throw new Error('CALCOM_API_KEY environment variable is required');
    }
  }

  /**
   * Create a static event type for interviews if it doesn't exist.
   */
  async createStaticEventType(eventDetails: {
    title: string;
    slug: string;
    lengthInMinutes: number;
    description?: string;
  }): Promise<any> {
    const { title, slug, lengthInMinutes, description } = eventDetails;
    try {
      // First, check if an event with the same slug already exists
      const existingEventType = await this.getEventTypeBySlug(slug);
      if (existingEventType) {
        console.log(`Event type with slug '${slug}' already exists with ID: ${existingEventType.id}`);
        return existingEventType;
      }

      // If it doesn't exist, create it
      const response = await fetch(`${this.baseUrl}/v2/event-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'cal-api-version': this.apiVersion,
        },
        body: JSON.stringify({
          title,
          slug,
          lengthInMinutes,
          description,
          // Add other static configurations as needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create static event type: ${errorData}`);
      }

      const newEventType = await response.json();
      console.log(`Successfully created static event type with ID: ${newEventType.data.id}`);
      return newEventType.data;
    } catch (error) {
      console.error('Error in createStaticEventType:', error);
      throw error;
    }
  }

  /**
   * Get an event type by its slug.
   */
  async getEventTypeBySlug(slug: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/event-types?slug=${slug}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'cal-api-version': this.apiVersion,
        },
      });

      if (!response.ok) {
        // If the API returns a 404 or other error, we can assume the event type doesn't exist
        return null;
      }

      const eventTypes = await response.json();
      // The response might be an array of event types, find the one with the matching slug
      const eventType = eventTypes.data.find((et: any) => et.slug === slug);
      return eventType || null;
    } catch (error) {
      console.error('Error in getEventTypeBySlug:', error);
      return null;
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
    jobTitle?: string;
    eventTypeId: number;
    lengthInMinutes?: number;
    metadata?: Record<string, any>;
  }): Promise<CalcomBookingResponse> {
    const {
      candidateName,
      candidateEmail,
      candidateTimeZone = 'UTC',
      interviewerEmail,
      startTime,
      jobTitle = 'Interview',
      eventTypeId,
      lengthInMinutes = 60,
      metadata = {}
    } = params;

    const bookingRequest: any = {
      eventTypeId,
      start: startTime.toISOString(),
      responses: {
        name: candidateName,
        email: candidateEmail,
        guests: interviewerEmail ? [interviewerEmail] : [],
        location: {
          value: "integrations:google:meet",
          optionValue: ""
        }
      },
      metadata: {
        ...metadata,
        jobTitle,
        bookingType: 'interview',
        createdBy: 'ats-system'
      },
      timeZone: candidateTimeZone,
      language: 'en',
      lengthInMinutes,
      title: `Interview with ${candidateName}`,
      description: `Interview for ${jobTitle}`,
      status: 'PENDING',
      smsReminderNumber: null
    };

    // Add interviewer as guest if provided

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
      console.debug('CalcomService.createBooking - raw response status:', response.status);

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
