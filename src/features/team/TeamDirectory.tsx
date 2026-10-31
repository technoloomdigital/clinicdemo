import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Mail,
  Phone,
  Award,
  Edit3,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useStore, useClinic, useClinicDoctors } from '../../hooks/useStore';
import { formatPKR } from '../../lib/subscriptions';
import { AddDoctorModal } from './AddDoctorModal';
import { EditClinicProfileModal } from './EditClinicProfileModal';
import { ManageSubscriptionModal } from './ManageSubscriptionModal';

export interface TeamDirectoryProps {
  onOpenInvite?: () => void;
}

export const TeamDirectory: React.FC<TeamDirectoryProps> = () => {
  const currentClinic = useClinic();
  const doctors = useClinicDoctors();
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const removeDoctor = useStore((state) => state.removeDoctor);

  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isManageSubOpen, setIsManageSubOpen] = useState(false);

  const masterDoctor = doctors.find((d) => d.role === 'owner') || doctors[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 1. Clinic Profile Command Card */}
      <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              <Building2 className="w-7 h-7" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {currentClinic.name}
                </h1>
                <Badge variant="success" size="sm" dot>
                  Verified Clinical Entity
                </Badge>
              </div>

              <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                {currentClinic.specialty || 'General Practice & Diagnostics'}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                {currentClinic.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{currentClinic.address ? `${currentClinic.address}, ` : ''}{currentClinic.city}</span>
                  </span>
                )}
                {currentClinic.phone && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{currentClinic.phone}</span>
                    </span>
                  </>
                )}
                {currentClinic.email && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{currentClinic.email}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              icon={<Edit3 className="w-3.5 h-3.5 text-slate-500" />}
            >
              Edit Profile
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddDoctorOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Doctor
            </Button>
          </div>
        </div>

        {/* Master Account Advisory Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Clinic Master Doctor:</span>
            <strong className="text-slate-800 dark:text-slate-200">{masterDoctor?.name}</strong>
            <span className="font-mono text-[11px] text-slate-400">({masterDoctor?.license_number})</span>
          </div>

          <span className="text-[11px] text-slate-400">
            Authorized to manage clinic licensing and medical personnel credentials.
          </span>
        </div>
      </div>

      {/* 2. Clinic Subscription & Licensing Card */}
      <div className="rounded-xl bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-teal-700 dark:text-teal-400 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Practice Software License & Subscription
                </h2>
                <Badge
                  variant={currentClinic.status === 'active' ? 'success' : 'warning'}
                  size="sm"
                  dot
                >
                  {currentClinic.status === 'active' ? 'Account Activated' : 'Pending Activation'}
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentClinic.status === 'active' && currentClinic.subscription ? (
                  <>
                    Active Plan: <strong className="text-slate-800 dark:text-slate-200">{currentClinic.subscription.plan_name}</strong> ·{' '}
                    <span className="font-bold text-teal-700 dark:text-teal-400 font-mono tabular-nums">
                      {formatPKR(currentClinic.subscription.amount_pkr)} / {currentClinic.subscription.billing_cycle}
                    </span>
                  </>
                ) : (
                  'First when someone buys a subscription, this clinic account will be activated.'
                )}
              </p>
            </div>
          </div>

          <Button
            variant={currentClinic.status === 'active' ? 'outline' : 'primary'}
            size="md"
            onClick={() => setIsManageSubOpen(true)}
            icon={<CreditCard className="w-4 h-4" />}
          >
            {currentClinic.status === 'active' ? 'Manage Subscription (PKR)' : 'Buy Subscription & Activate'}
          </Button>
        </div>

        {/* Subscription details footer */}
        {currentClinic.subscription && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Billing Cycle: <strong className="text-slate-700 dark:text-slate-300 capitalize font-sans">{currentClinic.subscription.billing_cycle}</strong></span>
              <span>·</span>
              <span>Valid Thru: <strong className="text-slate-700 dark:text-slate-300">{new Date(currentClinic.subscription.expires_at).toLocaleDateString()}</strong></span>
              <span>·</span>
              <span>Payment: <strong className="text-slate-700 dark:text-slate-300 capitalize font-sans">{currentClinic.subscription.payment_method.replace('_', ' ')}</strong></span>
              <span>·</span>
              <span>Ref: <span className="text-slate-600 dark:text-slate-300">{currentClinic.subscription.transaction_reference}</span></span>
            </div>

            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-sans font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PKR Compliance Reconciled</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Section: Practicing Doctors Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Practicing Doctors & Medical Staff
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Authorized clinical practitioners permitted to attend visits and write prescriptions
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddDoctorOpen(true)}
            icon={<Plus className="w-3.5 h-3.5 text-slate-500" />}
          >
            Add Doctor
          </Button>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => {
            const isCurrentUser = doctor.id === currentUser.id;
            const isMaster = doctor.role === 'owner';

            return (
              <div
                key={doctor.id}
                className={`p-5 rounded-xl bg-white dark:bg-[#0E1524] border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                  isCurrentUser
                    ? 'border-teal-500 ring-2 ring-teal-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-sm font-mono shrink-0 border border-slate-200/80 dark:border-slate-700">
                        {doctor.name
                          .replace('Dr.', '')
                          .trim()
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {doctor.name}
                        </h3>
                        <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">
                          {doctor.specialty || doctor.title}
                        </p>
                      </div>
                    </div>

                    <Badge variant={isMaster ? 'purple' : 'neutral'} size="sm">
                      {isMaster ? 'Master Admin' : 'Attending'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doctor.email}</span>
                    </div>
                    {doctor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doctor.phone}</span>
                      </div>
                    )}
                    {doctor.license_number && (
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>PMDC: {doctor.license_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  {isCurrentUser ? (
                    <span className="font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Logged In
                    </span>
                  ) : (
                    <button
                      onClick={() => setCurrentUser(doctor)}
                      className="font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      Switch to this Doctor →
                    </button>
                  )}

                  {!isMaster && (
                    <button
                      onClick={() => removeDoctor(doctor.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove doctor from clinic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <AddDoctorModal
        isOpen={isAddDoctorOpen}
        onClose={() => setIsAddDoctorOpen(false)}
      />

      <EditClinicProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <ManageSubscriptionModal
        isOpen={isManageSubOpen}
        onClose={() => setIsManageSubOpen(false)}
      />
    </div>
  );
};
