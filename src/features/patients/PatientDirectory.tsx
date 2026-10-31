import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  AlertTriangle,
  FileText,
  Receipt,
  Eye,
  Phone,
  Filter,
  Users,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useStore, useClinic, useClinicPatients } from '../../hooks/useStore';
import { Patient } from '../../types';
import { hasPermission } from '../../lib/security';

export interface PatientDirectoryProps {
  onSelectPatient: (patient: Patient) => void;
  onOpenIntake: () => void;
  onWritePrescriptionForPatient: (patient: Patient) => void;
  onBillPatient: (patient: Patient) => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  onSelectPatient,
  onOpenIntake,
  onWritePrescriptionForPatient,
  onBillPatient,
}) => {
  const patients = useClinicPatients();
  const currentClinic = useClinic();
  const currentUser = useStore((state) => state.currentUser);
  const isLoading = useStore((state) => state.isLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const [bloodFilter, setBloodFilter] = useState('all');

  const canCreatePatient = hasPermission(currentUser.role, 'create_patient');
  const canWritePrescription = hasPermission(currentUser.role, 'write_prescription');

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term) ||
      p.mrn.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.chronic_conditions.some((c) => c.toLowerCase().includes(term)) ||
      p.allergies.some((a) => a.toLowerCase().includes(term));

    const matchesBlood = bloodFilter === 'all' || p.blood_group === bloodFilter;
    return matchesSearch && matchesBlood;
  });

  if (isLoading) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6 sm:space-y-7 pb-10">
      {/* 1. Header Card */}
      <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Patient Medical Directory
              </h1>
              <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200/80 dark:border-teal-800/60 tabular-nums">
                {patients.length} Active Records
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive patient charts, allergy profiles, and consultation histories for {currentClinic.name}.
            </p>
          </div>
        </div>

        {canCreatePatient && (
          <Button
            variant="primary"
            size="md"
            onClick={onOpenIntake}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Intake New Patient
          </Button>
        )}
      </div>

      {/* 2. Filters & Search Control Card */}
      <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-xs p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-88">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search patient by name, MRN, phone, allergy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </span>
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Blood Groups</option>
            <option value="A+">Blood: A+</option>
            <option value="A-">Blood: A-</option>
            <option value="B+">Blood: B+</option>
            <option value="B-">Blood: B-</option>
            <option value="O+">Blood: O+</option>
            <option value="O-">Blood: O-</option>
            <option value="AB+">Blood: AB+</option>
          </select>
        </div>
      </div>

      {/* 3. Distinct Patient Data Table Card */}
      <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Title Bar */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Registered Patients Roster
          </span>
          <span className="font-mono tabular-nums">
            Showing {filteredPatients.length} of {patients.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-[#111A2E] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Patient Profile</th>
                <th className="px-6 py-3.5">MRN & Demographics</th>
                <th className="px-6 py-3.5">Clinical Alerts / Allergies</th>
                <th className="px-6 py-3.5">Payer / Insurance</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-slate-400">
                    No patient records match the specified search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Patient Profile */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center font-mono shrink-0 border border-slate-200/70 dark:border-slate-700">
                          {patient.first_name[0]}
                          {patient.last_name[0]}
                        </div>
                        <div>
                          <button
                            onClick={() => onSelectPatient(patient)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                          >
                            {patient.first_name} {patient.last_name}
                          </button>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{patient.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* MRN & Demographics */}
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 block tabular-nums">
                        {patient.mrn}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {patient.dob} · {patient.gender.toUpperCase()} · Blood {patient.blood_group}
                      </span>
                    </td>

                    {/* Allergies & Conditions */}
                    <td className="px-6 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {patient.allergies.length > 0 ? (
                          patient.allergies.map((allg, i) => (
                            <Badge key={i} variant="danger" size="sm">
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              {allg}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="neutral" size="sm">
                            NKDA
                          </Badge>
                        )}
                        {patient.chronic_conditions.slice(0, 1).map((cond, i) => (
                          <Badge key={i} variant="purple" size="sm">
                            {cond}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    {/* Insurance */}
                    <td className="px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {patient.insurance_provider || 'Self-Pay / Direct'}
                      </div>
                      {patient.insurance_policy_number && (
                        <div className="font-mono text-[10px] text-slate-400 tabular-nums">
                          {patient.insurance_policy_number}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View Patient Chart"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canWritePrescription && (
                          <button
                            onClick={() => onWritePrescriptionForPatient(patient)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Write e-Prescription"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onBillPatient(patient)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Generate Invoice"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
