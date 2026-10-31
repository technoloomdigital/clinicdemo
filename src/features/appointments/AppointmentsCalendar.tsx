import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  CheckCircle2,
  CalendarPlus,
  Filter,
  Search,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useStore, useClinic, useClinicAppointments, useClinicStaff } from '../../hooks/useStore';
import { AppointmentStatus } from '../../types';
import { hasPermission } from '../../lib/security';

export interface AppointmentsCalendarProps {
  onOpenNewAppointment: () => void;
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

export const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({
  onOpenNewAppointment,
}) => {
  const appointments = useClinicAppointments();
  const currentClinic = useClinic();
  const staff = useClinicStaff();
  const currentUser = useStore((state) => state.currentUser);
  const isLoading = useStore((state) => state.isLoading);
  const updateAppointmentStatus = useStore((state) => state.updateAppointmentStatus);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const canManageAppointments = hasPermission(currentUser.role, 'manage_appointments');

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesDoctor = doctorFilter === 'all' || apt.doctor_id === doctorFilter;
    const matchesSearch =
      apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.notes && apt.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesDoctor && matchesSearch;
  });

  const advanceStatus = (id: string, current: AppointmentStatus) => {
    const sequence: Record<AppointmentStatus, AppointmentStatus> = {
      scheduled: 'checked_in',
      checked_in: 'in_consultation',
      in_consultation: 'completed',
      completed: 'scheduled',
      cancelled: 'scheduled',
      no_show: 'scheduled',
    };
    updateAppointmentStatus(id, sequence[current]);
  };

  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 1. Calendar Header Card */}
      <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Appointments & Clinical Schedule
              </h1>
              <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200/80 dark:border-teal-800/60 tabular-nums">
                {appointments.length} Consultations
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Consultation slots, patient check-in timeline, and examining physician assignments for {currentClinic.name}.
            </p>
          </div>
        </div>

        {canManageAppointments && (
          <Button
            variant="primary"
            size="md"
            onClick={onOpenNewAppointment}
            icon={<CalendarPlus className="w-4 h-4" />}
          >
            Book New Appointment
          </Button>
        )}
      </div>

      {/* 2. Control Toolbar Card */}
      <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, doctor, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="checked_in">Checked In</option>
              <option value="in_consultation">In Consult</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Attending Doctors</option>
            {staff
              .filter((s) => s.role === 'doctor' || s.role === 'owner')
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* 3. Section: Appointment Cards Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Consultation Appointments
          </h2>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {filteredAppointments.length} matching schedule
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.length === 0 ? (
            <div className="col-span-full py-16 px-4 text-center rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <CalendarIcon className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No appointments match your filter criteria
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust your search or clear selected filters.
              </p>
            </div>
          ) : (
            filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-5 rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Header: Date, Time & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{apt.start_time} - {apt.end_time}</span>
                    </div>
                    <Badge variant={statusVariantMap[apt.status]} size="sm" dot>
                      {statusLabels[apt.status]}
                    </Badge>
                  </div>

                  {/* Patient Information */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {apt.patient_name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                      <span>{apt.date}</span>
                      <span>·</span>
                      <span className="capitalize font-sans text-teal-700 dark:text-teal-400 font-medium">
                        {apt.type}
                      </span>
                    </div>
                  </div>

                  {/* Doctor & Room */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{apt.doctor_name}</span>
                    </div>
                    {apt.room && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Room: {apt.room}
                      </div>
                    )}
                    {apt.notes && (
                      <div className="text-[11px] text-slate-400 italic">
                        "{apt.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Action Workflow */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Workflow
                  </span>
                  <button
                    onClick={() => advanceStatus(apt.id, apt.status)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>
                      {apt.status === 'scheduled'
                        ? 'Check In'
                        : apt.status === 'checked_in'
                        ? 'Begin Consult'
                        : apt.status === 'in_consultation'
                        ? 'Complete Visit'
                        : 'Reschedule'}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
