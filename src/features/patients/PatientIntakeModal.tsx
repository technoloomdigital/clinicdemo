import React, { useState } from 'react';
import { UserPlus, Plus, X, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PatientIntakeSchema } from '../../lib/validation';
import { useStore, useClinic } from '../../hooks/useStore';

export interface PatientIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientIntakeModal: React.FC<PatientIntakeModalProps> = ({ isOpen, onClose }) => {
  const addPatient = useStore((state) => state.addPatient);
  const currentClinic = useClinic();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    gender: 'female' as 'male' | 'female' | 'other',
    phone: '',
    email: '',
    address: '',
    blood_group: 'O+',
    emergency_name: '',
    emergency_relationship: '',
    emergency_phone: '',
    insurance_provider: '',
    insurance_policy_number: '',
  });

  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (idx: number) => {
    setAllergies(allergies.filter((_, i) => i !== idx));
  };

  const handleAddCondition = () => {
    if (conditionInput.trim() && !conditions.includes(conditionInput.trim())) {
      setConditions([...conditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const handleRemoveCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      allergies,
      chronic_conditions: conditions,
    };

    const result = PatientIntakeSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const valid = result.data;
    addPatient({
      first_name: valid.first_name,
      last_name: valid.last_name,
      dob: valid.dob,
      gender: valid.gender,
      phone: valid.phone,
      email: valid.email,
      address: valid.address,
      blood_group: valid.blood_group,
      allergies: valid.allergies,
      chronic_conditions: valid.chronic_conditions,
      emergency_contact: {
        name: valid.emergency_name,
        relationship: valid.emergency_relationship,
        phone: valid.emergency_phone,
      },
      insurance_provider: valid.insurance_provider,
      insurance_policy_number: valid.insurance_policy_number,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Zero-Trust Patient Intake & Registration"
      subtitle={`Register patient chart under tenant ${currentClinic.name}`}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Demographics */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3">
            Demographics & Identification
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="First Name"
              name="first_name"
              placeholder="e.g. Eleanor"
              value={formData.first_name}
              onChange={handleChange}
              error={errors.first_name}
              required
            />
            <Input
              label="Last Name"
              name="last_name"
              placeholder="e.g. Vance"
              value={formData.last_name}
              onChange={handleChange}
              error={errors.last_name}
              required
            />
            <Input
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              error={errors.dob}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                Biological Sex <span className="text-rose-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / Non-Binary</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                Blood Group
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
              </select>
            </div>

            <Input
              label="Contact Phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 019-2811"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="patient@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <Input
              label="Residential Address"
              name="address"
              placeholder="e.g. 120 California St, San Francisco, CA"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              required
            />
          </div>
        </div>

        {/* Clinical History: Allergies & Chronic Conditions */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Critical Safety Alerts (Allergies & Conditions)
          </h4>

          {/* Allergies tag builder */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Drug & Environmental Allergies
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type allergy (e.g. Penicillin, Sulfa) and press Add"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAllergy();
                  }
                }}
                className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddAllergy}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {allergies.map((allergy, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                >
                  <span>{allergy}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergy(idx)}
                    className="hover:text-rose-950 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {allergies.length === 0 && (
                <span className="text-xs text-slate-400 italic">No allergies recorded (NKDA)</span>
              )}
            </div>
          </div>

          {/* Chronic conditions tag builder */}
          <div className="space-y-2 mt-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Pre-existing & Chronic Diagnoses
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type condition (e.g. Hypertension, Type 2 Diabetes) and press Add"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCondition();
                  }
                }}
                className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddCondition}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {conditions.map((cond, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  <span>{cond}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(idx)}
                    className="hover:text-slate-950 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Contact & Insurance */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3">
            Emergency Contact & Payer
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Name"
              name="emergency_name"
              placeholder="e.g. Sarah Vance"
              value={formData.emergency_name}
              onChange={handleChange}
              error={errors.emergency_name}
              required
            />
            <Input
              label="Relationship"
              name="emergency_relationship"
              placeholder="e.g. Spouse / Parent"
              value={formData.emergency_relationship}
              onChange={handleChange}
              error={errors.emergency_relationship}
              required
            />
            <Input
              label="Emergency Phone"
              name="emergency_phone"
              type="tel"
              placeholder="+1 (555) 019-2819"
              value={formData.emergency_phone}
              onChange={handleChange}
              error={errors.emergency_phone}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input
              label="Insurance Carrier"
              name="insurance_provider"
              placeholder="e.g. Blue Cross Premier / Self-Pay"
              value={formData.insurance_provider}
              onChange={handleChange}
            />
            <Input
              label="Policy / Group Number"
              name="insurance_policy_number"
              placeholder="e.g. POL-889104-B"
              value={formData.insurance_policy_number}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" icon={<UserPlus className="w-4 h-4" />}>
            Create Chart & Generate MRN
          </Button>
        </div>
      </form>
    </Modal>
  );
};
