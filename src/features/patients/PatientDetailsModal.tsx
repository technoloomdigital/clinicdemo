import React, { useState } from 'react';
import {
  HeartPulse,
  AlertTriangle,
  FileText,
  Receipt,
  Plus,
  Calendar,
  Lock,
  Download,
  Stethoscope,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  useStore,
  useClinic,
  useClinicRecords,
  useClinicPrescriptions,
  useClinicInvoices,
} from '../../hooks/useStore';
import { Patient } from '../../types';
import { hasPermission } from '../../lib/security';
import { generateInvoicePDF, generatePrescriptionPDF } from '../../lib/pdf-generator';

export interface PatientDetailsModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onWritePrescriptionForPatient: (patient: Patient) => void;
  onBillPatient: (patient: Patient) => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  patient,
  isOpen,
  onClose,
  onWritePrescriptionForPatient,
  onBillPatient,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'records' | 'prescriptions' | 'billing'>('overview');
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  const currentUser = useStore((state) => state.currentUser);
  const currentClinic = useClinic();
  const records = useClinicRecords(patient?.id);
  const prescriptions = useClinicPrescriptions(patient?.id);
  const invoices = useClinicInvoices(patient?.id);
  const addMedicalRecord = useStore((state) => state.addMedicalRecord);

  const canWriteClinicalNotes = hasPermission(currentUser.role, 'write_clinical_notes');
  const canWritePrescription = hasPermission(currentUser.role, 'write_prescription');

  // Record Form state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [bpSystolic, setBpSystolic] = useState(120);
  const [bpDiastolic, setBpDiastolic] = useState(80);
  const [heartRate, setHeartRate] = useState(72);
  const [spo2, setSpo2] = useState(99);
  const [temp, setTemp] = useState(36.8);

  if (!patient || !isOpen) return null;

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiefComplaint || !diagnosis || !clinicalNotes) return;

    addMedicalRecord({
      patient_id: patient.id,
      doctor_id: currentUser.id,
      doctor_name: currentUser.name,
      visit_date: new Date().toISOString().split('T')[0],
      chief_complaint: chiefComplaint,
      diagnosis,
      clinical_notes: clinicalNotes,
      vitals: {
        bp_systolic: bpSystolic,
        bp_diastolic: bpDiastolic,
        heart_rate: heartRate,
        temperature: temp,
        spo2,
        respiratory_rate: 16,
        weight_kg: 70,
        height_cm: 175,
      },
    });

    setIsAddingRecord(false);
    setChiefComplaint('');
    setDiagnosis('');
    setClinicalNotes('');
  };

  const handleDownloadPrescription = (rx: typeof prescriptions[0]) => {
    const gen = generatePrescriptionPDF(rx, currentClinic, patient, {
      name: rx.doctor_name,
      license_number: rx.doctor_license,
    });
    gen.download();
  };

  const handleDownloadInvoice = (inv: typeof invoices[0]) => {
    const gen = generateInvoicePDF(inv, currentClinic, patient);
    gen.download();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${patient.first_name} ${patient.last_name}`}
      subtitle={`MRN: ${patient.mrn} • DOB: ${patient.dob} (${patient.gender.toUpperCase()}) • Blood: ${patient.blood_group}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Header Card with Quick Badges & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {patient.allergies.length > 0 ? (
              patient.allergies.map((allg, idx) => (
                <Badge key={idx} variant="danger" size="sm">
                  <AlertTriangle className="w-3 h-3" />
                  Allergy: {allg}
                </Badge>
              ))
            ) : (
              <Badge variant="success" size="sm">
                NKDA (No Known Drug Allergies)
              </Badge>
            )}
            {patient.chronic_conditions.map((cond, idx) => (
              <Badge key={idx} variant="purple" size="sm">
                {cond}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {canWritePrescription && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onWritePrescriptionForPatient(patient)}
                icon={<FileText className="w-3.5 h-3.5 text-teal-600" />}
              >
                Write Rx
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBillPatient(patient)}
              icon={<Receipt className="w-3.5 h-3.5 text-amber-600" />}
            >
              Issue Invoice
            </Button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
          {(
            [
              { id: 'overview', label: 'Patient Demographics' },
              { id: 'records', label: `Clinical Records (${records.length})` },
              { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})` },
              { id: 'billing', label: `Invoices & Billing (${invoices.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setIsAddingRecord(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-teal-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Animated Sub-Tabs Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Tab 1: Overview */}
            {activeSubTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4 p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.01]">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide text-[11px] text-teal-600 dark:text-teal-400">
                Contact & Address
              </h4>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <p>
                  <strong className="text-slate-900 dark:text-slate-100">Phone:</strong>{' '}
                  {patient.phone}
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-slate-100">Email:</strong>{' '}
                  {patient.email}
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-slate-100">Residential Address:</strong>{' '}
                  {patient.address}
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.01]">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide text-[11px] text-teal-600 dark:text-teal-400">
                Emergency & Insurance
              </h4>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <p>
                  <strong className="text-slate-900 dark:text-slate-100">Emergency Contact:</strong>{' '}
                  {patient.emergency_contact.name} ({patient.emergency_contact.relationship}) -{' '}
                  {patient.emergency_contact.phone}
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-slate-100">Payer / Insurance:</strong>{' '}
                  {patient.insurance_provider || 'Private Self-Pay'}
                </p>
                {patient.insurance_policy_number && (
                  <p>
                    <strong className="text-slate-900 dark:text-slate-100">Policy Number:</strong>{' '}
                    {patient.insurance_policy_number}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Clinical Records */}
        {activeSubTab === 'records' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Consultation Records & Vitals
              </h4>
              {canWriteClinicalNotes ? (
                <Button
                  size="sm"
                  variant={isAddingRecord ? 'secondary' : 'primary'}
                  onClick={() => setIsAddingRecord(!isAddingRecord)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  {isAddingRecord ? 'Cancel Entry' : 'New Clinical Note'}
                </Button>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-slate-400 italic">
                  <Lock className="w-3 h-3" />
                  Clinical documentation restricted for {currentUser.role}
                </span>
              )}
            </div>

            {/* New Record Inline Entry */}
            {isAddingRecord && (
              <form
                onSubmit={handleSaveRecord}
                className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-500/30 space-y-4 animate-in fade-in"
              >
                <h5 className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wide">
                  Physician Encounter & Clinical Note
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Chief Complaint *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Follow-up on lipids & fatigue"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Clinical Diagnosis *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Metabolic Syndrome (E88.81)"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Vitals inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      BP Systolic
                    </label>
                    <input
                      type="number"
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(Number(e.target.value))}
                      className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      BP Diastolic
                    </label>
                    <input
                      type="number"
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(Number(e.target.value))}
                      className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(Number(e.target.value))}
                      className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(Number(e.target.value))}
                      className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(Number(e.target.value))}
                      className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Encounter Notes & Assessment *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Document subjective, objective, assessment, and plan (SOAP)..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingRecord(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Save Record
                  </Button>
                </div>
              </form>
            )}

            {/* List of past records */}
            <div className="space-y-3">
              {records.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No medical records filed yet for this patient.
                </div>
              ) : (
                records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-teal-600" />
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {rec.diagnosis}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                        <span>{rec.doctor_name}</span>
                        <span>•</span>
                        <span className="font-mono">{rec.visit_date}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {rec.clinical_notes}
                    </p>

                    {rec.vitals && (
                      <div className="flex flex-wrap gap-3 pt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.01] p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                        <span>BP: {rec.vitals.bp_systolic}/{rec.vitals.bp_diastolic} mmHg</span>
                        <span>HR: {rec.vitals.heart_rate} bpm</span>
                        <span>SpO2: {rec.vitals.spo2}%</span>
                        <span>Temp: {rec.vitals.temperature}°C</span>
                        <span>Weight: {rec.vitals.weight_kg} kg</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Prescriptions */}
        {activeSubTab === 'prescriptions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Prescription History (Client jsPDF Verified)
              </h4>
              {canWritePrescription && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onWritePrescriptionForPatient(patient)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Write Prescription
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {prescriptions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No e-prescriptions generated for this patient yet.
                </div>
              ) : (
                prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {rx.diagnosis}
                        </span>
                        <Badge variant="info" size="sm">
                          {rx.prescription_number}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Prescribed by {rx.doctor_name} on {rx.date}
                      </p>
                      <div className="text-xs font-mono text-teal-700 dark:text-teal-400">
                        {rx.medications.map((m) => `${m.drug_name} (${m.dosage})`).join(' • ')}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPrescription(rx)}
                      icon={<Download className="w-3.5 h-3.5 text-teal-600" />}
                    >
                      Download PDF
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Billing */}
        {activeSubTab === 'billing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Invoices & Financial Statements
              </h4>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onBillPatient(patient)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Invoice
              </Button>
            </div>

            <div className="space-y-3">
              {invoices.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No invoices generated for this patient yet.
                </div>
              ) : (
                invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          #{inv.invoice_number}
                        </span>
                        <Badge
                          variant={inv.status === 'paid' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {inv.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Date: {inv.date} | Due: {inv.due_date}
                      </p>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        {inv.items.map((i) => `${i.description} (x${i.quantity})`).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                          Rs. {inv.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase">
                          {inv.payment_method?.replace('_', ' ') || 'Self-pay'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(inv)}
                        icon={<Download className="w-3.5 h-3.5 text-amber-600" />}
                      >
                        PDF
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
};
