/**
 * Strict TypeScript interfaces for ClinicOS Enterprise Zero-Trust Multi-Tenant Architecture
 */

export type UserRole = 'owner' | 'doctor' | 'receptionist';
export type RoleType = UserRole;

export type TabType =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'prescriptions'
  | 'billing'
  | 'team';

export interface User {
  id: string;
  clinic_id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title: string;
  specialty?: string;
  license_number?: string;
  phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'pending_payment' | 'expired';
export type ClinicActivationStatus = 'active' | 'pending_activation';

export interface ClinicSubscription {
  id: string;
  plan_id: SubscriptionTier;
  plan_name: string;
  amount_pkr: number;
  billing_cycle: 'monthly' | 'yearly';
  status: SubscriptionStatus;
  activated_at: string;
  expires_at: string;
  payment_method: 'card' | 'easypaisa' | 'jazzcash' | 'bank_transfer';
  transaction_reference: string;
  features: string[];
}

export interface Clinic {
  id: string;
  name: string;
  legal_name: string;
  specialty: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  tax_id: string;
  currency: string;
  website?: string;
  created_at: string;
  status: ClinicActivationStatus;
  subscription?: ClinicSubscription;
}

export interface VitalSigns {
  bp_systolic: number; // e.g. 120
  bp_diastolic: number; // e.g. 80
  heart_rate: number; // bpm
  temperature: number; // Celsius or F
  spo2: number; // %
  respiratory_rate: number;
  weight_kg: number;
  height_cm: number;
}

export interface Patient {
  id: string;
  clinic_id: string;
  mrn: string; // Medical Record Number e.g. MRN-2026-0041
  first_name: string;
  last_name: string;
  dob: string; // YYYY-MM-DD
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance_provider?: string;
  insurance_policy_number?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  visit_date: string;
  chief_complaint: string;
  diagnosis: string;
  clinical_notes: string;
  vitals?: VitalSigns;
  lab_orders?: string[];
  created_at: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentType =
  | 'consultation'
  | 'follow_up'
  | 'procedure'
  | 'emergency'
  | 'telehealth';

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  doctor_id: string;
  doctor_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  type: AppointmentType;
  status: AppointmentStatus;
  room?: string;
  notes?: string;
  created_at: string;
}

export interface PrescriptionItem {
  id: string;
  drug_name: string;
  dosage: string; // e.g. "500mg"
  route: string; // "Oral", "Topical", "IV"
  frequency: string; // e.g. "Twice daily after meals"
  duration: string; // e.g. "7 days"
  dispense_quantity: string; // e.g. "14 tablets"
  instructions: string;
}

export interface Prescription {
  id: string;
  prescription_number: string;
  clinic_id: string;
  patient_id: string;
  patient_name: string;
  patient_dob: string;
  doctor_id: string;
  doctor_name: string;
  doctor_license?: string;
  date: string;
  diagnosis: string;
  medications: PrescriptionItem[];
  precautions?: string;
  security_hash: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  code: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  clinic_id: string;
  patient_id: string;
  patient_name: string;
  date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  payment_method?: 'credit_card' | 'cash' | 'wire' | 'health_insurance';
  insurance_claim_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  clinic_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  entity_type: 'patient' | 'appointment' | 'record' | 'prescription' | 'invoice' | 'staff' | 'auth';
  entity_id: string;
  timestamp: string;
  details: string;
}

export interface StaffInvite {
  id: string;
  clinic_id: string;
  clinic_name: string;
  email: string;
  role: UserRole;
  token: string;
  expires_at: string;
  created_by: string;
  used: boolean;
}
