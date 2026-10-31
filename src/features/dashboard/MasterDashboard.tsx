import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Banknote,
  Stethoscope,
  ArrowRight,
  UserPlus,
  CalendarPlus,
  FileText,
  Receipt,
  CreditCard,
  CheckCircle2,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MetricsSkeletonGrid } from '../../components/ui/Skeleton';
import { useStore, useClinic, useClinicMetrics, useClinicAppointments } from '../../hooks/useStore';
import { AppointmentStatus, TabType } from '../../types';

export interface MasterDashboardProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenNewPatient: () => void;
  onOpenNewAppointment: () => void;
  onOpenWritePrescription: () => void;
  onOpenCreateInvoice: () => void;
}

const statusVariantMap: Record<AppointmentStatus, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  scheduled: 'default',
  checked_in: 'warning',
  in_consultation: 'info',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'danger',
};

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  checked_in: 'Checked In',
  in_consultation: 'In Consult',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const MasterDashboard: React.FC<MasterDashboardProps> = ({
  onNavigateTab,
  onOpenNewPatient,
  onOpenNewAppointment,
  onOpenWritePrescription,
  onOpenCreateInvoice,
}) => {
  const currentClinic = useClinic();
  const currentUser = useStore((state) => state.currentUser);
  const metrics = useClinicMetrics();
  const appointments = useClinicAppointments();
  const isLoading = useStore((state) => state.isLoading);
  const updateAppointmentStatus = useStore((state) => state.updateAppointmentStatus);

  const [queueSearch, setQueueSearch] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === today);

  const filteredQueue = todayAppointments.filter((a) => {
    const term = queueSearch.toLowerCase();
    return (
      a.patient_name.toLowerCase().includes(term) ||
      a.doctor_name.toLowerCase().includes(term) ||
      (a.notes && a.notes.toLowerCase().includes(term))
    );
  });

  const handleQuickStatusAdvance = (appointmentId: string, currentStatus: AppointmentStatus) => {
    let nextStatus: AppointmentStatus = currentStatus;
    if (currentStatus === 'scheduled') nextStatus = 'checked_in';
    else if (currentStatus === 'checked_in') nextStatus = 'in_consultation';
    else if (currentStatus === 'in_consultation') nextStatus = 'completed';
    else if (currentStatus === 'completed') nextStatus = 'scheduled';

    updateAppointmentStatus(appointmentId, nextStatus);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <MetricsSkeletonGrid />
        <div className="h-64 rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 p-6 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Account Activation Alert Card (Conditional) */}
      {currentClinic.status === 'pending_activation' && (
        <div className="p-5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-500 text-white shrink-0 shadow-2xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
                Clinic Account Pending Subscription Activation
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                First when someone buys a subscription, this clinic account will be activated. Complete your subscription purchase to unlock full clinical workflows.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigateTab('team')}
            icon={<CreditCard className="w-4 h-4" />}
          >
            Buy Subscription & Activate
          </Button>
        </div>
      )}

      {/* 2. Clinical Command Hero Card */}
      <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {currentClinic.name}
              </h1>
              <Badge variant={currentClinic.status === 'active' ? 'success' : 'warning'} size="sm" dot>
                {currentClinic.status === 'active' ? 'Licensed Clinic' : 'Pending Activation'}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Specialty: <strong className="text-slate-700 dark:text-slate-300">{currentClinic.specialty || 'General Practice'}</strong> · Attending Master: <strong className="text-slate-700 dark:text-slate-300">{currentUser.name}</strong>
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenNewAppointment}
              icon={<CalendarPlus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
            >
              New Appointment
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenNewPatient}
              icon={<UserPlus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
            >
              Intake Patient
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenWritePrescription}
              icon={<FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
            >
              Write Rx
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCreateInvoice}
              icon={<Receipt className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
            >
              Bill Patient
            </Button>
          </div>
        </div>

        {/* Card Footer Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-sans text-slate-700 dark:text-slate-300 font-medium">Practice Operations Live</span>
            <span>·</span>
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <div className="text-[11px] text-slate-400">
            Tenancy Isolated · Encrypted Local Storage
          </div>
        </div>
      </div>

      {/* 3. Section: Key Performance Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              01. Practice Key Performance Metrics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live operational figures and financial receipts recorded today
            </p>
          </div>

          <span className="text-xs text-slate-400 font-mono tabular-nums">
            Today's Window
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registered Patients"
            value={metrics.totalPatients}
            subtitle="Enrolled patient charts"
            icon={<Users className="w-4 h-4" />}
            accent="indigo"
            onClick={() => onNavigateTab('patients')}
          />
          <StatCard
            title="Today's Appointments"
            value={metrics.todayAppointments}
            subtitle={`${metrics.checkedInCount} checked in · ${metrics.inConsultationCount} in consult`}
            icon={<Calendar className="w-4 h-4" />}
            accent="teal"
            onClick={() => onNavigateTab('appointments')}
          />
          <StatCard
            title="Average Consult Wait"
            value={`${metrics.avgWaitTimeMinutes}m`}
            subtitle="Front desk to consultation"
            icon={<Clock className="w-4 h-4" />}
            accent="amber"
          />
          <StatCard
            title="Today's Revenue Collected"
            value={`Rs. ${metrics.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            subtitle="Settled fee statements"
            icon={<Banknote className="w-4 h-4" />}
            accent="emerald"
            onClick={() => onNavigateTab('billing')}
          />
        </div>
      </div>

      {/* 4. Section: Today's Clinical Queue Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              02. Live Consultation Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track patient staging, attending doctors, and active examinations
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('appointments')}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Calendar Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Distinct Card Container */}
        <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Queue Card Header Toolbar */}
          <div className="p-4 sm:px-6 sm:py-4 bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                Scheduled Consultations Today
              </span>
              <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200/80 dark:border-teal-800/60 tabular-nums">
                {todayAppointments.length} Total
              </span>
            </div>

            {/* Quick in-queue filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Filter by patient, doctor..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="w-full text-xs pl-7 pr-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Queue Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {todayAppointments.length === 0 ? (
              <div className="py-14 px-4 text-center">
                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No appointments scheduled for today
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Book a patient consultation to start your clinical queue.
                </p>
                <div className="mt-4">
                  <Button size="sm" variant="outline" onClick={onOpenNewAppointment}>
                    Schedule First Appointment
                  </Button>
                </div>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No consultations match your filter.
              </div>
            ) : (
              filteredQueue.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Time Slot Tile */}
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 text-center w-20 shrink-0">
                      <span className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 block">
                        {apt.start_time}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums block">
                        {apt.end_time}
                      </span>
                    </div>

                    {/* Patient & Doctor details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {apt.patient_name}
                        </span>
                        <Badge variant={statusVariantMap[apt.status]} size="sm" dot>
                          {statusLabels[apt.status]}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          <span>{apt.doctor_name}</span>
                        </span>
                        {apt.room && (
                          <>
                            <span>·</span>
                            <span>{apt.room}</span>
                          </>
                        )}
                        {apt.notes && (
                          <>
                            <span>·</span>
                            <span className="italic text-slate-400 max-w-xs truncate">"{apt.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Advance Stage Control */}
                  <div className="shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleQuickStatusAdvance(apt.id, apt.status)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>
                        {apt.status === 'scheduled'
                          ? 'Check In Patient'
                          : apt.status === 'checked_in'
                          ? 'Begin Consultation'
                          : apt.status === 'in_consultation'
                          ? 'Complete Visit'
                          : 'Re-open Visit'}
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
