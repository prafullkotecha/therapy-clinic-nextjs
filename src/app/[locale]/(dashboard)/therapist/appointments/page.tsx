'use client';

import type { EventClickArg, EventInput } from '@fullcalendar/core/index.js';
import { useEffect, useMemo, useState } from 'react';
import { AppointmentCalendar } from '@/components/scheduling/AppointmentCalendar';
import { AppointmentDetailPanel } from '@/components/scheduling/AppointmentDetailPanel';

type AppointmentItem = {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string | null;
  appointmentType: string;
  appointmentNotes: string | null;
};

export default function TherapistAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AppointmentItem | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/appointments');
      if (!response.ok) {
        setAppointments([]);
        setLoadError('Failed to load appointments. Please try again.');
        return;
      }
      const data = await response.json() as AppointmentItem[];
      setAppointments(data);
      setLoadError(null);
    };

    void load();
  }, []);

  const events = useMemo<EventInput[]>(() => appointments.map(appointment => ({
    id: appointment.id,
    title: appointment.appointmentType,
    start: `${appointment.appointmentDate}T${appointment.startTime}`,
    end: `${appointment.appointmentDate}T${appointment.endTime}`,
  })), [appointments]);

  const handleEventClick = (event: EventClickArg) => {
    const found = appointments.find(appointment => appointment.id === event.event.id) || null;
    setSelected(found);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
      {loadError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}
      <AppointmentCalendar events={events} onEventClick={handleEventClick} />
      <AppointmentDetailPanel
        open={open}
        appointment={selected
          ? {
              id: selected.id,
              title: selected.appointmentType,
              start: `${selected.appointmentDate} ${selected.startTime}`,
              end: `${selected.appointmentDate} ${selected.endTime}`,
              status: selected.status || undefined,
              notes: selected.appointmentNotes,
            }
          : null}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
