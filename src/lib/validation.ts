import { z } from 'zod';

/**
 * Zero-Trust Input Validation Schemas with Zod
 * All schemas strictly strip unexpected fields (.strip()) to prevent parameter tampering
 * and prototype injection.
 */

// 1. Auth Schemas
export const LoginSchema = z
  .object({
    email: z.string().trim().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    clinic_id: z.string().min(1, 'Target clinic is required'),
  })
  .strip();

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterClinicSchema = z
  .object({
    clinic_name: z.string().trim().min(3, 'Clinic name must be at least 3 characters').max(100),
    specialty: z.string().trim().min(2, 'Specialty is required'),
    address: z.string().trim().min(5, 'Physical address is required'),
    city: z.string().trim().min(2, 'City is required'),
    phone: z.string().trim().min(7, 'Valid contact number is required'),
    email: z.string().trim().email('Valid institutional email is required'),
    tax_id: z.string().trim().min(3, 'Tax ID / Registration number required'),
    currency: z.string().default('PKR'),
    // Lead doctor / Owner details
    owner_name: z.string().trim().min(3, 'Lead doctor full name required'),
    owner_email: z.string().trim().email('Lead doctor personal email required'),
    owner_license: z.string().trim().min(3, 'Medical Board License number required'),
    owner_password: z.string().min(8, 'Password must be at least 8 characters with numbers'),
  })
  .strip();

export type RegisterClinicInput = z.infer<typeof RegisterClinicSchema>;

// 2. Patient Schemas
export const PatientIntakeSchema = z
  .object({
    first_name: z.string().trim().min(1, 'First name is required').max(50),
    last_name: z.string().trim().min(1, 'Last name is required').max(50),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
    gender: z.enum(['male', 'female', 'other']),
    phone: z.string().trim().min(7, 'Phone number is required'),
    email: z.string().trim().email('Invalid email address'),
    address: z.string().trim().min(3, 'Address is required'),
    blood_group: z.string().default('O+'),
    allergies: z.array(z.string().trim()).default([]),
    chronic_conditions: z.array(z.string().trim()).default([]),
    emergency_name: z.string().trim().min(2, 'Emergency contact name required'),
    emergency_relationship: z.string().trim().min(2, 'Relationship required'),
    emergency_phone: z.string().trim().min(7, 'Emergency contact phone required'),
    insurance_provider: z.string().trim().optional(),
    insurance_policy_number: z.string().trim().optional(),
  })
  .strip();

export type PatientIntakeInput = z.infer<typeof PatientIntakeSchema>;

// 3. Appointment Schemas
export const AppointmentBookingSchema = z
  .object({
    patient_id: z.string().min(1, 'Patient selection is required'),
    doctor_id: z.string().min(1, 'Assigned physician is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Appointment date must be YYYY-MM-DD'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM'),
    type: z.enum(['consultation', 'follow_up', 'procedure', 'emergency', 'telehealth']),
    room: z.string().trim().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strip();

export type AppointmentBookingInput = z.infer<typeof AppointmentBookingSchema>;

// 4. Clinical Record Schemas
export const MedicalRecordSchema = z
  .object({
    patient_id: z.string().min(1, 'Patient ID required'),
    visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    chief_complaint: z.string().trim().min(3, 'Chief complaint is required'),
    diagnosis: z.string().trim().min(3, 'Clinical diagnosis is required'),
    clinical_notes: z.string().trim().min(5, 'Clinical notes are required'),
    bp_systolic: z.coerce.number().min(60).max(250).optional(),
    bp_diastolic: z.coerce.number().min(30).max(150).optional(),
    heart_rate: z.coerce.number().min(30).max(220).optional(),
    temperature: z.coerce.number().min(30).max(45).optional(),
    spo2: z.coerce.number().min(50).max(100).optional(),
    weight_kg: z.coerce.number().min(1).max(350).optional(),
    height_cm: z.coerce.number().min(30).max(250).optional(),
  })
  .strip();

export type MedicalRecordInput = z.infer<typeof MedicalRecordSchema>;

// 5. Prescription Item & Prescription Schema
export const PrescriptionItemSchema = z
  .object({
    drug_name: z.string().trim().min(2, 'Medication name required'),
    dosage: z.string().trim().min(1, 'Dosage is required (e.g. 500mg)'),
    route: z.string().trim().min(1, 'Route is required (e.g. Oral)'),
    frequency: z.string().trim().min(1, 'Frequency is required'),
    duration: z.string().trim().min(1, 'Duration is required'),
    dispense_quantity: z.string().trim().min(1, 'Quantity is required'),
    instructions: z.string().trim().min(1, 'Specific instructions required'),
  })
  .strip();

export const PrescriptionSchema = z
  .object({
    patient_id: z.string().min(1, 'Patient ID required'),
    diagnosis: z.string().trim().min(2, 'Diagnosis required'),
    medications: z.array(PrescriptionItemSchema).min(1, 'At least one medication is required'),
    precautions: z.string().trim().optional(),
  })
  .strip();

export type PrescriptionInput = z.infer<typeof PrescriptionSchema>;

// 6. Invoice Schemas
export const InvoiceItemSchema = z
  .object({
    code: z.string().trim().default('CPT-99213'),
    description: z.string().trim().min(2, 'Item description required'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    unit_price: z.coerce.number().min(0, 'Price must be non-negative'),
  })
  .strip();

export const InvoiceSchema = z
  .object({
    patient_id: z.string().min(1, 'Patient is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invoice date must be YYYY-MM-DD'),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
    items: z.array(InvoiceItemSchema).min(1, 'At least one invoice line item is required'),
    tax_rate: z.coerce.number().min(0).max(50).default(0),
    discount: z.coerce.number().min(0).default(0),
    status: z.enum(['paid', 'pending', 'overdue']),
    payment_method: z.enum(['credit_card', 'cash', 'wire', 'health_insurance']).optional(),
    insurance_claim_id: z.string().trim().optional(),
  })
  .strip();

export type InvoiceInput = z.infer<typeof InvoiceSchema>;

// 7. Invite Staff Schema
export const InviteStaffSchema = z
  .object({
    email: z.string().trim().email('Valid team member email required'),
    role: z.enum(['doctor', 'receptionist', 'owner']),
    title: z.string().trim().min(2, 'Title or specialization required (e.g. Cardiologist, Front Desk Supervisor)'),
    name: z.string().trim().min(2, 'Full name required'),
  })
  .strip();

export type InviteStaffInput = z.infer<typeof InviteStaffSchema>;
