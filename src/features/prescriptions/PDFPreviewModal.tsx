import React from 'react';
import { Download, FileCheck } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  blobUrl: string | null;
  onDownload: () => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  blobUrl,
  onDownload,
}) => {
  if (!isOpen || !blobUrl) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Client-Side Rendered via jsPDF • Zero Server Overhead • 21 CFR Part 11 Format"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* PDF viewer frame */}
        <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black">
          <iframe
            src={blobUrl}
            title={title}
            className="w-full h-full border-0"
          />
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            <FileCheck className="w-4 h-4" />
            <span>Document generated & digitally sealed in your browser</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close Preview
            </Button>
            <Button
              variant="primary"
              onClick={onDownload}
              icon={<Download className="w-4 h-4" />}
            >
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
