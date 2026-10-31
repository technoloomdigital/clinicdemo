import { SubscriptionTier } from '../types';

export interface SubscriptionPlanDef {
  id: SubscriptionTier;
  name: string;
  badge?: string;
  popular?: boolean;
  price_monthly_pkr: number;
  price_yearly_pkr: number;
  description: string;
  maxDoctors: number;
  maxPatients: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDef[] = [
  {
    id: 'starter',
    name: 'Starter Clinic',
    price_monthly_pkr: 15000,
    price_yearly_pkr: 150000,
    description: 'Designed for solo practitioners and boutique medical clinics.',
    maxDoctors: 2,
    maxPatients: 500,
    features: [
      'Up to 2 Practicing Doctors',
      'Up to 500 Patient Records',
      'Electronic Prescriptions with QR Seal',
      'PKR Billing & Invoicing Suite (Rs.)',
      'Appointment Scheduling Calendar',
      'Standard Clinical Support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional Practice',
    popular: true,
    badge: 'Most Popular',
    price_monthly_pkr: 35000,
    price_yearly_pkr: 350000,
    description: 'Full clinical management for expanding practices and polyclinics.',
    maxDoctors: 10,
    maxPatients: 5000,
    features: [
      'Up to 10 Practicing Doctors & Staff',
      'Unlimited Patient Records & History',
      'Cryptographic Rx Verification & Print',
      'Complete PKR Financial Analytics (Rs.)',
      'Multi-room & Priority Scheduling',
      'Zero-Trust Clinical Audit Logging',
      'Priority 24/7 Support Hotline',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Healthcare',
    badge: 'Multi-Department',
    price_monthly_pkr: 75000,
    price_yearly_pkr: 750000,
    description: 'Comprehensive operational suite for surgical clinics and multi-specialty centers.',
    maxDoctors: 50,
    maxPatients: 50000,
    features: [
      'Unlimited Practicing Doctors & Specialties',
      'Multi-Department Surgical Calendar',
      'Custom Letterhead & Digital Seal',
      'Complete Financial & Tax Ledger (Rs.)',
      'Integrated Clinical Vitals Monitoring',
      'Dedicated Account Executive & SLA',
    ],
  },
];

export function getPlanById(planId: SubscriptionTier): SubscriptionPlanDef {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  return plan || SUBSCRIPTION_PLANS[1]; // default to professional
}

export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
