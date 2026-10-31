import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  ShieldCheck,
  Wallet,
  Landmark,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useStore, useClinic } from '../../hooks/useStore';
import { SUBSCRIPTION_PLANS, formatPKR, getPlanById } from '../../lib/subscriptions';
import { SubscriptionTier } from '../../types';

export interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentClinic = useClinic();
  const activateClinicSubscription = useStore((state) => state.activateClinicSubscription);

  const activeSub = currentClinic.subscription;
  const currentPlanId: SubscriptionTier = activeSub?.plan_id || 'professional';

  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionTier>(currentPlanId);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    activeSub?.billing_cycle || 'monthly'
  );
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'easypaisa' | 'jazzcash' | 'bank_transfer'>(
    activeSub?.payment_method || 'card'
  );

  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedPlan = getPlanById(selectedPlanId);
  const payableAmount = billingCycle === 'yearly' ? selectedPlan.price_yearly_pkr : selectedPlan.price_monthly_pkr;

  const handleUpdateSubscription = async () => {
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const txnReference = `TXN-PKR-${Math.floor(100000 + Math.random() * 900000)}`;

    activateClinicSubscription(currentClinic.id, {
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      amount_pkr: payableAmount,
      billing_cycle: billingCycle,
      payment_method: paymentMethod,
      transaction_reference: txnReference,
    });

    setProcessing(false);
    setSuccessMessage(`Subscription updated. ${selectedPlan.name} is now active.`);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clinic Subscription & Tier Management"
      subtitle={`Manage active plan, renewal cycle, and payment method for ${currentClinic.name}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Current Active Plan Notice */}
        {activeSub && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {activeSub.plan_name}
                </span>
                <Badge variant="success" size="sm" dot>
                  Active
                </Badge>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                Current Rate: {formatPKR(activeSub.amount_pkr)} / {activeSub.billing_cycle}
              </p>
            </div>

            <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <p>Txn: {activeSub.transaction_reference}</p>
              <p>Valid through: {new Date(activeSub.expires_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* Frequency Toggle */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Billing Frequency
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Save 16% on annual billing cycles
            </p>
          </div>

          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                -16%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const price = billingCycle === 'yearly' ? plan.price_yearly_pkr : plan.price_monthly_pkr;
            const cycleLabel = billingCycle === 'yearly' ? '/ year' : '/ mo';

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-teal-600 dark:border-teal-500 bg-teal-50/20 dark:bg-teal-950/10 shadow-xs'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1117] hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {plan.name}
                    </h4>
                    {plan.badge && (
                      <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 min-h-[28px]">
                    {plan.description}
                  </p>

                  <div className="mb-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 font-mono tabular-nums">
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {formatPKR(price)}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      {cycleLabel}
                    </span>
                  </div>

                  <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-teal-600 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    className={`w-full py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Selected Tier' : 'Choose'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
            Payment / Renewal Method (PKR)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-2 rounded-lg border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                paymentMethod === 'card'
                  ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-200 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>Card (Visa/MC)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('jazzcash')}
              className={`p-2 rounded-lg border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                paymentMethod === 'jazzcash'
                  ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-200 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Wallet className="w-4 h-4 text-amber-600" />
              <span>JazzCash</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('easypaisa')}
              className={`p-2 rounded-lg border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                paymentMethod === 'easypaisa'
                  ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-200 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>EasyPaisa</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`p-2 rounded-lg border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                paymentMethod === 'bank_transfer'
                  ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-200 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Landmark className="w-4 h-4 text-blue-600" />
              <span>1LINK / Raast</span>
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            type="button"
            loading={processing}
            onClick={handleUpdateSubscription}
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
          >
            Confirm & Pay {formatPKR(payableAmount)}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
