'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Select, DatePicker, Button, Space, Typography, Spin, message, Divider, Empty } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ScheduleInterviewModalProps {
  open: boolean;
  onClose: () => void;
  jobId?: string;
  templateId?: string;
}

function normalizeSlots(payload: any): Array<{ start: string; end?: string }> {
  if (!payload) return [];
  // Try common shapes
  const maybeSlots = payload?.data?.slots || payload?.slots || payload?.data || payload?.data?.data || [];
  if (Array.isArray(maybeSlots)) {
    // If array of objects with start/end
    if (maybeSlots.length > 0 && typeof maybeSlots[0] === 'object') {
      return maybeSlots
        .map((s: any) => ({ start: s.start ?? s?.startTime ?? s, end: s.end ?? s?.endTime }))
        .filter((s: any) => typeof s.start === 'string');
    }
    // If array of strings
    return maybeSlots.filter((s) => typeof s === 'string').map((s) => ({ start: s }));
  }
  // Try nested slots under days
  const days = payload?.data?.days || payload?.days;
  if (Array.isArray(days)) {
    const res: Array<{ start: string; end?: string }> = [];
    days.forEach((d: any) => {
      if (Array.isArray(d?.slots)) {
        d.slots.forEach((s: any) => {
          if (typeof s === 'string') res.push({ start: s });
          else if (s?.start) res.push({ start: s.start, end: s.end });
        });
      }
    });
    return res;
  }
  return [];
}

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({ open, onClose, jobId, templateId }) => {
  const queryClient = useQueryClient();
  const [candidateId, setCandidateId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end?: string } | null>(null);
  const [booking, setBooking] = useState(false);

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

  // Slots for template
  const { data: slotPayload, isFetching: loadingSlots, refetch: refetchSlots, error: slotsError } = useQuery<any>({
    queryKey: ['slots', templateId, timeZone, open],
    enabled: open && !!templateId,
    queryFn: async () => {
      const url = new URL('/api/slots', window.location.origin);
      url.searchParams.set('templateId', String(templateId));
      url.searchParams.set('days', '14');
      url.searchParams.set('timeZone', timeZone);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to fetch slots');
      }
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
    if (selectedDate && slotsByDate.has(selectedDate.format('YYYY-MM-DD'))) return;
    const firstDay = Array.from(slotsByDate.keys()).sort()[0];
    if (firstDay) setSelectedDate(dayjs(firstDay));
    else setSelectedDate(null);
    setSelectedSlot(null);
  }, [open, slotsByDate, selectedDate]);

  // Reset state on close/open toggles
  useEffect(() => {
    if (!open) {
      setCandidateId(undefined);
      setSelectedDate(null);
      setSelectedSlot(null);
    }
  }, [open]);

  const timesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [] as Array<{ start: string; end?: string }>; 
    return slotsByDate.get(selectedDate.format('YYYY-MM-DD')) || [];
  }, [selectedDate, slotsByDate]);

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

      {/* Slots area */}
      <div className="mb-2">
        <Space style={{ marginBottom: 8 }}>
          <Typography.Text type="secondary">Time zone:</Typography.Text>
          <Typography.Text>{timeZone}</Typography.Text>
        </Space>
        <div className="flex gap-4 items-start">
          <div>
            <Typography.Text type="secondary">Date</Typography.Text>
            <div>
              <DatePicker
                value={selectedDate}
                onChange={(d) => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
                disabledDate={(current) => {
                  if (!current) return false;
                  const key = current.format('YYYY-MM-DD');
                  return !slotsByDate.has(key);
                }}
                style={{ width: 240 }}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Typography.Text type="secondary">Available times</Typography.Text>
            <div style={{ minHeight: 120 }}>
              {loadingSlots ? (
                <div className="flex items-center justify-center" style={{ height: 120 }}>
                  <Spin />
                </div>
              ) : slotsError ? (
                <Empty description={(slotsError as any)?.message || 'Failed to load slots'} />
              ) : timesForSelectedDate.length === 0 ? (
                <Empty description={selectedDate ? 'No slots on selected date' : 'No available slots found'} />
              ) : (
                <div className="flex flex-wrap gap-8">
                  {timesForSelectedDate.map((s) => {
                    const start = dayjs(s.start);
                    const label = start.format('ddd, MMM D HH:mm');
                    const active = selectedSlot?.start === s.start;
                    return (
                      <Button
                        key={s.start}
                        type={active ? 'primary' : 'default'}
                        onClick={() => setSelectedSlot(s)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ScheduleInterviewModal;
