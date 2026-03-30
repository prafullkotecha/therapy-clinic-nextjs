'use client';

import type { EventClickArg, EventInput } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';

type AppointmentCalendarProps = {
  events: EventInput[];
  onEventClick: (event: EventClickArg) => void;
};

export function AppointmentCalendar({ events, onEventClick }: AppointmentCalendarProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={onEventClick}
        height="auto"
      />
    </div>
  );
}
