import React, { useState, useEffect } from 'react';
import { Building2, Save } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useStore, useClinic } from '../../hooks/useStore';

export interface EditClinicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditClinicProfileModal: React.FC<EditClinicProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentClinic = useClinic();
  const updateClinicProfile = useStore((state) => state.updateClinicProfile);

  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    website: '',
  });

  useEffect(() => {
    if (currentClinic) {
      setFormData({
        name: currentClinic.name || '',
        specialty: currentClinic.specialty || '',
        phone: currentClinic.phone || '',
        email: currentClinic.email || '',
        address: currentClinic.address || '',
        city: currentClinic.city || '',
        website: currentClinic.website || '',
      });
    }
  }, [currentClinic, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    updateClinicProfile({
      name: formData.name,
      specialty: formData.specialty,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      website: formData.website,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Clinic Profile"
      subtitle="Update public practice information and contact details"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Clinic Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Aura Health & Longevity Institute"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Primary Specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              placeholder="e.g. Precision Preventive & Longevity Medicine"
              required
            />
          </div>

          <Input
            label="Clinic Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (415) 890-2100"
          />

          <Input
            label="Clinic Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="contact@auramedical.com"
          />

          <Input
            label="Street Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="450 Sutter Street, Suite 1800"
          />

          <Input
            label="City, State / Region"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="San Francisco, CA"
          />

          <div className="sm:col-span-2">
            <Input
              label="Website (Optional)"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
            Save Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};
