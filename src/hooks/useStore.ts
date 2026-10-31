import { useMemo } from 'react';
import { create } from 'zustand';
import { generatePrescriptionHash, generateSecureToken, sanitizeString } from '../lib/security';
import {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Clinic,
  ClinicSubscription,
  SubscriptionTier,
  Invoice,
  MedicalRecord,
  Patient,
  Prescription,
  StaffInvite,
  User,
  UserRole,
  TabType,
} from '../types';
import { getPlanById } from '../lib/subscriptions';

// Initial Seed Data for Demo & Zero-Trust Tenant Isolation Verification
const INITIAL_CLINICS: Clinic[] = [
  {
    id: 'clinic-aura-01',
    name: 'Aura Health & Longevity Institute',
    legal_name: 'Aura Medical Specialties LLC',
    specialty: 'Precision Preventive & Longevity Medicine',
    address: '450 Sutter Street, Suite 1800',
    city: 'San Francisco, CA',
    phone: '+1 (415) 890-2100',
    email: 'contact@auramedical.com',
    tax_id: 'US-EIN-94-382910',
    currency: 'PKR',
    website: 'https://auramedical.com',
    created_at: '2025-01-10T08:00:00Z',
    status: 'active',
    subscription: {
      id: 'sub-aura-01',
      plan_id: 'professional',
      plan_name: 'Professional Practice Plan',
      amount_pkr: 35000,
      billing_cycle: 'monthly',
      status: 'active',
      activated_at: '2025-01-10T08:00:00Z',
      expires_at: '2027-01-10T08:00:00Z',
      payment_method: 'card',
      transaction_reference: 'TXN-PKR-984128-AURA',
      features: [
        'Up to 10 Practicing Doctors',
        'Unlimited Patient Records',
        'Cryptographic Rx Seals',
        'PKR Financial & Invoicing Suite',
        '24/7 Clinical Support',
      ],
    },
  },
  {
    id: 'clinic-vanguard-02',
    name: 'Vanguard Orthopedic & Spine Surgery',
    legal_name: 'Vanguard Surgical Group PC',
    specialty: 'Spine Reconstruction & Sports Medicine',
    address: '780 Lexington Avenue, 12th Floor',
    city: 'New York, NY',
    phone: '+1 (212) 555-0198',
    email: 'info@vanguardortho.com',
    tax_id: 'US-EIN-13-882914',
    currency: 'PKR',
    website: 'https://vanguardortho.com',
    created_at: '2025-02-01T08:00:00Z',
    status: 'active',
    subscription: {
      id: 'sub-vanguard-02',
      plan_id: 'enterprise',
      plan_name: 'Enterprise Healthcare Plan',
      amount_pkr: 75000,
      billing_cycle: 'monthly',
      status: 'active',
      activated_at: '2025-02-01T08:00:00Z',
      expires_at: '2027-02-01T08:00:00Z',
      payment_method: 'bank_transfer',
      transaction_reference: 'TXN-PKR-109241-VANGUARD',
      features: [
        'Unlimited Practicing Doctors',
        'Surgical Theater Scheduling',
        'Dedicated Audit Trail & Governance',
        'Multi-Department Invoicing (Rs.)',
        'Priority Account Manager',
      ],
    },
  },
];

const INITIAL_USERS: User[] = [
  // Aura Clinic Staff
  {
    id: 'user-aura-owner',
    clinic_id: 'clinic-aura-01',
    name: 'Dr. Evelyn Vance, MD',
    email: 'evelyn.vance@auramedical.com',
    role: 'owner',
    title: 'Chief Medical Officer & Founder',
    license_number: 'CA-G89124',
    phone: '+1 (415) 890-2101',
    status: 'active',
    created_at: '2025-01-10T08:00:00Z',
  },
  {
    id: 'user-aura-doc2',
    clinic_id: 'clinic-aura-01',
    name: 'Dr. Marcus Thorne, MD',
    email: 'marcus.thorne@auramedical.com',
    role: 'doctor',
    title: 'Senior Cardiometabolic Specialist',
    license_number: 'CA-A72109',
    phone: '+1 (415) 890-2102',
    status: 'active',
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'user-aura-rec',
    clinic_id: 'clinic-aura-01',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@auramedical.com',
    role: 'receptionist',
    title: 'Patient Intake & Concierge Coordinator',
    phone: '+1 (415) 890-2105',
    status: 'active',
    created_at: '2025-01-20T08:00:00Z',
  },
  // Vanguard Clinic Staff
  {
    id: 'user-vanguard-owner',
    clinic_id: 'clinic-vanguard-02',
    name: 'Dr. Robert Chen, MD, FACS',
    email: 'robert.chen@vanguardortho.com',
    role: 'owner',
    title: 'Director of Spine Reconstruction',
    license_number: 'NY-SP4821',
    phone: '+1 (212) 555-0199',
    status: 'active',
    created_at: '2025-02-01T08:00:00Z',
  },
  {
    id: 'user-vanguard-rec',
    clinic_id: 'clinic-vanguard-02',
    name: 'Liam O\'Connor',
    email: 'liam@vanguardortho.com',
    role: 'receptionist',
    title: 'Surgical Receptionist',
    phone: '+1 (212) 555-0205',
    status: 'active',
    created_at: '2025-02-05T08:00:00Z',
  },
];

const INITIAL_PATIENTS: Patient[] = [
  // Aura Health Patients
  {
    id: 'pat-aura-01',
    clinic_id: 'clinic-aura-01',
    mrn: 'MRN-AURA-2026-0041',
    first_name: 'Eleanor',
    last_name: 'St. Claire',
    dob: '1984-04-18',
    gender: 'female',
    phone: '+1 (415) 992-1204',
    email: 'eleanor.stclaire@luxmail.com',
    address: '2240 Pacific Ave, Apt 4B, San Francisco, CA',
    blood_group: 'A+',
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronic_conditions: ['Subclinical Hypothyroidism', 'Mild Hyperlipidemia'],
    emergency_contact: {
      name: 'Julian St. Claire',
      relationship: 'Spouse',
      phone: '+1 (415) 992-1205',
    },
    insurance_provider: 'Aetna Signature Premier',
    insurance_policy_number: 'AET-990-281-2',
    created_at: '2025-03-01T10:00:00Z',
    updated_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 'pat-aura-02',
    clinic_id: 'clinic-aura-01',
    mrn: 'MRN-AURA-2026-0088',
    first_name: 'Alexander',
    last_name: 'Hayes',
    dob: '1976-11-09',
    gender: 'male',
    phone: '+1 (415) 671-8840',
    email: 'a.hayes@hayesventures.com',
    address: '150 Marina Blvd, San Francisco, CA',
    blood_group: 'O-',
    allergies: [],
    chronic_conditions: ['Essential Hypertension'],
    emergency_contact: {
      name: 'Claire Hayes',
      relationship: 'Sister',
      phone: '+1 (415) 671-8849',
    },
    insurance_provider: 'Blue Cross Blue Shield Elite',
    insurance_policy_number: 'BCBS-110-829',
    created_at: '2025-03-10T11:00:00Z',
    updated_at: '2025-03-10T11:00:00Z',
  },
  {
    id: 'pat-aura-03',
    clinic_id: 'clinic-aura-01',
    mrn: 'MRN-AURA-2026-0105',
    first_name: 'Sophia',
    last_name: 'Montoya',
    dob: '1992-08-25',
    gender: 'female',
    phone: '+1 (415) 330-4921',
    email: 'sophia.m@designstudio.io',
    address: '88 King Street, San Francisco, CA',
    blood_group: 'B+',
    allergies: ['NSAIDs', 'Latex'],
    chronic_conditions: ['Mitral Valve Prolapse (Mild)'],
    emergency_contact: {
      name: 'Carlos Montoya',
      relationship: 'Father',
      phone: '+1 (415) 330-4999',
    },
    insurance_provider: 'Cigna Global Health',
    insurance_policy_number: 'CGH-774-291',
    created_at: '2025-03-14T09:00:00Z',
    updated_at: '2025-03-14T09:00:00Z',
  },
  // Vanguard Ortho Patients (Isolated Tenant)
  {
    id: 'pat-vanguard-01',
    clinic_id: 'clinic-vanguard-02',
    mrn: 'MRN-VANG-2026-0012',
    first_name: 'David',
    last_name: 'Kowalski',
    dob: '1989-02-14',
    gender: 'male',
    phone: '+1 (212) 441-9011',
    email: 'dkowalski@athletics.org',
    address: '420 W 42nd St, New York, NY',
    blood_group: 'O+',
    allergies: ['Codeine'],
    chronic_conditions: ['Post-L4/L5 Discectomy'],
    emergency_contact: {
      name: 'Anna Kowalski',
      relationship: 'Wife',
      phone: '+1 (212) 441-9012',
    },
    insurance_provider: 'UnitedHealthcare Choice Plus',
    insurance_policy_number: 'UHC-440-192-K',
    created_at: '2025-02-10T14:00:00Z',
    updated_at: '2025-02-10T14:00:00Z',
  },
];

const getTodayDate = () => new Date().toISOString().split('T')[0];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    clinic_id: 'clinic-aura-01',
    patient_id: 'pat-aura-01',
    patient_name: 'Eleanor St. Claire',
    patient_phone: '+1 (415) 992-1204',
    doctor_id: 'user-aura-owner',
    doctor_name: 'Dr. Evelyn Vance, MD',
    date: getTodayDate(),
    start_time: '09:00',
    end_time: '09:45',
    type: 'consultation',
    status: 'in_consultation',
    room: 'Suite A - Longevity Suite',
    notes: 'Comprehensive biomarker and hormonal profile review',
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 'apt-002',
    clinic_id: 'clinic-aura-01',
    patient_id: 'pat-aura-02',
    patient_name: 'Alexander Hayes',
    patient_phone: '+1 (415) 671-8840',
    doctor_id: 'user-aura-doc2',
    doctor_name: 'Dr. Marcus Thorne, MD',
    date: getTodayDate(),
    start_time: '10:00',
    end_time: '10:30',
    type: 'follow_up',
    status: 'checked_in',
    room: 'Cardio Lab 2',
    notes: 'Evaluation of ambulatory blood pressure monitor data',
    created_at: '2026-09-11T12:00:00Z',
  },
  {
    id: 'apt-003',
    clinic_id: 'clinic-aura-01',
    patient_id: 'pat-aura-03',
    patient_name: 'Sophia Montoya',
    patient_phone: '+1 (415) 330-4921',
    doctor_id: 'user-aura-owner',
    doctor_name: 'Dr. Evelyn Vance, MD',
    date: getTodayDate(),
    start_time: '11:15',
    end_time: '12:00',
    type: 'procedure',
    status: 'scheduled',
    room: 'Infusion Suite 1',
    notes: 'High-dose micronutrient and NAD+ cellular restoration protocol',
    created_at: '2026-09-12T09:00:00Z',
  },
  // Vanguard Appointment
  {
    id: 'apt-004',
    clinic_id: 'clinic-vanguard-02',
    patient_id: 'pat-vanguard-01',
    patient_name: 'David Kowalski',
    patient_phone: '+1 (212) 441-9011',
    doctor_id: 'user-vanguard-owner',
    doctor_name: 'Dr. Robert Chen, MD, FACS',
    date: getTodayDate(),
    start_time: '09:30',
    end_time: '10:15',
    type: 'consultation',
    status: 'scheduled',
    room: 'Ortho Exam 4',
    notes: '6-week post-operative lumbar spine assessment & MRI review',
    created_at: '2026-09-13T15:00:00Z',
  },
];

const INITIAL_RECORDS: MedicalRecord[] = [
  {
    id: 'rec-001',
    clinic_id: 'clinic-aura-01',
    patient_id: 'pat-aura-01',
    doctor_id: 'user-aura-owner',
    doctor_name: 'Dr. Evelyn Vance, MD',
    visit_date: '2026-08-15',
    chief_complaint: 'Mild afternoon cognitive fatigue, optimization checkup',
    diagnosis: 'Metabolic Inflexibility & Mild Circadian Dysregulation',
    clinical_notes:
      'Patient reports improved energy following morning sunlight exposure. Fasting insulin 4.2 uIU/mL. ApoB 72 mg/dL. Titrated thyroid replacement slightly.',
    vitals: {
      bp_systolic: 116,
      bp_diastolic: 74,
      heart_rate: 64,
      temperature: 36.8,
      spo2: 99,
      respiratory_rate: 14,
      weight_kg: 61.2,
      height_cm: 168,
    },
    lab_orders: ['Comprehensive Metabolic Panel', 'ApoB/ApoA1 Ratio', 'Fasting Lipids'],
    created_at: '2026-08-15T10:30:00Z',
  },
];

const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-001',
    prescription_number: 'RX-2026-90412',
    clinic_id: 'clinic-aura-01',
    patient_id: 'pat-aura-01',
    patient_name: 'Eleanor St. Claire',
    patient_dob: '1984-04-18',
    doctor_id: 'user-aura-owner',
    doctor_name: 'Dr. Evelyn Vance, MD',
    doctor_license: 'CA-G89124',
    date: '2026-08-15',
    diagnosis: 'Subclinical Thyroid Optimization & Dyslipidemia',
    medications: [
      {
        id: 'rx-item-1',
        drug_name: 'Levothyroxine Sodium',
        dosage: '50 mcg',
        route: 'Oral',
        frequency: 'Once daily in morning on empty stomach',
        duration: '90 days',
        dispense_quantity: '90 tablets',
        instructions: 'Take 30-60 minutes before breakfast with full glass of water.',
      },
      {
        id: 'rx-item-2',
        drug_name: 'Rosuvastatin Calcium',
        dosage: '5 mg',
        route: 'Oral',
        frequency: 'Once daily at bedtime',
        duration: '90 days',
        dispense_quantity: '90 tablets',
        instructions: 'Take at night. Periodic hepatic enzyme monitoring required.',
      },
    ],
    precautions: 'Patient is allergic to Penicillin. Do not substitute with beta-lactams.',
    security_hash: 'RX-SHA256-A8391F0B-9021',
    created_at: '2026-08-15T11:00:00Z',
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    invoice_number: 'INV-2026-0048',
    clinic_id: 'clinic-aura-01',
    patient_id: 'pat-aura-01',
    patient_name: 'Eleanor St. Claire',
    date: '2026-08-15',
    due_date: '2026-08-30',
    items: [
      {
        id: 'item-1',
        code: 'CPT-99214',
        description: 'Comprehensive Longevity Consultation & Exam',
        quantity: 1,
        unit_price: 3500.0,
        total: 3500.0,
      },
      {
        id: 'item-2',
        code: 'CPT-80061',
        description: 'Advanced Cardio-Metabolic Biomarker Panel',
        quantity: 1,
        unit_price: 2500.0,
        total: 2500.0,
      },
    ],
    subtotal: 6000.0,
    tax_rate: 0,
    tax_amount: 0,
    discount: 500.0,
    total: 5500.0,
    status: 'paid',
    payment_method: 'credit_card',
    created_at: '2026-08-15T11:30:00Z',
  },
  {
    id: 'inv-002',
    invoice_number: 'INV-2026-0049',
    clinic_id: 'clinic-aura-01',
    patient_id: 'pat-aura-02',
    patient_name: 'Alexander Hayes',
    date: getTodayDate(),
    due_date: getTodayDate(),
    items: [
      {
        id: 'item-3',
        code: 'CPT-93000',
        description: 'Electrocardiogram & Hemodynamic Monitoring',
        quantity: 1,
        unit_price: 3000.0,
        total: 3000.0,
      },
    ],
    subtotal: 3000.0,
    tax_rate: 0,
    tax_amount: 0,
    discount: 0,
    total: 3000.0,
    status: 'pending',
    created_at: '2026-09-14T08:00:00Z',
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    clinic_id: 'clinic-aura-01',
    user_id: 'user-aura-owner',
    user_name: 'Dr. Evelyn Vance, MD',
    user_role: 'owner',
    action: 'INITIALIZE_TENANT',
    entity_type: 'auth',
    entity_id: 'clinic-aura-01',
    timestamp: '2026-09-14T07:00:00Z',
    details: 'Clinic master tenancy established with strict RBAC segregation',
  },
  {
    id: 'log-002',
    clinic_id: 'clinic-aura-01',
    user_id: 'user-aura-rec',
    user_name: 'Sarah Jenkins',
    user_role: 'receptionist',
    action: 'CHECK_IN_PATIENT',
    entity_type: 'appointment',
    entity_id: 'apt-002',
    timestamp: '2026-09-14T07:45:00Z',
    details: 'Patient Alexander Hayes checked in at front desk',
  },
];

export interface ClinicMetrics {
  totalPatients: number;
  todayAppointments: number;
  checkedInCount: number;
  inConsultationCount: number;
  completedCount: number;
  todayRevenue: number;
  avgWaitTimeMinutes: number;
}

interface AppStore {
  // Multitenancy & Session state
  clinics: Clinic[];
  currentClinicId: string;
  users: User[];
  currentUser: User;
  theme: 'light' | 'dark';
  isDarkMode: boolean;
  activeTab: TabType;
  isLoading: boolean;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;

  // Domain Entities
  patients: Patient[];
  appointments: Appointment[];
  records: MedicalRecord[];
  prescriptions: Prescription[];
  invoices: Invoice[];
  auditLogs: AuditLog[];
  staffInvites: StaffInvite[];

  // Optimistic rollback cache
  _rollbackAppointment: Appointment | null;

  // Actions
  setActiveTab: (tab: TabType) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setCurrentUser: (user: User) => void;
  /** Hydrates currentUser/currentClinicId from a real backend login/session (server/auth/*). */
  setAuthenticatedUser: (backendUser: { id: string; clinicId: string; name: string; email: string; role: UserRole }) => void;
  switchClinic: (clinicId: string) => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  setLoading: (val: boolean) => void;

  // Tenant-Scoped Data Accessors (Strict Zero-Trust)
  getCurrentClinic: () => Clinic;
  getClinicPatients: () => Patient[];
  getClinicAppointments: () => Appointment[];
  getClinicRecords: (patientId?: string) => MedicalRecord[];
  getClinicPrescriptions: (patientId?: string) => Prescription[];
  getClinicInvoices: (patientId?: string) => Invoice[];
  getClinicStaff: () => User[];
  getClinicAuditLogs: () => AuditLog[];
  getClinicMetrics: () => ClinicMetrics;

  // CRUD Mutations with single-source-of-truth updates
  updateAppointmentStatus: (
    appointmentId: string,
    newStatus: AppointmentStatus,
    simulateRollbackError?: boolean
  ) => Promise<boolean>;
  addPatient: (data: Omit<Patient, 'id' | 'clinic_id' | 'mrn' | 'created_at' | 'updated_at'>) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  addAppointment: (data: Omit<Appointment, 'id' | 'clinic_id' | 'created_at'>) => Appointment;
  addMedicalRecord: (data: Omit<MedicalRecord, 'id' | 'clinic_id' | 'created_at'>) => MedicalRecord;
  addPrescription: (
    data: Omit<Prescription, 'id' | 'clinic_id' | 'prescription_number' | 'security_hash' | 'created_at'>
  ) => Prescription;
  addInvoice: (data: Omit<Invoice, 'id' | 'clinic_id' | 'invoice_number' | 'created_at'>) => Invoice;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  createStaffInvite: (email: string, role: UserRole, title: string, name: string) => StaffInvite;
  updateClinicProfile: (data: Partial<Clinic>) => void;
  addDoctor: (doctorData: {
    name: string;
    email: string;
    specialty: string;
    license_number: string;
    phone?: string;
    role?: UserRole;
    title?: string;
  }) => User;
  updateDoctor: (doctorId: string, data: Partial<User>) => void;
  removeDoctor: (doctorId: string) => void;
  registerClinic: (
    clinicData: Omit<Clinic, 'id' | 'created_at' | 'status' | 'subscription'>,
    ownerData: { name: string; email: string; license_number: string },
    subscriptionData?: {
      plan_id: SubscriptionTier;
      plan_name: string;
      amount_pkr: number;
      billing_cycle: 'monthly' | 'yearly';
      payment_method: 'card' | 'easypaisa' | 'jazzcash' | 'bank_transfer';
      transaction_reference?: string;
    }
  ) => { clinic: Clinic; owner: User };
  activateClinicSubscription: (
    clinicId: string,
    subscriptionData: {
      plan_id: SubscriptionTier;
      plan_name: string;
      amount_pkr: number;
      billing_cycle: 'monthly' | 'yearly';
      payment_method: 'card' | 'easypaisa' | 'jazzcash' | 'bank_transfer';
      transaction_reference?: string;
    }
  ) => void;
  addAuditLog: (
    action: string,
    entity_type: AuditLog['entity_type'],
    entity_id: string,
    details: string
  ) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  clinics: INITIAL_CLINICS,
  currentClinicId: 'clinic-aura-01',
  users: INITIAL_USERS,
  currentUser: INITIAL_USERS[0],
  theme: 'light',
  isDarkMode: false,
  activeTab: 'dashboard',
  isLoading: false,
  toastMessage: null,

  patients: INITIAL_PATIENTS,
  appointments: INITIAL_APPOINTMENTS,
  records: INITIAL_RECORDS,
  prescriptions: INITIAL_PRESCRIPTIONS,
  invoices: INITIAL_INVOICES,
  auditLogs: INITIAL_AUDIT_LOGS,
  staffInvites: [],
  _rollbackAppointment: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setCurrentUser: (user) => {
    set({ currentUser: user });
    get().addAuditLog(
      'SWITCH_USER_PERSONA',
      'auth',
      user.id,
      `Switched active persona to ${user.name} (${user.role.toUpperCase()})`
    );
  },

  setAuthenticatedUser: (backendUser) => {
    // The mock data (INITIAL_USERS) and the real backend (server/auth/users.ts) share the
    // same ids/emails for the 5 demo accounts, so a successful real login maps straight onto
    // the existing rich mock record (title, license number, etc). If a future user only
    // exists in the backend, fall back to a minimal record built from the login response.
    const existing = get().users.find((u) => u.id === backendUser.id);
    const user: User =
      existing ??
      ({
        id: backendUser.id,
        clinic_id: backendUser.clinicId,
        name: backendUser.name,
        email: backendUser.email,
        role: backendUser.role,
        status: 'active',
        created_at: new Date().toISOString(),
      } as User);
    set({ currentUser: user, currentClinicId: backendUser.clinicId });
    get().addAuditLog('LOGIN', 'auth', user.id, `${user.name} signed in`);
  },

  setTheme: (theme) => {
    set({ theme, isDarkMode: theme === 'dark' });
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },

  switchClinic: (clinicId: string) => {
    const targetClinic = get().clinics.find((c) => c.id === clinicId);
    if (!targetClinic) return;

    // Find the lead doctor/owner of the target clinic
    const clinicUsers = get().users.filter((u) => u.clinic_id === clinicId);
    const targetUser = clinicUsers.find((u) => u.role === 'owner') || clinicUsers[0];

    set({
      currentClinicId: clinicId,
      currentUser: targetUser,
      isLoading: true,
    });

    // Add audit log
    get().addAuditLog(
      'SWITCH_TENANT',
      'auth',
      clinicId,
      `Tenant session switched to ${targetClinic.name}`
    );

    get().showToast(`Switched workspace to ${targetClinic.name}`, 'info');

    // Simulate brief zero-trust handshake for skeleton screen demonstration
    setTimeout(() => {
      set({ isLoading: false });
    }, 450);
  },

  switchUser: (userId: string) => {
    const user = get().users.find((u) => u.id === userId && u.clinic_id === get().currentClinicId);
    if (user) {
      set({ currentUser: user });
      get().showToast(`Switched active profile to ${user.name} (${user.role.toUpperCase()})`, 'info');
      get().addAuditLog('SWITCH_USER', 'auth', user.id, `User impersonation active: ${user.name}`);
    }
  },

  switchRole: (role: UserRole) => {
    const current = get().currentUser;
    // Find or adapt user for this clinic with target role
    const existing = get().users.find((u) => u.clinic_id === get().currentClinicId && u.role === role);
    if (existing) {
      set({ currentUser: existing });
      get().showToast(`Switched role to ${role.toUpperCase()} (${existing.name})`, 'info');
    } else {
      // Modify current user role for rapid testing
      const updatedUser = { ...current, role };
      set({
        currentUser: updatedUser,
        users: get().users.map((u) => (u.id === current.id ? updatedUser : u)),
      });
      get().showToast(`Active role toggled to ${role.toUpperCase()}`, 'info');
    }
  },

  showToast: (text: string, type = 'success') => {
    set({ toastMessage: { text, type } });
    setTimeout(() => {
      if (get().toastMessage?.text === text) {
        set({ toastMessage: null });
      }
    }, 4000);
  },

  clearToast: () => set({ toastMessage: null }),

  setLoading: (isLoading) => set({ isLoading }),

  // Strict Zero-Trust Data Selectors
  getCurrentClinic: () => {
    const clinic = get().clinics.find((c) => c.id === get().currentClinicId);
    return clinic || get().clinics[0];
  },

  getClinicPatients: () => {
    const cid = get().currentClinicId;
    return get().patients.filter((p) => p.clinic_id === cid);
  },

  getClinicAppointments: () => {
    const cid = get().currentClinicId;
    return get().appointments.filter((a) => a.clinic_id === cid);
  },

  getClinicRecords: (patientId?: string) => {
    const cid = get().currentClinicId;
    return get().records.filter(
      (r) => r.clinic_id === cid && (!patientId || r.patient_id === patientId)
    );
  },

  getClinicPrescriptions: (patientId?: string) => {
    const cid = get().currentClinicId;
    return get().prescriptions.filter(
      (p) => p.clinic_id === cid && (!patientId || p.patient_id === patientId)
    );
  },

  getClinicInvoices: (patientId?: string) => {
    const cid = get().currentClinicId;
    return get().invoices.filter(
      (i) => i.clinic_id === cid && (!patientId || i.patient_id === patientId)
    );
  },

  getClinicStaff: () => {
    const cid = get().currentClinicId;
    return get().users.filter((u) => u.clinic_id === cid);
  },

  getClinicAuditLogs: () => {
    const cid = get().currentClinicId;
    return get().auditLogs.filter((l) => l.clinic_id === cid);
  },

  getClinicMetrics: () => {
    const cid = get().currentClinicId;
    const today = getTodayDate();
    const apts = get().appointments.filter((a) => a.clinic_id === cid && a.date === today);
    const pats = get().patients.filter((p) => p.clinic_id === cid);
    const invs = get().invoices.filter((i) => i.clinic_id === cid && i.date === today && i.status === 'paid');

    const totalRevenue = invs.reduce((acc, curr) => acc + curr.total, 0);
    const checkedIn = apts.filter((a) => a.status === 'checked_in').length;
    const inConsultation = apts.filter((a) => a.status === 'in_consultation').length;
    const completed = apts.filter((a) => a.status === 'completed').length;

    return {
      totalPatients: pats.length,
      todayAppointments: apts.length,
      checkedInCount: checkedIn,
      inConsultationCount: inConsultation,
      completedCount: completed,
      todayRevenue: totalRevenue,
      avgWaitTimeMinutes: checkedIn > 0 ? 12 : 8,
    };
  },

  // Optimistic UI Update with Automatic Rollback
  updateAppointmentStatus: async (appointmentId: string, newStatus: AppointmentStatus, simulateRollbackError = false) => {
    const prevApt = get().appointments.find((a) => a.id === appointmentId);
    if (!prevApt) return false;

    // 1. Optimistically mutate single-source-of-truth state store immediately
    const updatedAppointments = get().appointments.map((a) =>
      a.id === appointmentId ? { ...a, status: newStatus } : a
    );
    set({ appointments: updatedAppointments, _rollbackAppointment: prevApt });

    get().addAuditLog(
      'UPDATE_STATUS',
      'appointment',
      appointmentId,
      `Appointment status changed from ${prevApt.status} to ${newStatus}`
    );

    // 2. Simulate network sync or error rollback
    if (simulateRollbackError) {
      await new Promise((res) => setTimeout(res, 600));
      // Revert immediately to previous state
      set({
        appointments: get().appointments.map((a) => (a.id === appointmentId ? prevApt : a)),
        _rollbackAppointment: null,
      });
      get().showToast('Network error! Optimistic status update rolled back.', 'error');
      return false;
    }

    get().showToast(`Appointment status changed to ${newStatus.replace('_', ' ').toUpperCase()}`);
    return true;
  },

  addPatient: (data) => {
    const cid = get().currentClinicId;
    const clinic = get().getCurrentClinic();
    const count = get().patients.filter((p) => p.clinic_id === cid).length + 1;
    const prefix = clinic.name.substring(0, 4).toUpperCase();
    const mrn = `MRN-${prefix}-2026-${String(count).padStart(4, '0')}`;

    const newPatient: Patient = {
      ...data,
      id: `pat-${Date.now()}`,
      clinic_id: cid,
      mrn,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set({ patients: [newPatient, ...get().patients] });

    get().addAuditLog(
      'CREATE_PATIENT',
      'patient',
      newPatient.id,
      `Patient registered: ${newPatient.first_name} ${newPatient.last_name} (${newPatient.mrn})`
    );

    get().showToast(`Patient ${newPatient.first_name} ${newPatient.last_name} added`);
    return newPatient;
  },

  updatePatient: (id: string, data: Partial<Patient>) => {
    set({
      patients: get().patients.map((p) =>
        p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
      ),
    });
    get().addAuditLog('UPDATE_PATIENT', 'patient', id, 'Patient clinical profile updated');
    get().showToast('Patient details updated successfully');
  },

  addAppointment: (data) => {
    const cid = get().currentClinicId;
    const newApt: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      clinic_id: cid,
      created_at: new Date().toISOString(),
    };

    set({ appointments: [newApt, ...get().appointments] });

    get().addAuditLog(
      'CREATE_APPOINTMENT',
      'appointment',
      newApt.id,
      `Scheduled ${newApt.type} for ${newApt.patient_name} at ${newApt.start_time}`
    );

    get().showToast(`Appointment scheduled for ${newApt.patient_name}`);
    return newApt;
  },

  addMedicalRecord: (data) => {
    const cid = get().currentClinicId;
    const newRecord: MedicalRecord = {
      ...data,
      id: `rec-${Date.now()}`,
      clinic_id: cid,
      created_at: new Date().toISOString(),
    };

    set({ records: [newRecord, ...get().records] });

    get().addAuditLog(
      'CREATE_CLINICAL_RECORD',
      'record',
      newRecord.id,
      `Clinical consultation record filed: ${newRecord.diagnosis}`
    );

    get().showToast('Clinical medical record saved successfully');
    return newRecord;
  },

  addPrescription: (data) => {
    const cid = get().currentClinicId;
    const rxNumber = `RX-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const drugSummary = data.medications.map((m) => m.drug_name).join(',');
    const hash = generatePrescriptionHash(cid, data.patient_id, data.doctor_id, data.date, drugSummary);

    const newRx: Prescription = {
      ...data,
      id: `rx-${Date.now()}`,
      clinic_id: cid,
      prescription_number: rxNumber,
      security_hash: hash,
      created_at: new Date().toISOString(),
    };

    set({ prescriptions: [newRx, ...get().prescriptions] });

    get().addAuditLog(
      'CREATE_PRESCRIPTION',
      'prescription',
      newRx.id,
      `Issued e-Prescription ${newRx.prescription_number} with cryptographic seal`
    );

    get().showToast(`Prescription ${newRx.prescription_number} generated`);
    return newRx;
  },

  addInvoice: (data) => {
    const cid = get().currentClinicId;
    const invNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      clinic_id: cid,
      invoice_number: invNumber,
      created_at: new Date().toISOString(),
    };

    set({ invoices: [newInvoice, ...get().invoices] });

    get().addAuditLog(
      'CREATE_INVOICE',
      'invoice',
      newInvoice.id,
      `Issued Invoice #${newInvoice.invoice_number} for Rs. ${newInvoice.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    );

    get().showToast(`Invoice #${newInvoice.invoice_number} created`);
    return newInvoice;
  },

  updateInvoiceStatus: (id: string, status: Invoice['status']) => {
    set({
      invoices: get().invoices.map((inv) => (inv.id === id ? { ...inv, status } : inv)),
    });
    get().addAuditLog('UPDATE_INVOICE', 'invoice', id, `Invoice payment status updated to ${status}`);
    get().showToast(`Invoice status updated to ${status.toUpperCase()}`);
  },

  createStaffInvite: (email, role, title, name) => {
    const cid = get().currentClinicId;
    const clinic = get().getCurrentClinic();
    const token = generateSecureToken(24);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const invite: StaffInvite = {
      id: `inv-staff-${Date.now()}`,
      clinic_id: cid,
      clinic_name: clinic.name,
      email: sanitizeString(email),
      role,
      token,
      expires_at: expiresAt,
      created_by: get().currentUser.name,
      used: false,
    };

    // Also register user profile for instant testing in demo
    const newStaffUser: User = {
      id: `user-${Date.now()}`,
      clinic_id: cid,
      name: sanitizeString(name),
      email: sanitizeString(email),
      role,
      title: sanitizeString(title),
      license_number: role === 'doctor' ? `LIC-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
      phone: '+1 (555) 019-2811',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    set({
      staffInvites: [invite, ...get().staffInvites],
      users: [...get().users, newStaffUser],
    });

    get().addAuditLog(
      'INVITE_STAFF',
      'staff',
      invite.id,
      `Generated invite token for ${name} (${email}) as ${role.toUpperCase()}`
    );

    get().showToast(`Invite created for ${name} (${role})`);
    return invite;
  },

  updateClinicProfile: (data) => {
    const currentId = get().currentClinicId;
    set({
      clinics: get().clinics.map((c) => (c.id === currentId ? { ...c, ...data } : c)),
    });
    get().addAuditLog('UPDATE_CLINIC_PROFILE', 'auth', currentId, 'Updated clinic profile information');
    get().showToast('Clinic profile updated successfully');
  },

  addDoctor: (doctorData) => {
    const cid = get().currentClinicId;
    const newDoc: User = {
      id: `user-doc-${Date.now()}`,
      clinic_id: cid,
      name: sanitizeString(doctorData.name),
      email: sanitizeString(doctorData.email),
      role: doctorData.role || 'doctor',
      title: doctorData.title || (doctorData.specialty ? `${doctorData.specialty} Specialist` : 'Attending Physician'),
      specialty: sanitizeString(doctorData.specialty),
      license_number: sanitizeString(doctorData.license_number),
      phone: doctorData.phone ? sanitizeString(doctorData.phone) : '+1 (555) 012-3456',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    set({ users: [...get().users, newDoc] });
    get().addAuditLog('ADD_DOCTOR', 'staff', newDoc.id, `Doctor ${newDoc.name} added to clinic staff`);
    get().showToast(`${newDoc.name} added to clinic staff`);
    return newDoc;
  },

  updateDoctor: (doctorId, data) => {
    set({
      users: get().users.map((u) => (u.id === doctorId ? { ...u, ...data } : u)),
    });
    get().showToast('Doctor details updated');
  },

  removeDoctor: (doctorId) => {
    const doc = get().users.find((u) => u.id === doctorId);
    if (doc?.role === 'owner') {
      get().showToast('Cannot remove the Clinic Master account', 'error');
      return;
    }
    set({
      users: get().users.filter((u) => u.id !== doctorId),
    });
    get().showToast('Doctor removed from clinic roster');
  },

  registerClinic: (clinicData, ownerData, subscriptionData) => {
    const clinicId = `clinic-${Date.now()}`;
    const ownerId = `user-owner-${Date.now()}`;

    let isActivated = false;
    let subscription: ClinicSubscription | undefined = undefined;
    let activationInvoice: Invoice | undefined = undefined;

    if (subscriptionData) {
      isActivated = true;
      const subId = `sub-${Date.now()}`;
      const now = new Date();
      const expires = new Date(
        now.getTime() + (subscriptionData.billing_cycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      );
      const planDef = getPlanById(subscriptionData.plan_id);
      const txnRef = subscriptionData.transaction_reference || `TXN-PKR-${Math.floor(100000 + Math.random() * 900000)}`;

      subscription = {
        id: subId,
        plan_id: subscriptionData.plan_id,
        plan_name: subscriptionData.plan_name || planDef.name,
        amount_pkr: subscriptionData.amount_pkr,
        billing_cycle: subscriptionData.billing_cycle,
        status: 'active',
        activated_at: now.toISOString(),
        expires_at: expires.toISOString(),
        payment_method: subscriptionData.payment_method,
        transaction_reference: txnRef,
        features: planDef.features,
      };

      // Create initial subscription receipt / invoice in PKR
      activationInvoice = {
        id: `inv-${Date.now()}`,
        invoice_number: `INV-SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        clinic_id: clinicId,
        patient_id: ownerId,
        patient_name: `${clinicData.name} (License Activation)`,
        date: getTodayDate(),
        due_date: getTodayDate(),
        items: [
          {
            id: `item-sub-${Date.now()}`,
            code: 'SUB-LIC',
            description: `ClinicOS Subscription: ${subscription.plan_name} (${subscriptionData.billing_cycle.toUpperCase()})`,
            quantity: 1,
            unit_price: subscriptionData.amount_pkr,
            total: subscriptionData.amount_pkr,
          },
        ],
        subtotal: subscriptionData.amount_pkr,
        tax_rate: 0,
        tax_amount: 0,
        discount: 0,
        total: subscriptionData.amount_pkr,
        status: 'paid',
        payment_method: subscriptionData.payment_method === 'card' ? 'credit_card' : 'wire',
        created_at: now.toISOString(),
      };
    }

    const newClinic: Clinic = {
      ...clinicData,
      id: clinicId,
      status: isActivated ? 'active' : 'pending_activation',
      subscription,
      created_at: new Date().toISOString(),
    };

    const ownerUser: User = {
      id: ownerId,
      clinic_id: clinicId,
      name: sanitizeString(ownerData.name),
      email: sanitizeString(ownerData.email),
      role: 'owner',
      title: 'Founder & Chief Medical Officer',
      license_number: sanitizeString(ownerData.license_number),
      status: 'active',
      created_at: new Date().toISOString(),
    };

    set({
      clinics: [...get().clinics, newClinic],
      users: [...get().users, ownerUser],
      invoices: activationInvoice ? [activationInvoice, ...get().invoices] : get().invoices,
      currentClinicId: clinicId,
      currentUser: ownerUser,
    });

    if (isActivated && subscription) {
      get().addAuditLog(
        'ACTIVATE_CLINIC_SUBSCRIPTION',
        'auth',
        clinicId,
        `Subscription purchased: ${subscription.plan_name} for Rs. ${subscription.amount_pkr.toLocaleString()} via ${subscription.payment_method.toUpperCase()}. Clinic workspace ACTIVATED.`
      );
      get().showToast(`Clinic account activated! ${subscription.plan_name} is active.`);
    } else {
      get().addAuditLog(
        'REGISTER_CLINIC_PENDING',
        'auth',
        clinicId,
        `Clinic account registered in pending status for ${newClinic.name}. Subscription purchase required to activate.`
      );
      get().showToast(`Clinic profile created. Please buy subscription to activate.`, 'info');
    }

    return { clinic: newClinic, owner: ownerUser };
  },

  activateClinicSubscription: (clinicId, subscriptionData) => {
    const targetClinic = get().clinics.find((c) => c.id === clinicId);
    if (!targetClinic) return;

    const subId = `sub-${Date.now()}`;
    const now = new Date();
    const expires = new Date(
      now.getTime() + (subscriptionData.billing_cycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
    );
    const planDef = getPlanById(subscriptionData.plan_id);
    const txnRef = subscriptionData.transaction_reference || `TXN-PKR-${Math.floor(100000 + Math.random() * 900000)}`;

    const subscription: ClinicSubscription = {
      id: subId,
      plan_id: subscriptionData.plan_id,
      plan_name: subscriptionData.plan_name || planDef.name,
      amount_pkr: subscriptionData.amount_pkr,
      billing_cycle: subscriptionData.billing_cycle,
      status: 'active',
      activated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      payment_method: subscriptionData.payment_method,
      transaction_reference: txnRef,
      features: planDef.features,
    };

    const subInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoice_number: `INV-SUB-${Math.floor(1000 + Math.random() * 9000)}`,
      clinic_id: clinicId,
      patient_id: get().currentUser.id,
      patient_name: `${targetClinic.name} (License Activation)`,
      date: getTodayDate(),
      due_date: getTodayDate(),
      items: [
        {
          id: `item-sub-${Date.now()}`,
          code: 'SUB-LIC',
          description: `ClinicOS Subscription: ${subscription.plan_name} (${subscriptionData.billing_cycle.toUpperCase()})`,
          quantity: 1,
          unit_price: subscriptionData.amount_pkr,
          total: subscriptionData.amount_pkr,
        },
      ],
      subtotal: subscriptionData.amount_pkr,
      tax_rate: 0,
      tax_amount: 0,
      discount: 0,
      total: subscriptionData.amount_pkr,
      status: 'paid',
      payment_method: subscriptionData.payment_method === 'card' ? 'credit_card' : 'wire',
      created_at: now.toISOString(),
    };

    set({
      clinics: get().clinics.map((c) =>
        c.id === clinicId ? { ...c, status: 'active', subscription } : c
      ),
      invoices: [subInvoice, ...get().invoices],
    });

    get().addAuditLog(
      'ACTIVATE_CLINIC_SUBSCRIPTION',
      'auth',
      clinicId,
      `Subscription purchased: ${subscription.plan_name} for Rs. ${subscription.amount_pkr.toLocaleString()} via ${subscription.payment_method.toUpperCase()}. Clinic workspace ACTIVATED.`
    );

    get().showToast(`Clinic account activated! ${subscription.plan_name} is active.`);
  },

  addAuditLog: (action, entity_type, entity_id, details) => {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clinic_id: get().currentClinicId,
      user_id: get().currentUser?.id || 'system',
      user_name: get().currentUser?.name || 'System Guard',
      user_role: get().currentUser?.role || 'owner',
      action,
      entity_type,
      entity_id,
      timestamp: new Date().toISOString(),
      details,
    };
    set({ auditLogs: [log, ...get().auditLogs] });
  },
}));

// Memoized Clean React Hooks
export const useClinic = (): Clinic => {
  const clinics = useStore((state) => state.clinics);
  const currentClinicId = useStore((state) => state.currentClinicId);
  return useMemo(() => {
    return clinics.find((c) => c.id === currentClinicId) || clinics[0];
  }, [clinics, currentClinicId]);
};

export const useClinicPatients = (): Patient[] => {
  const patients = useStore((state) => state.patients);
  const currentClinicId = useStore((state) => state.currentClinicId);
  return useMemo(() => {
    return patients.filter((p) => p.clinic_id === currentClinicId);
  }, [patients, currentClinicId]);
};

export const useClinicAppointments = (): Appointment[] => {
  const appointments = useStore((state) => state.appointments);
  const currentClinicId = useStore((state) => state.currentClinicId);
  return useMemo(() => {
    return appointments.filter((a) => a.clinic_id === currentClinicId);
  }, [appointments, currentClinicId]);
};

export const useClinicStaff = (): User[] => {
  const users = useStore((state) => state.users);
  const currentClinicId = useStore((state) => state.currentClinicId);
  return useMemo(() => {
    return users.filter((u) => u.clinic_id === currentClinicId);
  }, [users, currentClinicId]);
};

export const useClinicDoctors = (): User[] => {
  const users = useStore((state) => state.users);
  const currentClinicId = useStore((state) => state.currentClinicId);
  return useMemo(() => {
    return users.filter(
      (u) => u.clinic_id === currentClinicId && (u.role === 'doctor' || u.role === 'owner')
    );
  }, [users, currentClinicId]);
};

export const useClinicRecords = (patientId?: string): MedicalRecord[] => {
  const records = useStore((state) => state.records);
  const currentClinicId = useStore((state) => state.currentClinicId);
  return useMemo(() => {
    return records.filter(
      (r) => r.clinic_id === currentClinicId && (!patientId || r.patient_id === patientId)
    );
  }, [records, currentClinicId, patientId]);
};

export const useClinicPrescriptions = (patientId?: string): Prescription[] => {
  const prescriptions = useStore((state) => state.prescriptions);
  const currentClinicId = useStore((state) => state.currentClinicId);
  return useMemo(() => {
    return prescriptions.filter(
      (p) => p.clinic_id === currentClinicId && (!patientId || p.patient_id === patientId)
    );
  }, [prescriptions, currentClinicId, patientId]);
};

export const useClinicInvoices = (patientId?: string): Invoice[] => {
  const invoices = useStore((state) => state.invoices);
  const currentClinicId = useStore((state) => state.currentClinicId);
  return useMemo(() => {
    return invoices.filter(
      (i) => i.clinic_id === currentClinicId && (!patientId || i.patient_id === patientId)
    );
  }, [invoices, currentClinicId, patientId]);
};

export const useClinicAuditLogs = (): AuditLog[] => {
  const auditLogs = useStore((state) => state.auditLogs);
  const currentClinicId = useStore((state) => state.currentClinicId);
  return useMemo(() => {
    return auditLogs.filter((l) => l.clinic_id === currentClinicId);
  }, [auditLogs, currentClinicId]);
};

export const useClinicMetrics = (): ClinicMetrics => {
  const appointments = useStore((state) => state.appointments);
  const patients = useStore((state) => state.patients);
  const invoices = useStore((state) => state.invoices);
  const currentClinicId = useStore((state) => state.currentClinicId);

  return useMemo(() => {
    const today = getTodayDate();
    const apts = appointments.filter((a) => a.clinic_id === currentClinicId && a.date === today);
    const pats = patients.filter((p) => p.clinic_id === currentClinicId);
    const invs = invoices.filter((i) => i.clinic_id === currentClinicId && i.date === today && i.status === 'paid');

    const totalRevenue = invs.reduce((acc, curr) => acc + curr.total, 0);
    const checkedIn = apts.filter((a) => a.status === 'checked_in').length;
    const inConsultation = apts.filter((a) => a.status === 'in_consultation').length;
    const completed = apts.filter((a) => a.status === 'completed').length;

    return {
      totalPatients: pats.length,
      todayAppointments: apts.length,
      checkedInCount: checkedIn,
      inConsultationCount: inConsultation,
      completedCount: completed,
      todayRevenue: totalRevenue,
      avgWaitTimeMinutes: checkedIn > 0 ? 12 : 8,
    };
  }, [appointments, patients, invoices, currentClinicId]);
};

