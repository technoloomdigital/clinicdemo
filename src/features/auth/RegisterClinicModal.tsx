import React, { useState } from 'react';
import {
  Building2,
  User,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
  Lock,
  Wallet,
  Landmark,
  BadgeCheck,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { RegisterClinicSchema } from '../../lib/validation';
import { useStore } from '../../hooks/useStore';
import { SUBSCRIPTION_PLANS, formatPKR } from '../../lib/subscriptions';
import { SubscriptionTier } from '../../types';

export interface RegisterClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OnboardingStep = 'details' | 'plan' | 'payment' | 'success';

export const RegisterClinicModal: React.FC<RegisterClinicModalProps> = ({ isOpen, onClose }) => {
  const registerClinic = useStore((state) => state.registerClinic);

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('details');

  // Clinic & Doctor Form Data
  const [formData, setFormData] = useState({
    clinic_name: '',
    specialty: '',
    address: '',
    city: 'Lahore, Pakistan',
    phone: '',
    email: '',
    tax_id: '',
    currency: 'PKR',
    owner_name: '',
    owner_email: '',
    owner_license: '',
    owner_password: 'Password123!',
  });

  // Subscription Plan Selection
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionTier>('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'easypaisa' | 'jazzcash' | 'bank_transfer'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [walletPhone, setWalletPhone] = useState('0300-1234567');
  const [bankRef, setBankRef] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [activationResult, setActivationResult] = useState<{
    clinicName: string;
    doctorName: string;
    planName: string;
    amount: number;
    txnRef: string;
  } | null>(null);

  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];
  const payableAmount = billingCycle === 'yearly' ? selectedPlan.price_yearly_pkr : selectedPlan.price_monthly_pkr;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = RegisterClinicSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!cardHolder && formData.owner_name) {
      setCardHolder(formData.owner_name);
    }

    setCurrentStep('plan');
  };

  const handleFillDemoData = () => {
    setFormData({
      clinic_name: 'Al-Shifa Specialty Clinic & Diagnostics',
      specialty: 'Cardiometabolic & Internal Medicine',
      address: 'Plot 42-B, Main Boulevard, Gulberg III',
      city: 'Lahore, Pakistan',
      phone: '+92 (42) 3578-9000',
      email: 'contact@alshifaclinic.pk',
      tax_id: 'NTN-PK-9812401',
      currency: 'PKR',
      owner_name: 'Dr. Tariq Mahmood, MBBS, FCPS',
      owner_email: 'tariq.mahmood@alshifaclinic.pk',
      owner_license: 'PMDC-74912-P',
      owner_password: 'Password123!',
    });
    setCardHolder('Dr. Tariq Mahmood');
  };

  const handleProcessSubscriptionActivation = async () => {
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const txnReference = `TXN-PKR-${Math.floor(100000 + Math.random() * 900000)}`;

    const { clinic, owner } = registerClinic(
      {
        name: formData.clinic_name,
        legal_name: `${formData.clinic_name} (Pvt) Ltd`,
        specialty: formData.specialty,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
        email: formData.email,
        tax_id: formData.tax_id,
        currency: 'PKR',
      },
      {
        name: formData.owner_name.startsWith('Dr.') ? formData.owner_name : `Dr. ${formData.owner_name}`,
        email: formData.owner_email,
        license_number: formData.owner_license,
      },
      {
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        amount_pkr: payableAmount,
        billing_cycle: billingCycle,
        payment_method: paymentMethod,
        transaction_reference: txnReference,
      }
    );

    setActivationResult({
      clinicName: clinic.name,
      doctorName: owner.name,
      planName: selectedPlan.name,
      amount: payableAmount,
      txnRef: txnReference,
    });

    setProcessing(false);
    setCurrentStep('success');
  };

  const handleFinish = () => {
    setCurrentStep('details');
    setActivationResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={currentStep === 'success' ? handleFinish : onClose}
      title={
        currentStep === 'success'
          ? 'Clinic Account Activated'
          : 'Create & Activate Clinic Account'
      }
      subtitle={
        currentStep === 'details'
          ? 'Step 1 of 3: Practice coordinates and Lead Doctor credentials'
          : currentStep === 'plan'
          ? 'Step 2 of 3: Select Clinical Practice Tier (Billed in PKR)'
          : currentStep === 'payment'
          ? 'Step 3 of 3: Subscription Checkout — Account activates upon purchase'
          : 'Your clinic workspace is activated and ready for clinical operations'
      }
      maxWidth={currentStep === 'plan' ? '4xl' : '2xl'}
    >
      {/* Executive Step Progress Bar */}
      {currentStep !== 'success' && (
        <div className="mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold font-mono transition-colors ${
                  currentStep === 'details'
                    ? 'bg-teal-600 text-white'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {currentStep === 'plan' || currentStep === 'payment' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  '1'
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  currentStep === 'details'
                    ? 'text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Clinic Details
              </span>
            </div>

            <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold font-mono transition-colors ${
                  currentStep === 'plan'
                    ? 'bg-teal-600 text-white'
                    : currentStep === 'payment'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {currentStep === 'payment' ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span
                className={`text-xs font-medium ${
                  currentStep === 'plan'
                    ? 'text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Subscription Plan
              </span>
            </div>

            <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold font-mono transition-colors ${
                  currentStep === 'payment'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                3
              </div>
              <span
                className={`text-xs font-medium ${
                  currentStep === 'payment'
                    ? 'text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Pay & Activate
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Details */}
      {currentStep === 'details' && (
        <form onSubmit={handleDetailsNext} className="space-y-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Enter official clinic credentials.
            </span>
            <button
              type="button"
              onClick={handleFillDemoData}
              className="text-teal-600 dark:text-teal-400 hover:underline font-medium cursor-pointer"
            >
              Fill Sample Clinic Data
            </button>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Practice Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <Input
                  label="Clinic Name"
                  name="clinic_name"
                  placeholder="e.g. Al-Noor Health & Medical Center"
                  value={formData.clinic_name}
                  onChange={handleInputChange}
                  error={errors.clinic_name}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Specialty"
                  name="specialty"
                  placeholder="e.g. Internal Medicine, Cardiology & Diagnostics"
                  value={formData.specialty}
                  onChange={handleInputChange}
                  error={errors.specialty}
                  required
                />
              </div>
              <Input
                label="Physical Address"
                name="address"
                placeholder="Suite 204, Medical Plaza, Gulberg"
                value={formData.address}
                onChange={handleInputChange}
                error={errors.address}
                required
              />
              <Input
                label="City & Region"
                name="city"
                placeholder="Lahore, Pakistan"
                value={formData.city}
                onChange={handleInputChange}
                error={errors.city}
                required
              />
              <Input
                label="Phone Number"
                name="phone"
                placeholder="+92 (42) 3578-9000"
                value={formData.phone}
                onChange={handleInputChange}
                error={errors.phone}
                required
              />
              <Input
                label="Clinic Email"
                name="email"
                type="email"
                placeholder="contact@alnoormedical.pk"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                required
              />
              <div className="sm:col-span-2">
                <Input
                  label="Regulatory Tax ID / Registration"
                  name="tax_id"
                  placeholder="NTN-9812401 or PHC-REG-2026"
                  value={formData.tax_id}
                  onChange={handleInputChange}
                  error={errors.tax_id}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>Lead Doctor Account (Clinic Master)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Doctor Full Name"
                name="owner_name"
                placeholder="Dr. Salman Khan, MD"
                value={formData.owner_name}
                onChange={handleInputChange}
                error={errors.owner_name}
                required
              />
              <Input
                label="PMDC License Number"
                name="owner_license"
                placeholder="PMDC-89214-P"
                value={formData.owner_license}
                onChange={handleInputChange}
                error={errors.owner_license}
                required
              />
              <div className="sm:col-span-2">
                <Input
                  label="Master Login Email"
                  name="owner_email"
                  type="email"
                  placeholder="salman.khan@alnoormedical.pk"
                  value={formData.owner_email}
                  onChange={handleInputChange}
                  error={errors.owner_email}
                  required
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <strong>Activation Policy:</strong> First when someone buys a subscription, this clinic account will be activated.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Proceed to Plan Selection
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2: Plan Selection */}
      {currentStep === 'plan' && (
        <div className="space-y-5">
          {/* Billing Switcher */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Billing Cadence
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Annual billing includes a 2-month fee reduction
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

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const price = billingCycle === 'yearly' ? plan.price_yearly_pkr : plan.price_monthly_pkr;
              const cycleLabel = billingCycle === 'yearly' ? '/ year' : '/ mo';

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative rounded-xl p-4 border transition-colors cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-teal-600 dark:border-teal-500 bg-teal-50/20 dark:bg-teal-950/10 shadow-xs'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0D1117] hover:border-slate-300'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-3 right-3 text-[10px] font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider font-mono">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3 min-h-[32px]">
                      {plan.description}
                    </p>

                    <div className="mb-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-baseline gap-1 font-mono tabular-nums">
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {formatPKR(price)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {cycleLabel}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isSelected ? 'Selected Plan' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => setCurrentStep('details')}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={() => setCurrentStep('payment')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Proceed to Payment
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment & Instant Activation */}
      {currentStep === 'payment' && (
        <div className="space-y-5">
          {/* Order Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formData.clinic_name || 'Clinic Account'}
              </span>
              <span className="font-mono text-teal-700 dark:text-teal-400 font-semibold">
                {selectedPlan.name} ({billingCycle.toUpperCase()})
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Practice License Rate</span>
              <span className="font-mono tabular-nums">{formatPKR(payableAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Tenant Encryption & Setup</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">Included</span>
            </div>
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between font-bold text-sm text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              <span>Total Payable (PKR)</span>
              <span className="text-teal-700 dark:text-teal-400">{formatPKR(payableAmount)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Payment Method (Domestic PKR)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-lg border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 text-xs ${
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
                className={`p-2.5 rounded-lg border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 text-xs ${
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
                className={`p-2.5 rounded-lg border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 text-xs ${
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
                className={`p-2.5 rounded-lg border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 text-xs ${
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

          {/* Form for selected method */}
          {paymentMethod === 'card' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800">
              <Input
                label="Cardholder Name"
                placeholder="Dr. Salman Khan"
                value={cardHolder || formData.owner_name}
                onChange={(e) => setCardHolder(e.target.value)}
                required
              />
              <Input
                label="Card Number"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Expires"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  required
                />
                <Input
                  label="CVC"
                  placeholder="123"
                  defaultValue="882"
                  type="password"
                  required
                />
              </div>
            </div>
          )}

          {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
            <div className="space-y-3 p-3.5 rounded-xl bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800">
              <Input
                label={`${paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} Wallet Mobile Number`}
                placeholder="0300-1234567"
                value={walletPhone}
                onChange={(e) => setWalletPhone(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You will receive an in-app authorization prompt on your mobile wallet for {formatPKR(payableAmount)}.
              </p>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">1LINK Raast Settlement Account:</p>
                <p>Meezan Bank Ltd · IBAN: PK64MEZN0001092840192801</p>
              </div>
              <Input
                label="Transfer Reference / UTR Number"
                placeholder="FT260984129"
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
              />
            </div>
          )}

          {/* Activation Notice */}
          <div className="p-3 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-500/20 text-xs text-teal-800 dark:text-teal-200 flex items-start gap-2.5">
            <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span>
              <strong>Activation Policy Enforced:</strong> Authorizing this subscription purchase immediately marks your clinic as <strong>ACTIVATED</strong> with full clinical database access.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <Button
              variant="outline"
              type="button"
              disabled={processing}
              onClick={() => setCurrentStep('plan')}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              type="button"
              loading={processing}
              onClick={handleProcessSubscriptionActivation}
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Pay {formatPKR(payableAmount)} & Activate Clinic
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Success */}
      {currentStep === 'success' && activationResult && (
        <div className="space-y-5 text-center py-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <BadgeCheck className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Clinic Account Successfully Activated
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Subscription verified in PKR. Practice database is provisioned and ready for operation.
            </p>
          </div>

          <div className="max-w-md mx-auto p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-left space-y-2 text-xs font-mono tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Clinic Name:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 font-sans">{activationResult.clinicName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Master Doctor:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 font-sans">{activationResult.doctorName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Active Tier:</span>
              <span className="font-semibold text-teal-700 dark:text-teal-400 font-sans">{activationResult.planName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Amount Settled:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{formatPKR(activationResult.amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Txn Reference:</span>
              <span className="text-slate-700 dark:text-slate-300">{activationResult.txnRef}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 font-sans">
              <span className="text-slate-500">Status:</span>
              <Badge variant="success" size="sm" dot>
                Active
              </Badge>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleFinish}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Enter Clinic Workspace
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
