import React, { useState } from 'react';
import { UserPlus, Copy, Check, Shield, Lock } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { InviteStaffSchema } from '../../lib/validation';
import { useStore, useClinic } from '../../hooks/useStore';
import { UserRole } from '../../types';
import { hasPermission } from '../../lib/security';

export interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteStaffModal: React.FC<InviteStaffModalProps> = ({ isOpen, onClose }) => {
  const currentUser = useStore((state) => state.currentUser);
  const currentClinic = useClinic();
  const createStaffInvite = useStore((state) => state.createStaffInvite);

  const canManageStaff = hasPermission(currentUser.role, 'manage_staff');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'doctor' as UserRole,
    title: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    if (!canManageStaff) return;

    const result = InviteStaffSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const invite = createStaffInvite(
      result.data.email,
      result.data.role,
      result.data.title,
      result.data.name
    );

    const generatedLink = `${window.location.origin}/join?clinic=${currentClinic.id}&token=${invite.token}`;
    setCreatedInviteLink(generatedLink);
  };

  const handleCopy = () => {
    if (createdInviteLink) {
      navigator.clipboard.writeText(createdInviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReset = () => {
    setCreatedInviteLink(null);
    setFormData({ name: '', email: '', role: 'doctor', title: '' });
  };

  if (!canManageStaff) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Access Restricted" maxWidth="md">
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Insufficient RBAC Privileges
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Only the Clinic Owner / Lead Doctor has authority to generate staff onboarding invitations. Your current role is: <strong className="text-slate-800 dark:text-slate-200 uppercase">{currentUser.role}</strong>.
          </p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Invite Physician or Clinical Staff"
      subtitle={`Issue zero-trust role-delegated access to ${currentClinic.name}`}
      maxWidth="lg"
    >
      {createdInviteLink ? (
        <div className="space-y-5 py-2">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cryptographic Invitation Generated!</span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              The invite has been signed for <strong>{formData.name}</strong> as a <strong>{formData.role.toUpperCase()}</strong>. It expires in 7 days.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
              Secure One-Time Onboarding URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdInviteLink}
                className="w-full text-xs font-mono bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 select-all"
              />
              <Button
                variant={copied ? 'secondary' : 'primary'}
                onClick={handleCopy}
                icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <Button variant="outline" onClick={handleReset}>
              Invite Another Staff
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Legal Name"
            name="name"
            placeholder="e.g. Dr. Julian Croft, MD"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <Input
            label="Professional Email"
            name="email"
            type="email"
            placeholder="j.croft@clinic.org"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                RBAC Delegated Role <span className="text-rose-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="doctor">Doctor (Clinical notes, Rx, records)</option>
                <option value="receptionist">Receptionist (Intake, check-in, calendar)</option>
                <option value="owner">Lead Doctor / Co-Owner (Full admin privileges)</option>
              </select>
            </div>

            <Input
              label="Title / Specialty"
              name="title"
              placeholder="e.g. Staff Neurologist"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              required
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Principle of Least Privilege</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Assigned role permissions take effect immediately upon invite generation. Receptionists cannot access clinical diagnosis notes or issue drug prescriptions.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={<UserPlus className="w-4 h-4" />}>
              Generate Secure Invite
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
