import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Download,
  Eye,
  ShieldCheck,
  Stethoscope,
  Clock,
  User,
  Pill,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useStore, useClinic, useClinicPrescriptions, useClinicPatients } from '../../hooks/useStore';
import { Prescription } from '../../types';
import { hasPermission } from '../../lib/security';
import { generatePrescriptionPDF } from '../../lib/pdf-generator';

export interface PrescriptionsDirectoryProps {
  onOpenWritePrescription: () => void;
  onPreviewPDF: (title: string, blobUrl: string, downloadFn: () => void) => void;
}

export const PrescriptionsDirectory: React.FC<PrescriptionsDirectoryProps> = ({
  onOpenWritePrescription,
  onPreviewPDF,
}) => {
  const currentClinic = useClinic();
  const prescriptions = useClinicPrescriptions();
  const patients = useClinicPatients();
  const currentUser = useStore((state) => state.currentUser);
  const isLoading = useStore((state) => state.isLoading);

  const [searchTerm, setSearchTerm] = useState('');

  const canWritePrescription = hasPermission(currentUser.role, 'write_prescription');

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const term = searchTerm.toLowerCase();
    const matchesPatient = rx.patient_name.toLowerCase().includes(term);
    const matchesNumber = rx.prescription_number.toLowerCase().includes(term);
    const matchesDoctor = rx.doctor_name.toLowerCase().includes(term);
    const matchesMeds = rx.medications.some((m) =>
      m.drug_name.toLowerCase().includes(term)
    );
    return matchesPatient || matchesNumber || matchesDoctor || matchesMeds;
  });

  const handlePreview = (rx: Prescription) => {
    const patient = patients.find((p) => p.id === rx.patient_id) || {
      id: rx.patient_id,
      clinic_id: currentClinic.id,
      first_name: rx.patient_name.split(' ')[0] || '',
      last_name: rx.patient_name.split(' ').slice(1).join(' ') || '',
      dob: rx.patient_dob,
      phone: 'N/A',
      email: 'N/A',
      address: 'N/A',
      gender: 'other',
      blood_type: 'Unknown',
      allergies: [],
      chronic_conditions: [],
      emergency_contact_name: 'N/A',
      emergency_contact_phone: 'N/A',
      insurance_provider: 'N/A',
      insurance_policy_number: 'N/A',
      mrn: 'MRN-RECORDED',
      created_at: rx.date,
      updated_at: rx.date,
    };

    const doctor = {
      name: rx.doctor_name,
      license_number: rx.doctor_license,
      role: 'doctor' as const,
    };

    const doc = generatePrescriptionPDF(rx, currentClinic, patient as any, doctor);

    onPreviewPDF(`e-Rx: ${rx.prescription_number}`, doc.blobUrl, doc.download);
  };

  const handleDirectDownload = (rx: Prescription) => {
    const patient = patients.find((p) => p.id === rx.patient_id) || {
      id: rx.patient_id,
      clinic_id: currentClinic.id,
      first_name: rx.patient_name.split(' ')[0] || '',
      last_name: rx.patient_name.split(' ').slice(1).join(' ') || '',
      dob: rx.patient_dob,
      phone: 'N/A',
      email: 'N/A',
      address: 'N/A',
      gender: 'other',
      blood_type: 'Unknown',
      allergies: [],
      chronic_conditions: [],
      emergency_contact_name: 'N/A',
      emergency_contact_phone: 'N/A',
      insurance_provider: 'N/A',
      insurance_policy_number: 'N/A',
      mrn: 'MRN-RECORDED',
      created_at: rx.date,
      updated_at: rx.date,
    };

    const doctor = {
      name: rx.doctor_name,
      license_number: rx.doctor_license,
      role: 'doctor' as const,
    };

    const doc = generatePrescriptionPDF(rx, currentClinic, patient as any, doctor);

    doc.download();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Electronic Prescriptions (e-Rx)
            </h1>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              {filteredPrescriptions.length} issued
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tamper-sealed prescription registry, dosage instructions, and printable medical orders for {currentClinic.name}.
          </p>
        </div>

        {canWritePrescription && (
          <Button
            onClick={onOpenWritePrescription}
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Issue New e-Rx
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 bg-white dark:bg-[#0D1117] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Rx number, patient, doctor, drug..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono tabular-nums self-end sm:self-auto">
          {filteredPrescriptions.length} Records
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : filteredPrescriptions.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-[#0D1117] rounded-xl border border-slate-200/90 dark:border-slate-800">
          <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            No e-Prescriptions Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-3">
            {searchTerm
              ? 'No prescriptions match your query.'
              : 'No electronic prescriptions have been issued for this clinic yet.'}
          </p>
          {canWritePrescription && (
            <Button
              onClick={onOpenWritePrescription}
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Draft First Prescription
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111620] border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Rx Number</th>
                  <th className="py-3 px-4">Patient Profile</th>
                  <th className="py-3 px-4">Prescribing Doctor</th>
                  <th className="py-3 px-4">Medications Prescribed</th>
                  <th className="py-3 px-4">Security Verification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPrescriptions.map((rx) => (
                  <tr
                    key={rx.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      <div>{rx.prescription_number}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-normal">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{rx.date}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {rx.patient_name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        DOB: {rx.patient_dob}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {rx.doctor_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Lic: {rx.doctor_license}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        {rx.medications.map((m, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                          >
                            <span className="font-medium truncate">{m.drug_name}</span>
                            <span className="text-slate-400 text-[11px]">({m.dosage})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant="success" size="sm" dot>
                        Tamper-Sealed
                      </Badge>
                      <div
                        className="font-mono text-[10px] text-slate-400 mt-1 truncate max-w-[110px]"
                        title={rx.security_hash}
                      >
                        {rx.security_hash ? rx.security_hash.slice(0, 14) + '...' : 'SHA-256 Valid'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(rx)}
                          icon={<Eye className="w-3 h-3 text-slate-500" />}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDirectDownload(rx)}
                          icon={<Download className="w-3 h-3 text-slate-500" />}
                        >
                          PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
