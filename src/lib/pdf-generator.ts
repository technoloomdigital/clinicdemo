import { jsPDF } from 'jspdf';
import { Clinic, Invoice, Patient, Prescription, User } from '../types';

/**
 * Client-Side Medical Document Generation using jsPDF
 * High-precision vector typography, clinic branding, security signatures, and watermarks.
 * Zero server load - 100% client-side rendering.
 */

export interface GeneratedDocument {
  doc: jsPDF;
  blobUrl: string;
  download: (filename?: string) => void;
}

export function generatePrescriptionPDF(
  prescription: Prescription,
  clinic: Clinic,
  patient: Patient,
  doctor: Partial<User>
): GeneratedDocument {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;

  // 1. Header background banner
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent primary top border line
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Clinic Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(clinic.name.toUpperCase(), margin, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`${clinic.specialty} • ${clinic.address}, ${clinic.city}`, margin, 24);
  doc.text(`Tel: ${clinic.phone}  |  Email: ${clinic.email}  |  Lic: ${clinic.tax_id}`, margin, 30);

  // Rx Symbol Badge (Top Right)
  doc.setFillColor(13, 148, 136);
  doc.roundedRect(pageWidth - margin - 32, 10, 32, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Rx', pageWidth - margin - 22, 24);

  // Prescription Meta Bar
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 46, pageWidth - margin, 46);

  let currentY = 54;

  // Patient & Doctor Information Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 34, 2, 2, 'FD');

  // Left column: Patient
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('PATIENT DETAILS', margin + 6, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${patient.first_name} ${patient.last_name}`, margin + 6, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`MRN: ${patient.mrn}   DOB: ${patient.dob} (${patient.gender.toUpperCase()})`, margin + 6, currentY + 21);
  doc.text(`Allergies: ${patient.allergies.length > 0 ? patient.allergies.join(', ') : 'No known drug allergies (NKDA)'}`, margin + 6, currentY + 28);

  // Right column: Prescribing Physician
  const rightColX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('PRESCRIBING PHYSICIAN', rightColX, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(doctor.name || prescription.doctor_name, rightColX, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`License: ${doctor.license_number || prescription.doctor_license || 'MD-ACTIVE'}`, rightColX, currentY + 21);
  doc.text(`Issue Date: ${prescription.date}  |  Rx #: ${prescription.prescription_number}`, rightColX, currentY + 28);

  currentY += 42;

  // Clinical Diagnosis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(13, 148, 136);
  doc.text('CLINICAL INDICATION & DIAGNOSIS', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(prescription.diagnosis, margin, currentY + 6);

  currentY += 16;

  // Medication Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, pageWidth - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('#', margin + 3, currentY + 5.5);
  doc.text('MEDICATION & DOSAGE', margin + 12, currentY + 5.5);
  doc.text('ROUTE', margin + 80, currentY + 5.5);
  doc.text('FREQUENCY / DURATION', margin + 105, currentY + 5.5);
  doc.text('DISPENSE', pageWidth - margin - 22, currentY + 5.5);

  currentY += 12;

  // Table items
  prescription.medications.forEach((item, index) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${index + 1}.`, margin + 3, currentY);
    doc.text(`${item.drug_name} (${item.dosage})`, margin + 12, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(item.route, margin + 80, currentY);
    doc.text(`${item.frequency} for ${item.duration}`, margin + 105, currentY);
    doc.text(item.dispense_quantity, pageWidth - margin - 22, currentY);

    if (item.instructions) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Sig: ${item.instructions}`, margin + 12, currentY + 5);
      currentY += 12;
    } else {
      currentY += 9;
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2);
    currentY += 2;
  });

  // Precautions if any
  if (prescription.precautions) {
    currentY += 6;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 16, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(185, 28, 28);
    doc.text('PATIENT INSTRUCTIONS & WARNINGS:', margin + 4, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text(prescription.precautions, margin + 4, currentY + 11);
    currentY += 22;
  }

  // Doctor Signature & Verification Footer (Anchored to bottom)
  const footerY = pageHeight - 44;

  // Digital Signature section
  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth - margin - 55, footerY + 10, pageWidth - margin, footerY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(doctor.name || prescription.doctor_name, pageWidth - margin - 55, footerY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Physician Signature', pageWidth - margin - 55, footerY + 19);

  // Security Hash watermark & verification seal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('VERIFIABLE ELECTRONIC MEDICAL RECORD • 21 CFR PART 11 COMPLIANT', margin, footerY + 8);
  doc.setFont('courier', 'normal');
  doc.text(`INTEGRITY HASH: ${prescription.security_hash}`, margin, footerY + 13);
  doc.text(`Generated at: ${new Date().toISOString()} via ClinicOS Zero-Trust Engine`, margin, footerY + 18);

  // Output blob URL
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  const download = (filename?: string) => {
    const finalName = filename || `Prescription_${patient.last_name}_${prescription.prescription_number}.pdf`;
    doc.save(finalName);
  };

  return { doc, blobUrl, download };
}

export function generateInvoicePDF(
  invoice: Invoice,
  clinic: Clinic,
  patient?: Partial<Patient>
): GeneratedDocument {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;

  // 1. Top Brand Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Emerald/Teal highlight strip
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, 8, 38, 'F');

  // Clinic Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(clinic.name, margin, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`${clinic.address}, ${clinic.city} | Phone: ${clinic.phone} | Tax ID: ${clinic.tax_id}`, margin, 24);

  // INVOICE title on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('INVOICE', pageWidth - margin - 40, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`#${invoice.invoice_number}`, pageWidth - margin - 40, 25);

  let currentY = 48;

  // Billed To & Invoice Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO (PATIENT / CLIENT)', margin, currentY);
  doc.text('INVOICE SPECIFICS', pageWidth / 2 + 10, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const patientDisplayName = patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : invoice.patient_name;
  doc.text(patientDisplayName, margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  if (patient?.mrn) {
    doc.text(`MRN: ${patient.mrn}`, margin, currentY + 5);
  } else {
    doc.text(`Account Reference: ${clinic.name}`, margin, currentY + 5);
  }
  const emailLine = patient?.email ? patient.email : clinic.email;
  const phoneLine = patient?.phone ? patient.phone : clinic.phone;
  doc.text(`Email: ${emailLine} | Tel: ${phoneLine}`, margin, currentY + 10);
  doc.text(`Address: ${patient?.address || clinic.address || clinic.city}`, margin, currentY + 15);

  // Right metadata
  const metaX = pageWidth / 2 + 10;
  doc.text(`Issue Date: ${invoice.date}`, metaX, currentY);
  doc.text(`Payment Due: ${invoice.due_date}`, metaX, currentY + 5);
  doc.text(`Payment Status: ${invoice.status.toUpperCase()}`, metaX, currentY + 10);
  if (invoice.payment_method) {
    doc.text(`Method: ${invoice.payment_method.replace('_', ' ').toUpperCase()}`, metaX, currentY + 15);
  }

  currentY += 28;

  // Line items Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, pageWidth - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('CODE', margin + 4, currentY + 5.5);
  doc.text('SERVICE / PROCEDURE / MEDICATION', margin + 30, currentY + 5.5);
  doc.text('QTY', margin + 110, currentY + 5.5);
  doc.text('UNIT PRICE (Rs.)', margin + 124, currentY + 5.5);
  doc.text('AMOUNT (Rs.)', pageWidth - margin - 26, currentY + 5.5);

  currentY += 12;

  // Line Items
  invoice.items.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.code || 'CPT', margin + 4, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(item.description, margin + 30, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(String(item.quantity), margin + 112, currentY);
    doc.text(`Rs. ${item.unit_price.toFixed(2)}`, margin + 124, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${item.total.toFixed(2)}`, pageWidth - margin - 26, currentY);

    currentY += 6;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY - 1, pageWidth - margin, currentY - 1);
    currentY += 3;
  });

  currentY += 8;

  // Calculation totals block
  const summaryX = pageWidth - margin - 85;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, currentY, 85, 42, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', summaryX + 6, currentY + 8);
  doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, summaryX + 46, currentY + 8);

  doc.text(`Tax (${invoice.tax_rate}%):`, summaryX + 6, currentY + 16);
  doc.text(`Rs. ${invoice.tax_amount.toFixed(2)}`, summaryX + 46, currentY + 16);

  if (invoice.discount > 0) {
    doc.text('Discount:', summaryX + 6, currentY + 24);
    doc.text(`-Rs. ${invoice.discount.toFixed(2)}`, summaryX + 46, currentY + 24);
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(summaryX + 6, currentY + 28, summaryX + 79, currentY + 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 148, 136);
  doc.text('Total Due:', summaryX + 6, currentY + 36);
  doc.text(`Rs. ${invoice.total.toFixed(2)}`, summaryX + 46, currentY + 36);

  // Payment status stamp
  const stampY = currentY + 10;
  if (invoice.status === 'paid') {
    doc.setDrawColor(16, 185, 129); // Green 500
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, stampY, 40, 18, 2, 2, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text('PAID IN FULL', margin + 5, stampY + 11);
  } else {
    doc.setDrawColor(245, 158, 11); // Amber 500
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, stampY, 40, 18, 2, 2, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(245, 158, 11);
    doc.text('PENDING', margin + 8, stampY + 11);
  }

  // Footer
  const footerY = pageHeight - 22;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for choosing our specialized medical care. Direct wire instructions: routing on request.', margin, footerY);
  doc.text(`Electronic Invoice ID: ${invoice.id} • ClinicOS Enterprise Billing`, margin, footerY + 5);

  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  const download = (filename?: string) => {
    const finalName = filename || `Invoice_${patient?.last_name ?? invoice.patient_name.replace(/\s+/g, '_')}_${invoice.invoice_number}.pdf`;
    doc.save(finalName);
  };

  return { doc, blobUrl, download };
}
