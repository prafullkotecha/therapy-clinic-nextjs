'use client';

type AppointmentDetail = {
  id: string;
  title: string;
  start: string;
  end: string;
  status?: string;
  notes?: string | null;
};

type AppointmentDetailPanelProps = {
  open: boolean;
  appointment: AppointmentDetail | null;
  onClose: () => void;
};

export function AppointmentDetailPanel({ open, appointment, onClose }: AppointmentDetailPanelProps) {
  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">Appointment Details</h2>
        <button type="button" className="rounded p-2 text-sm text-gray-600 hover:bg-gray-100" onClick={onClose}>Close</button>
      </div>
      <div className="space-y-3 p-4 text-sm text-gray-700">
        {appointment
          ? (
              <>
                <div><span className="font-medium">Title:</span> {appointment.title}</div>
                <div><span className="font-medium">Start:</span> {appointment.start}</div>
                <div><span className="font-medium">End:</span> {appointment.end}</div>
                <div><span className="font-medium">Status:</span> {appointment.status || 'scheduled'}</div>
                <div><span className="font-medium">Notes:</span> {appointment.notes || '—'}</div>
              </>
            )
          : <p>No appointment selected.</p>}
      </div>
    </div>
  );
}
