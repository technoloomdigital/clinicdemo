import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  Download,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PrescriptionItem, Patient } from '../../types';
import { useStore, useClinic, useClinicPatients } from '../../hooks/useStore';
import { PrescriptionSchema } from '../../lib/validation';
import { generatePrescriptionPDF, GeneratedDocument } from '../../lib/pdf-generator';

export interface PrescriptionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatient?: Patient | null;
  onPreviewPDF: (title: string, blobUrl: string, downloadFn: () => void) => void;
}

export const PrescriptionBuilderModal: React.FC<PrescriptionBuilderModalProps> = ({
  isOpen,
  onClose,
  preselectedPatient,
  onPreviewPDF,
}) => {
  const currentClinic = useClinic();
  const patients = useClinicPatients();
  const currentUser = useStore((state) => state.currentUser);
  const addPrescription = useStore((state) => state.addPrescription);

  const [patientId, setPatientId] = useState(
    preselectedPatient?.id || patients[0]?.id || ''
  );
  const [diagnosis, setDiagnosis] = useState('');
  const [precautions, setPrecautions] = useState('');
  const [medications, setMedications] = useState<PrescriptionItem[]>([
    {
      id: 'med-1',
      drug_name: 'Metformin Hydrochloride',
      dosage: '500 mg',
      route: 'Oral',
      frequency: 'Twice daily with meals',
      duration: '30 days',
      dispense_quantity: '60 tablets',
      instructions: 'Take with food to reduce GI upset.',
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allergyAlert, setAllergyAlert] = useState<string | null>(null);

  const selectedPatient = patients.find((p) => p.id === patientId);

  // Check allergy match whenever medications or patient changes
  const checkAllergies = (meds: PrescriptionItem[], pat: Patient | undefined) => {
    if (!pat || pat.allergies.length === 0) {
      setAllergyAlert(null);
      return;
    }
    const matched: string[] = [];
    meds.forEach((m) => {
      pat.allergies.forEach((alg) => {
        if (m.drug_name.toLowerCase().includes(alg.toLowerCase())) {
          matched.push(`${m.drug_name} conflicts with patient allergy: ${alg}`);
        }
      });
    });
    if (matched.length > 0) {
      setAllergyAlert(matched.join('; '));
    } else {
      setAllergyAlert(null);
    }
  };

  const handlePatientChange = (id: string) => {
    setPatientId(id);
    const pat = patients.find((p) => p.id === id);
    checkAllergies(medications, pat);
  };

  const handleAddMedication = () => {
    const next: PrescriptionItem = {
      id: `med-${Date.now()}`,
      drug_name: '',
      dosage: '',
      route: 'Oral',
      frequency: 'Once daily',
      duration: '14 days',
      dispense_quantity: '',
      instructions: '',
    };
    const updated = [...medications, next];
    setMedications(updated);
    checkAllergies(updated, selectedPatient);
  };

  const handleRemoveMedication = (id: string) => {
    if (medications.length <= 1) return;
    const updated = medications.filter((m) => m.id !== id);
    setMedications(updated);
    checkAllergies(updated, selectedPatient);
  };

  const handleMedChange = (
    id: string,
    field: keyof PrescriptionItem,
    value: string
  ) => {
    const updated = medications.map((m) => (m.id === id ? { ...m, [field]: value } : m));
    setMedications(updated);
    checkAllergies(updated, selectedPatient);
  };

  const handleSubmit = (e: React.FormEvent, previewMode = false) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const payload = {
      patient_id: patientId,
      diagnosis,
      medications,
      precautions,
    };

    const result = PrescriptionSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const newRx = addPrescription({
      patient_id: selectedPatient.id,
      patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
      patient_dob: selectedPatient.dob,
      doctor_id: currentUser.id,
      doctor_name: currentUser.name,
      doctor_license: currentUser.license_number || 'ACTIVE-MD',
      date: new Date().toISOString().split('T')[0],
      diagnosis,
      medications,
      precautions,
    });

    const gen = generatePrescriptionPDF(newRx, currentClinic, selectedPatient, currentUser);

    if (previewMode) {
      onClose();
      onPreviewPDF(`Prescription - ${selectedPatient.last_name}`, gen.blobUrl, gen.download);
    } else {
      gen.download();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Electronic Prescription (e-Rx) Builder"
      subtitle={`Generate verifiable cryptographic prescription for ${currentClinic.name}`}
      maxWidth="4xl"
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Allergy Warning if triggered */}
        {allergyAlert && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-500/40 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2.5 animate-bounce">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-bold">CRITICAL ALLERGY ALERT: {allergyAlert}</span>
          </div>
        )}

        {/* Patient Selection & Doctor Demographics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Target Patient <span className="text-rose-500">*</span>
            </label>
            <select
              value={patientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.mrn}) - Allergies: {p.allergies.join(', ') || 'NKDA'}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Clinical Indication / Diagnosis *"
            placeholder="e.g. Type 2 Diabetes Mellitus with Dyslipidemia"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            error={errors.diagnosis}
            required
          />
        </div>

        {/* Prescription Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Medications & Dosage Protocol
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedication}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Medication
            </Button>
          </div>

          <div className="space-y-3">
            {medications.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Rx Line Item #{index + 1}
                  </span>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(item.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="Remove Medication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Drug Generic / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Atorvastatin or Amoxicillin"
                      value={item.drug_name}
                      onChange={(e) => handleMedChange(item.id, 'drug_name', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Strength / Dosage *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 20 mg"
                      value={item.dosage}
                      onChange={(e) => handleMedChange(item.id, 'dosage', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Route *
                    </label>
                    <select
                      value={item.route}
                      onChange={(e) => handleMedChange(item.id, 'route', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="Oral">Oral (PO)</option>
                      <option value="Sublingual">Sublingual</option>
                      <option value="Topical">Topical</option>
                      <option value="Inhalation">Inhalation</option>
                      <option value="Subcutaneous">Subcutaneous</option>
                      <option value="Intramuscular">Intramuscular</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Frequency *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Once daily at bedtime"
                      value={item.frequency}
                      onChange={(e) => handleMedChange(item.id, 'frequency', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Duration *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 90 days"
                      value={item.duration}
                      onChange={(e) => handleMedChange(item.id, 'duration', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Dispense Quantity *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 90 capsules"
                      value={item.dispense_quantity}
                      onChange={(e) => handleMedChange(item.id, 'dispense_quantity', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Special Patient Instructions (Sig)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Avoid grapefruit juice; swallow whole without chewing."
                    value={item.instructions}
                    onChange={(e) => handleMedChange(item.id, 'instructions', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Precautions / Warnings */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-1">
            Precautions & Black Box Warnings (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Document any drug interactions, pregnancy warnings, or dietary restrictions..."
            value={precautions}
            onChange={(e) => setPrecautions(e.target.value)}
            className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>
            Signing Physician: <strong>{currentUser.name}</strong> (License: {currentUser.license_number || 'CA-G89124'}). A SHA-256 integrity seal is embedded into the generated PDF.
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            icon={<Eye className="w-4 h-4 text-teal-600" />}
          >
            Preview Document
          </Button>
          <Button variant="primary" type="submit" icon={<Download className="w-4 h-4" />}>
            Sign & Download PDF
          </Button>
        </div>
      </form>
    </Modal>
  );
};
