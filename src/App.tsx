import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Receipt,
  Building2,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from './hooks/useStore';
import { Patient, TabType } from './types';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/ui/Toast';

import { MasterDashboard } from './features/dashboard/MasterDashboard';
import { PatientDirectory } from './features/patients/PatientDirectory';
import { AppointmentsCalendar } from './features/appointments/AppointmentsCalendar';
import { PrescriptionsDirectory } from './features/prescriptions/PrescriptionsDirectory';
import { BillingDashboard } from './features/billing/BillingDashboard';
import { TeamDirectory } from './features/team/TeamDirectory';

import { PatientIntakeModal } from './features/patients/PatientIntakeModal';
import { PatientDetailsModal } from './features/patients/PatientDetailsModal';
import { NewAppointmentModal } from './features/appointments/NewAppointmentModal';
import { PrescriptionBuilderModal } from './features/prescriptions/PrescriptionBuilderModal';
import { InvoiceBuilderModal } from './features/prescriptions/InvoiceBuilderModal';
import { RegisterClinicModal } from './features/auth/RegisterClinicModal';
import { PDFPreviewModal } from './features/prescriptions/PDFPreviewModal';

export default function App() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const isDarkMode = useStore((state) => state.isDarkMode);

  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal display states
  const [isPatientIntakeOpen, setIsPatientIntakeOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isPrescriptionBuilderOpen, setIsPrescriptionBuilderOpen] = useState(false);
  const [isInvoiceBuilderOpen, setIsInvoiceBuilderOpen] = useState(false);
  const [isRegisterClinicOpen, setIsRegisterClinicOpen] = useState(false);

  // Contextual patient selection for deep modal workflows
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<Patient | null>(null);
  const [targetPatientForAction, setTargetPatientForAction] = useState<Patient | null>(null);

  // PDF in-app preview modal state
  const [pdfPreviewState, setPdfPreviewState] = useState<{
    isOpen: boolean;
    title: string;
    blobUrl: string | null;
    downloadFn: () => void;
  }>({
    isOpen: false,
    title: '',
    blobUrl: null,
    downloadFn: () => {},
  });

  const handleOpenPrescriptionForPatient = (patient: Patient) => {
    setTargetPatientForAction(patient);
    setIsPrescriptionBuilderOpen(true);
  };

  const handleOpenInvoiceForPatient = (patient: Patient) => {
    setTargetPatientForAction(patient);
    setIsInvoiceBuilderOpen(true);
  };

  const handlePreviewPDF = (title: string, blobUrl: string, downloadFn: () => void) => {
    setPdfPreviewState({
      isOpen: true,
      title,
      blobUrl,
      downloadFn,
    });
  };

  return (
    <div className={`min-h-screen flex bg-slate-100/80 dark:bg-[#070A12] text-slate-800 dark:text-slate-200 transition-colors duration-150 font-sans ${isDarkMode ? 'dark' : ''}`}>
      {/* Permanent Desktop Sidebar + Mobile Slide Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTabChange={setActiveTab}
        onOpenNewClinic={() => setIsRegisterClinicOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-screen">
        {/* Top Header with Clinic Identity, Fast Actions, and Instagram-style Profile Menu */}
        <TopNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenRegisterClinic={() => setIsRegisterClinicOpen(true)}
          onOpenNewPatient={() => {
            setTargetPatientForAction(null);
            setIsPatientIntakeOpen(true);
          }}
          onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
        />

        {/* Scrollable Viewport with Section Switching Animation */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'dashboard' && (
                <MasterDashboard
                  onNavigateTab={setActiveTab}
                  onOpenNewPatient={() => {
                    setTargetPatientForAction(null);
                    setIsPatientIntakeOpen(true);
                  }}
                  onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
                  onOpenWritePrescription={() => {
                    setTargetPatientForAction(null);
                    setIsPrescriptionBuilderOpen(true);
                  }}
                  onOpenCreateInvoice={() => {
                    setTargetPatientForAction(null);
                    setIsInvoiceBuilderOpen(true);
                  }}
                />
              )}

              {activeTab === 'patients' && (
                <PatientDirectory
                  onSelectPatient={(p) => setSelectedPatientForDetails(p)}
                  onOpenIntake={() => setIsPatientIntakeOpen(true)}
                  onWritePrescriptionForPatient={handleOpenPrescriptionForPatient}
                  onBillPatient={handleOpenInvoiceForPatient}
                />
              )}

              {activeTab === 'appointments' && (
                <AppointmentsCalendar
                  onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
                />
              )}

              {activeTab === 'prescriptions' && (
                <PrescriptionsDirectory
                  onOpenWritePrescription={() => {
                    setTargetPatientForAction(null);
                    setIsPrescriptionBuilderOpen(true);
                  }}
                  onPreviewPDF={handlePreviewPDF}
                />
              )}

              {activeTab === 'billing' && (
                <BillingDashboard
                  onOpenCreateInvoice={() => {
                    setTargetPatientForAction(null);
                    setIsInvoiceBuilderOpen(true);
                  }}
                />
              )}

              {activeTab === 'team' && (
                <TeamDirectory />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile / Tablet Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090D14]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1 flex items-center justify-around shadow-sm">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-teal-700 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'appointments'
              ? 'text-teal-700 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'patients'
              ? 'text-teal-700 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patients</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'team'
              ? 'text-teal-700 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Clinic</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Modals */}
      <PatientIntakeModal
        isOpen={isPatientIntakeOpen}
        onClose={() => setIsPatientIntakeOpen(false)}
      />

      <PatientDetailsModal
        patient={selectedPatientForDetails}
        isOpen={!!selectedPatientForDetails}
        onClose={() => setSelectedPatientForDetails(null)}
        onWritePrescriptionForPatient={handleOpenPrescriptionForPatient}
        onBillPatient={handleOpenInvoiceForPatient}
      />

      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        preselectedPatientId={targetPatientForAction?.id}
      />

      <PrescriptionBuilderModal
        isOpen={isPrescriptionBuilderOpen}
        onClose={() => setIsPrescriptionBuilderOpen(false)}
        preselectedPatient={targetPatientForAction}
        onPreviewPDF={handlePreviewPDF}
      />

      <InvoiceBuilderModal
        isOpen={isInvoiceBuilderOpen}
        onClose={() => setIsInvoiceBuilderOpen(false)}
        preselectedPatient={targetPatientForAction}
        onPreviewPDF={handlePreviewPDF}
      />

      <RegisterClinicModal
        isOpen={isRegisterClinicOpen}
        onClose={() => setIsRegisterClinicOpen(false)}
      />

      <PDFPreviewModal
        isOpen={pdfPreviewState.isOpen}
        onClose={() => setPdfPreviewState((prev) => ({ ...prev, isOpen: false }))}
        title={pdfPreviewState.title}
        blobUrl={pdfPreviewState.blobUrl}
        onDownload={pdfPreviewState.downloadFn}
      />

      {/* Global Notifications Layer */}
      <ToastContainer />
    </div>
  );
}
