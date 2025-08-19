'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Select, Calendar, Button, Space, Typography, Spin, message, Divider, Empty, Radio } from 'antd';
import type { CalendarProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ScheduleInterviewModalProps {
  open: boolean;
  onClose: () => void;
  jobId?: string;
  templateId?: string;
}

function normalizeSlots(payload: any): Array<{ start: string; end?: string }> {
  // The API response is an object with a 'slots' key: { slots: [ { time: '...' }, ... ] }
  if (payload && Array.isArray(payload.slots)) {
    return payload.slots.map((slot: any) => ({
      start: slot.time, // Correctly use 'time' property from the API response
      end: slot.time,   // Default end time to start time as it's not provided
    }));
  }
  return [];
}

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({ open, onClose, jobId, templateId }) => {
  const queryClient = useQueryClient();
  const [candidateId, setCandidateId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end?: string } | null>(null);
  const [booking, setBooking] = useState(false);
  const [days] = useState<number>(30); // Fetch slots for the next 30 days

  const defaultTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);
  const [timeZone] = useState<string>(defaultTz);

  // Candidates for the selected job
  const { data: candidates, isFetching: loadingCandidates } = useQuery<any[]>({
    queryKey: ['job-candidates', jobId],
    enabled: open && !!jobId,
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/candidates`);
      if (!res.ok) throw new Error('Failed to fetch candidates');
      return res.json();
    },
  });

  const qualifiedCandidates = useMemo(() => (candidates || []).filter((c: any) => c.qualified), [candidates]);
  const candidateOptions = useMemo(
    () =>
      qualifiedCandidates.map((c: any) => ({
        value: c.id,
        label: `${c?.persona?.name ?? ''} ${c?.persona?.surname ?? ''} (${c?.persona?.email ?? ''})`.trim(),
      })),
    [qualifiedCandidates]
  );

  // Ensure a Cal.com Event Type exists for the selected template (auto-resolve/create & persist)
  const { data: ensureData, isFetching: ensuringEventType, error: ensureError } = useQuery<any>({
    queryKey: ['ensure-calcom', templateId, open],
    enabled: open && !!templateId,
    queryFn: async () => {
      const res = await fetch(`/api/process-step-templates/${templateId}/ensure-calcom`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to ensure event type');
      }
      return json;
    },
  });

  // Slots for template
  const { data: slotPayload, isFetching: loadingSlots, refetch: refetchSlots, error: slotsError } = useQuery<any>({
    queryKey: ['slots', templateId, timeZone, days, open, ensureData?.calcomEventTypeId, candidateId],
    enabled: open && !!templateId && !!ensureData?.calcomEventTypeId && !!candidateId,
    queryFn: async () => {
      const url = new URL('/api/slots', window.location.origin);
      url.searchParams.set('templateId', String(templateId));
      url.searchParams.set('days', String(days));
      url.searchParams.set('timeZone', timeZone);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to fetch slots');
      }
      console.log('Slots API response:', json); // Debug log
      return json;
    },
  });

  const slots = useMemo(() => normalizeSlots(slotPayload), [slotPayload]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Array<{ start: string; end?: string }>>();
    slots.forEach((s) => {
      const d = dayjs(s.start).format('YYYY-MM-DD');
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    });
    // sort times per day
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());
      map.set(k, arr);
    }
    return map;
  }, [slots]);

  // Set a default selected date when slots load
  useEffect(() => {
    if (!open) return;

    if (selectedDate && slotsByDate.has(selectedDate.format('YYYY-MM-DD'))) {
      return;
    }

    const firstDay = Array.from(slotsByDate.keys()).sort()[0];
    if (firstDay) {
      setSelectedDate(dayjs(firstDay));
    } else {
      setSelectedDate(null);
    }
    setSelectedSlot(null);
  }, [open, slotsByDate]);

  // Reset state on close/open toggles
  useEffect(() => {
    if (!open) {
      setCandidateId(undefined);
      setSelectedDate(null);
      setSelectedSlot(null);
    }
  }, [open]);

  const handleBook = async () => {
    if (!candidateId) {
      message.warning('Select a candidate');
      return;
    }
    if (!templateId) {
      message.warning('Select a stage');
      return;
    }
    if (!selectedSlot?.start) {
      message.warning('Select a time slot');
      return;
    }

    // Determine length in minutes if end is available
    const lengthInMinutes = selectedSlot.end
      ? Math.max(15, Math.round((dayjs(selectedSlot.end).diff(dayjs(selectedSlot.start), 'minute'))))
      : 60;

    try {
      setBooking(true);
      const res = await fetch('/api/interviews/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          templateId,
          start: selectedSlot.start,
          timeZone,
          lengthInMinutes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to book interview');
      }
      message.success('Interview scheduled');
      // Invalidate interview lists
      await queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'interviews' });
      onClose();
    } catch (e: any) {
      message.error(e?.message || 'Failed to book interview');
    } finally {
      setBooking(false);
    }
  };

  return (
    <Modal
      title="Schedule Interview"
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="book" type="primary" onClick={handleBook} loading={booking} disabled={!candidateId || !selectedSlot}>
          Book Interview
        </Button>,
      ]}
    >
      {/* Candidate selection */}
      <div className="mb-3">
        <Typography.Text type="secondary">Candidate</Typography.Text>
        <div>
          <Select
            showSearch
            placeholder={jobId ? 'Select candidate' : 'Select a job first'}
            style={{ width: '100%' }}
            value={candidateId}
            onChange={setCandidateId}
            options={candidateOptions}
            loading={loadingCandidates}
            disabled={!jobId}
            optionFilterProp="label"
          />
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Calendar and Slots Picker */}
      <div className="flex gap-6">
        {/* Left Panel: Calendar */}
        <div style={{ width: 320 }}>
          <Calendar 
            fullscreen={false} 
            value={selectedDate || undefined}
            onSelect={(date) => {
              if (slotsByDate.has(date.format('YYYY-MM-DD'))) {
                setSelectedDate(date);
                setSelectedSlot(null);
              }
            }}
            disabledDate={(current) => {
              if (!current) return false;
              if (current.isBefore(dayjs().startOf('day'))) return true;
              if (!slotsByDate.has(current.format('YYYY-MM-DD'))) return true;
              return false;
            }}
          />
        </div>

        {/* Right Panel: Time Slots */}
        <div style={{ flex: 1 }}>
          <Typography.Text className="block mb-3">
            {selectedDate ? `Available times for ${selectedDate.format('dddd, MMMM D')}` : 'Select a date'}
          </Typography.Text>
          <div style={{ minHeight: 200, maxHeight: 220, overflowY: 'auto' }}>
            {!candidateId ? (
              <Empty description="Select a candidate first" />
            ) : loadingSlots ? (
              <div className="flex items-center justify-center h-full"><Spin /></div>
            ) : slotsError ? (
              <Empty description="Failed to load slots" />
            ) : selectedDate && (slotsByDate.get(selectedDate.format('YYYY-MM-DD')) || []).length > 0 ? (
              <Radio.Group 
                onChange={(e) => setSelectedSlot(e.target.value)} 
                value={selectedSlot}
                className="flex flex-col gap-2"
              >
                {(slotsByDate.get(selectedDate.format('YYYY-MM-DD')) || []).map((slot) => (
                  <Radio.Button key={slot.start} value={slot}>
                    {dayjs(slot.start).format('HH:mm')}
                  </Radio.Button>
                ))}
              </Radio.Group>
            ) : (
              <Empty description="No available slots on this date" />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ScheduleInterviewModal;
