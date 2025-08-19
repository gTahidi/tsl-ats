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

  async getEventTypeById(id: number): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/event-types/${id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}`, 'cal-api-version': this.apiVersion },
      });

      if (response.status === 404) return null;
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch Cal.com event type by id: ${response.status} - ${errorData}`);
      }
      const json = await response.json();
      return json.data ?? null;
    } catch (error) {
      console.error('Error in getEventTypeById:', error);
      throw error;
    }
  }

  async getSlots(params: {
    eventTypeId: number;
    from: Date | string;
    to: Date | string;
    timeZone?: string;
  }): Promise<any> {
    const { eventTypeId, from, to, timeZone = 'UTC' } = params;
    const startISO = typeof from === 'string' ? new Date(from).toISOString() : from.toISOString();
    const endISO = typeof to === 'string' ? new Date(to).toISOString() : to.toISOString();

    // Cal.com v2 expects date-only values for start/end (YYYY-MM-DD)
    const startDate = startISO.slice(0, 10);
    const endDate = endISO.slice(0, 10);

    try {
      const attemptLogs: Array<{ url: string; status: number; body: string }> = [];

      // Primary: Use /v2/slots/available (working endpoint)
      const availablePath = '/v2/slots/available';
      const availableQS = new URLSearchParams({
        eventTypeId: String(eventTypeId),
        startTime: startISO,
        endTime: endISO,
        timeZone,
      });

      const url = new URL(`${this.baseUrl}${availablePath}`);
      availableQS.forEach((v, k) => url.searchParams.set(k, v));
      
      const resp = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'cal-api-version': this.apiVersion,
          'Accept': 'application/json',
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        // Transform the response to match expected format
        if (data?.data?.slots) {
          const slots = [];
          for (const [date, timeSlots] of Object.entries(data.data.slots)) {
            for (const slot of timeSlots as any[]) {
              slots.push(slot);
            }
          }
          return { slots };
        }
        return data;
      }

      const text = await resp.text();
      attemptLogs.push({ url: `${availablePath}?${url.searchParams.toString()}`, status: resp.status, body: text });

      // Fallback: Try legacy /v2/slots endpoint
      const path = '/v2/slots';
      
      // Helper to attempt a single GET with given query params
      const attemptFetch = async (qs: URLSearchParams, withFormat: boolean) => {
        const url = new URL(`${this.baseUrl}${path}`);
        qs.forEach((v, k) => url.searchParams.set(k, v));
        if (withFormat) url.searchParams.set('format', 'range');
        const resp = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'cal-api-version': this.apiVersion,
            'Accept': 'application/json',
          },
        });
        if (resp.ok) {
          return { ok: true as const, data: await resp.json() };
        }
        const text = await resp.text();
        attemptLogs.push({ url: `${path}?${url.searchParams.toString()}`, status: resp.status, body: text });
        return { ok: false as const, status: resp.status };
      };

      // 1) Fallback: by eventTypeId
      const baseQS1 = new URLSearchParams({
        eventTypeId: String(eventTypeId),
        start: startDate,
        end: endDate,
        timeZone,
      });
      for (const withFormat of [true, false]) {
        const r = await attemptFetch(baseQS1, withFormat);
        if (r.ok) return r.data;
        if (r.status >= 500) {
          const last = attemptLogs[attemptLogs.length - 1];
          throw new Error(`Failed to fetch Cal.com slots: ${r.status} - ${last.body} (url=${last.url})`);
        }
      }

      // 2) Fallback: fetch event type details, then try slug-based forms
      const et = await this.getEventTypeById(eventTypeId);
      const eventTypeSlug: string | undefined = et?.slug ?? et?.data?.slug;
      const username: string | undefined = et?.user?.username ?? et?.owner?.username ?? et?.data?.user?.username ?? et?.data?.owner?.username;
      const teamSlug: string | undefined = et?.team?.slug ?? et?.data?.team?.slug;
      const orgSlug: string | undefined = process.env.CALCOM_ORG_SLUG || et?.organization?.slug || et?.data?.organization?.slug;

      // Try slug + username
      if (eventTypeSlug && username) {
        const baseQS2 = new URLSearchParams({
          eventTypeSlug: eventTypeSlug,
          username: username,
          start: startDate,
          end: endDate,
          timeZone,
        });
        for (const withFormat of [true, false]) {
          const r = await attemptFetch(baseQS2, withFormat);
          if (r.ok) return r.data;
          if (r.status >= 500) {
            const last = attemptLogs[attemptLogs.length - 1];
            throw new Error(`Failed to fetch Cal.com slots: ${r.status} - ${last.body} (url=${last.url})`);
          }
        }
      }

      // Try slug + teamSlug (+ optional org)
      if (eventTypeSlug && teamSlug) {
        const baseQS3 = new URLSearchParams({
          eventTypeSlug: eventTypeSlug,
          teamSlug: teamSlug,
          start: startDate,
          end: endDate,
          timeZone,
        });
        if (orgSlug) baseQS3.set('organizationSlug', orgSlug);
        for (const withFormat of [true, false]) {
          const r = await attemptFetch(baseQS3, withFormat);
          if (r.ok) return r.data;
          if (r.status >= 500) {
            const last = attemptLogs[attemptLogs.length - 1];
            throw new Error(`Failed to fetch Cal.com slots: ${r.status} - ${last.body} (url=${last.url})`);
          }
        }
      }

      // 3) Final attempt: by id without cal-api-version header (in case of gateway/versioning quirk)
      const baseQS4 = new URLSearchParams({
        eventTypeId: String(eventTypeId),
        start: startDate,
        end: endDate,
        timeZone,
      });
      for (const withFormat of [true, false]) {
        const url = new URL(`${this.baseUrl}${path}`);
        baseQS4.forEach((v, k) => url.searchParams.set(k, v));
        if (withFormat) url.searchParams.set('format', 'range');
        const resp = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          },
        });
        if (resp.ok) return await resp.json();
        const text = await resp.text();
        attemptLogs.push({ url: `${path}?${url.searchParams.toString()}`, status: resp.status, body: text });
      }

      const diag = attemptLogs.map(a => `{status:${a.status},url:${a.url},body:${a.body}}`).join(' | ');
      throw new Error(`Failed to fetch Cal.com slots after attempts: ${diag}`);
    } catch (error) {
      console.error('Error in getSlots:', error);
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

    const bookingRequest = {
      start: startTime.toISOString(),
      attendee: {
        name: candidateName,
        email: candidateEmail,
        timeZone: candidateTimeZone
      },
      eventTypeId
    };

    try {
      const response = await fetch(`${this.baseUrl}/v2/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}`, 'cal-api-version': '2024-08-13' },
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
