import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Download,
  Eye,
  CreditCard,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { InvoiceItem, Patient } from '../../types';
import { useStore, useClinic, useClinicPatients } from '../../hooks/useStore';
import { InvoiceSchema } from '../../lib/validation';
import { generateInvoicePDF } from '../../lib/pdf-generator';

export interface InvoiceBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatient?: Patient | null;
  onPreviewPDF: (title: string, blobUrl: string, downloadFn: () => void) => void;
}

export const InvoiceBuilderModal: React.FC<InvoiceBuilderModalProps> = ({
  isOpen,
  onClose,
  preselectedPatient,
  onPreviewPDF,
}) => {
  const currentClinic = useClinic();
  const patients = useClinicPatients();
  const addInvoice = useStore((state) => state.addInvoice);

  const today = new Date().toISOString().split('T')[0];
  const dueDateDefault = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [patientId, setPatientId] = useState(
    preselectedPatient?.id || patients[0]?.id || ''
  );
  const [date, setDate] = useState(today);
  const [dueDate, setDueDate] = useState(dueDateDefault);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'cash' | 'wire' | 'health_insurance'>('credit_card');

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      code: 'CPT-99214',
      description: 'Comprehensive Medical Consultation & Assessment',
      quantity: 1,
      unit_price: 2500.0,
      total: 2500.0,
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedPatient = patients.find((p) => p.id === patientId);

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      code: 'CPT-80053',
      description: 'Clinical Laboratory Panel',
      quantity: 1,
      unit_price: 1500.0,
      total: 1500.0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const next = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          next.total = Number(next.quantity) * Number(next.unit_price);
        }
        return next;
      }
      return item;
    });
    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + curr.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = Math.max(0, subtotal + taxAmount - discount);

  const handleSubmit = (e: React.FormEvent, previewMode = false) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const payload = {
      patient_id: patientId,
      date,
      due_date: dueDate,
      items: items.map((i) => ({
        code: i.code,
        description: i.description,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
      })),
      tax_rate: Number(taxRate),
      discount: Number(discount),
      status,
      payment_method: paymentMethod,
    };

    const result = InvoiceSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const newInvoice = addInvoice({
      patient_id: selectedPatient.id,
      patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
      date,
      due_date: dueDate,
      items,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount,
      total,
      status,
      payment_method: paymentMethod,
    });

    const gen = generateInvoicePDF(newInvoice, currentClinic, selectedPatient);

    if (previewMode) {
      onClose();
      onPreviewPDF(`Invoice - ${newInvoice.invoice_number}`, gen.blobUrl, gen.download);
    } else {
      gen.download();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clinical Invoice & Receipt Builder"
      subtitle={`Generate client-rendered medical billing statement for ${currentClinic.name}`}
      maxWidth="4xl"
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Patient Selection & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Billed Patient <span className="text-rose-500">*</span>
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.mrn})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Invoice Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Payment Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Receipt className="w-4 h-4" />
              Itemized Medical Services & Procedures
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Line Item
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
              >
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Billing Code
                  </label>
                  <input
                    type="text"
                    value={item.code}
                    onChange={(e) => handleItemChange(item.id, 'code', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Service Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Unit Price (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(item.id, 'unit_price', Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals, Status, and Payment Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-200 dark:border-white/10">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Payment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="paid">Paid (Receipt)</option>
                  <option value="pending">Pending Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="credit_card">Credit Card (Stripe / POS)</option>
                  <option value="health_insurance">Health Insurance Claim</option>
                  <option value="wire">Bank Wire Transfer</option>
                  <option value="cash">Direct Cash</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Discount (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Calculated Totals Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Tax ({taxRate}%):</span>
              <span className="font-mono font-medium">Rs. {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount Applied:</span>
                <span className="font-mono font-medium">-Rs. {discount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-slate-100">
              <span>Total Invoice Amount:</span>
              <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
                Rs. {total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            icon={<Eye className="w-4 h-4 text-amber-600" />}
          >
            Preview Invoice
          </Button>
          <Button variant="primary" type="submit" icon={<Download className="w-4 h-4" />}>
            Generate & Download Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
};
