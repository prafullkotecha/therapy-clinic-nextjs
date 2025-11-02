import { CheckCircleIcon, CreditCardIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';

export function BillingDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Outstanding invoices and payment tracking
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-center p-6">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-warning" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unbilled Sessions</p>
              <p className="text-2xl font-bold text-gray-900">15</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center p-6">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">$8,420</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center p-6">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-success" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paid This Month</p>
              <p className="text-2xl font-bold text-gray-900">$42,150</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Outstanding Invoices */}
      <Card>
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Outstanding Invoices</h2>
        </div>
        <div className="px-6 py-8">
          <p className="text-gray-600">Invoice list will be populated with real data in Phase 3</p>
        </div>
      </Card>
    </div>
  );
}
