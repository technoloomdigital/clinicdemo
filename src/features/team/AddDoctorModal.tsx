import React, { useState } from 'react';
import { UserPlus, Stethoscope, Mail, Phone, Award, Building, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useStore, useClinic } from '../../hooks/useStore';

export interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDoctorModal: React.FC<AddDoctorModalProps> = ({ isOpen, onClose }) => {
  const currentClinic = useClinic();
  const addDoctor = useStore((state) => state.addDoctor);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    license_number: '',
    phone: '',
    title: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Doctor name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.specialty.trim()) newErrors.specialty = 'Specialty is required';
    if (!formData.license_number.trim()) newErrors.license_number = 'Medical license number is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    addDoctor({
      name: formData.name.startsWith('Dr.') ? formData.name : `Dr. ${formData.name}`,
      email: formData.email,
      specialty: formData.specialty,
      license_number: formData.license_number,
      phone: formData.phone || '+1 (555) 012-3456',
      title: formData.title || `${formData.specialty} Specialist`,
      role: 'doctor',
    });

    setIsSubmitting(false);
    setFormData({
      name: '',
      email: '',
      specialty: '',
      license_number: '',
      phone: '',
      title: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Doctor to Clinic"
      subtitle={`Add a practicing doctor to ${currentClinic.name} roster`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-md bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Building className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Clinic Master Authorization
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              This doctor will be granted clinical privileges to attend appointments and prescribe medication under <strong>{currentClinic.name}</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Doctor Full Name"
              name="name"
              placeholder="e.g. Dr. Julian Vance, MD"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
          </div>

          <Input
            label="Professional Email"
            name="email"
            type="email"
            placeholder="e.g. julian.vance@clinic.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <Input
            label="Phone Number"
            name="phone"
            placeholder="e.g. +1 (415) 555-0199"
            value={formData.phone}
            onChange={handleChange}
          />

          <Input
            label="Medical Specialization"
            name="specialty"
            placeholder="e.g. Cardiology, Pediatrics, General Medicine"
            value={formData.specialty}
            onChange={handleChange}
            error={errors.specialty}
            required
          />

          <Input
            label="Medical License Number"
            name="license_number"
            placeholder="e.g. CA-MD98214"
            value={formData.license_number}
            onChange={handleChange}
            error={errors.license_number}
            required
          />

          <div className="sm:col-span-2">
            <Input
              label="Department / Professional Title"
              name="title"
              placeholder="e.g. Senior Attending Physician, Head of Cardiology"
              value={formData.title}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={isSubmitting}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Add Doctor
          </Button>
        </div>
      </form>
    </Modal>
  );
};
