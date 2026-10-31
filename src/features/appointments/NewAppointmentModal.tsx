import React, { useState } from 'react';
import { CalendarPlus, Clock, Stethoscope, User, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AppointmentBookingSchema } from '../../lib/validation';
import {
  useStore,
  useClinic,
  useClinicPatients,
  useClinicStaff,
  useClinicAppointments,
} from '../../hooks/useStore';
import { AppointmentType } from '../../types';

export interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatientId?: string;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  preselectedPatientId,
}) => {
  const currentClinic = useClinic();
  const patients = useClinicPatients();
  const staff = useClinicStaff();
  const appointments = useClinicAppointments();
  const addAppointment = useStore((state) => state.addAppointment);

  const doctors = staff.filter((u) => u.role === 'doctor' || u.role === 'owner');

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    patient_id: preselectedPatientId || (patients[0]?.id ?? ''),
    doctor_id: doctors[0]?.id ?? '',
    date: today,
    start_time: '10:00',
    end_time: '10:45',
    type: 'consultation' as AppointmentType,
    room: 'Consultation Suite 1',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Check potential conflicts
    if (name === 'doctor_id' || name === 'date' || name === 'start_time') {
      const docId = name === 'doctor_id' ? value : formData.doctor_id;
      const dDate = name === 'date' ? value : formData.date;
      const sTime = name === 'start_time' ? value : formData.start_time;

      const conflict = appointments.find(
        (a) => a.doctor_id === docId && a.date === dDate && a.start_time === sTime && a.status !== 'cancelled'
      );
      if (conflict) {
        setConflictWarning(`Notice: Physician already has appointment with ${conflict.patient_name} at ${sTime}`);
      } else {
        setConflictWarning(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = AppointmentBookingSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const patient = patients.find((p) => p.id === formData.patient_id);
    const doctor = doctors.find((d) => d.id === formData.doctor_id);

    if (!patient || !doctor) return;

    addAppointment({
      patient_id: patient.id,
      patient_name: `${patient.first_name} ${patient.last_name}`,
      patient_phone: patient.phone,
      doctor_id: doctor.id,
      doctor_name: doctor.name,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      type: formData.type,
      status: 'scheduled',
      room: formData.room,
      notes: formData.notes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Clinical Consultation / Procedure"
      subtitle={`Schedule appointment within ${currentClinic.name}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {conflictWarning && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{conflictWarning}</span>
          </div>
        )}

        {/* Patient Selection */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
            Select Patient <span className="text-rose-500">*</span>
          </label>
          <select
            name="patient_id"
            value={formData.patient_id}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.mrn})
              </option>
            ))}
          </select>
          {errors.patient_id && <p className="text-xs text-rose-500">{errors.patient_id}</p>}
        </div>

        {/* Doctor Selection */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
            Attending Physician <span className="text-rose-500">*</span>
          </label>
          <select
            name="doctor_id"
            value={formData.doctor_id}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.title})
              </option>
            ))}
          </select>
          {errors.doctor_id && <p className="text-xs text-rose-500">{errors.doctor_id}</p>}
        </div>

        {/* Date and Time Slot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            error={errors.date}
            required
          />
          <Input
            label="Start Time"
            name="start_time"
            type="time"
            value={formData.start_time}
            onChange={handleChange}
            error={errors.start_time}
            required
          />
          <Input
            label="End Time"
            name="end_time"
            type="time"
            value={formData.end_time}
            onChange={handleChange}
            error={errors.end_time}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Appointment Category
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              <option value="consultation">Initial Consultation</option>
              <option value="follow_up">Follow-Up Review</option>
              <option value="procedure">Clinical Procedure / Infusion</option>
              <option value="emergency">Urgent / Emergency Care</option>
              <option value="telehealth">Telehealth Video</option>
            </select>
          </div>

          <Input
            label="Exam Room / Suite"
            name="room"
            placeholder="e.g. Suite 204 or Lab B"
            value={formData.room}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-1">
            Clinical Notes & Visit Purpose
          </label>
          <textarea
            rows={2}
            name="notes"
            placeholder="e.g. 6-month longevity labs review, blood glucose profiling..."
            value={formData.notes}
            onChange={handleChange}
            className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" icon={<CalendarPlus className="w-4 h-4" />}>
            Confirm Booking
          </Button>
        </div>
      </form>
    </Modal>
  );
};
