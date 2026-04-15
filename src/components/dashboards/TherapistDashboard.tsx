import type { DashboardStats } from '@/services/dashboard.service';
import { CalendarIcon, DocumentTextIcon, UsersIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';

type TherapistDashboardProps = {
  stats: DashboardStats;
};

export function TherapistDashboard({ stats }: TherapistDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Your schedule and assigned clients
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
              <p className="text-2xl font-bold text-gray-900">{stats.todaysAppointments}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center p-6">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignedClients}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center p-6">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Notes</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
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
          {stats.recentActivity.length > 0
            ? (
                <ul className="space-y-3">
                  {stats.recentActivity.map(activity => (
                    <li key={activity.id} className="rounded-md border border-gray-100 p-3">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                        {' '}
                        ·
                        {' '}
                        {activity.resource}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )
            : (
                <p className="text-gray-600">No schedule activity yet.</p>
              )}
        </div>
      </Card>
    </div>
  );
}
