import React, { useState } from 'react';
import {
  Download,
  Plus,
  Banknote,
  CheckCircle,
  Clock,
  Search,
  Receipt,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useStore, useClinic, useClinicInvoices, useClinicPatients } from '../../hooks/useStore';
import { Invoice } from '../../types';
import { generateInvoicePDF } from '../../lib/pdf-generator';

export interface BillingDashboardProps {
  onOpenCreateInvoice: () => void;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  onOpenCreateInvoice,
}) => {
  const invoices = useClinicInvoices();
  const patients = useClinicPatients();
  const currentClinic = useClinic();
  const isLoading = useStore((state) => state.isLoading);

  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Financial aggregates
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const paidRevenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((acc, inv) => acc + inv.total, 0);
  const pendingReceivables = invoices
    .filter((inv) => inv.status === 'pending')
    .reduce((acc, inv) => acc + inv.total, 0);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.items.some((i) => i.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleDownloadPDF = (invoice: Invoice) => {
    const patient = patients.find((p) => p.id === invoice.patient_id);
    const gen = generateInvoicePDF(invoice, currentClinic, patient);
    gen.download();
  };

  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 1. Practice Financial Header Card */}
      <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Billing & Accounts Receivable
              </h1>
              <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200/80 dark:border-teal-800/60 tabular-nums">
                PKR (Rs.)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Practice cash collections, patient fee statements, and invoice reconciliations for {currentClinic.name}.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onOpenCreateInvoice}
          icon={<Plus className="w-4 h-4" />}
        >
          Create New Invoice
        </Button>
      </div>

      {/* 2. Financial KPI Metric Cards Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            01. Revenue & Receivables Breakdown
          </h2>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            Cumulative Practice Ledger
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Invoiced"
            value={`Rs. ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            subtitle={`${invoices.length} billing statements generated`}
            icon={<Banknote className="w-4 h-4" />}
            accent="indigo"
          />
          <StatCard
            title="Settled Collections"
            value={`Rs. ${paidRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            subtitle="Verified in clinic account"
            icon={<CheckCircle className="w-4 h-4" />}
            trend={{ value: 'Reconciled', positive: true }}
            accent="emerald"
          />
          <StatCard
            title="Outstanding Receivables"
            value={`Rs. ${pendingReceivables.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            subtitle="Pending patient or payer settlement"
            icon={<Clock className="w-4 h-4" />}
            accent="amber"
          />
        </div>
      </div>

      {/* 3. Invoices & Billing Statements Ledger Card */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            02. Billing Statements Registry
          </h2>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {filteredInvoices.length} Statements
          </span>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Card Filter Toolbar */}
          <div className="p-4 sm:px-6 sm:py-3.5 bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search invoice #, patient, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Segmented Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-xs self-start sm:self-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-[#0E1524] text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({invoices.length})
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'paid'
                    ? 'bg-white dark:bg-[#0E1524] text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Settled ({invoices.filter((i) => i.status === 'paid').length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-white dark:bg-[#0E1524] text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pending ({invoices.filter((i) => i.status === 'pending').length})
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-[#111A2E] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Patient Profile</th>
                  <th className="px-6 py-3.5">Billing & Due Date</th>
                  <th className="px-6 py-3.5">Services Rendered</th>
                  <th className="px-6 py-3.5">Payment Status</th>
                  <th className="px-6 py-3.5 text-right">Total (PKR)</th>
                  <th className="px-6 py-3.5 text-right">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center text-slate-400">
                      No billing statements found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        #{inv.invoice_number}
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {inv.patient_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                          {inv.patient_id.substring(0, 10)}
                        </span>
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px] block tabular-nums">
                          {inv.date}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                          Due: {inv.due_date}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 max-w-xs">
                        <div className="truncate text-slate-800 dark:text-slate-200 font-medium">
                          {inv.items.map((i) => i.description).join(', ')}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {inv.items.length} billable line{inv.items.length > 1 ? 's' : ''}
                        </span>
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="space-y-0.5">
                          <Badge
                            variant={inv.status === 'paid' ? 'success' : 'warning'}
                            size="sm"
                            dot
                          >
                            {inv.status === 'paid' ? 'Settled' : 'Pending'}
                          </Badge>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {inv.payment_method?.replace('_', ' ') || 'Self-pay'}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        Rs. {inv.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(inv)}
                          icon={<Download className="w-3.5 h-3.5 text-slate-500" />}
                        >
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
