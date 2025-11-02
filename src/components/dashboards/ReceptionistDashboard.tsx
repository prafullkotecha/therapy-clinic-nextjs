import { CalendarIcon, ClockIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';

export function ReceptionistDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Front Desk Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Today&apos;s schedule and check-in management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-center p-6">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today&apos;s Appointments</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center p-6">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-warning" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Awaiting Check-In</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center p-6">
            <div className="flex-shrink-0">
              <UserPlusIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Intakes</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Schedule</h2>
        </div>
        <div className="px-6 py-8">
          <p className="text-gray-600">Appointment schedule will be populated with real data in Phase 3</p>
        </div>
      </Card>
    </div>
  );
}
