import React, { useState } from 'react';
import { History, Shield, Filter, Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useClinic, useClinicAuditLogs } from '../../hooks/useStore';

export interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const auditLogs = useClinicAuditLogs();
  const currentClinic = useClinic();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || log.entity_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Zero-Trust Security & Audit Trail"
      subtitle={`Immutable cryptographic action logs for tenant: ${currentClinic.name}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter actions, users, records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Entity Actions</option>
              <option value="appointment">Appointments</option>
              <option value="patient">Patients</option>
              <option value="prescription">Prescriptions</option>
              <option value="invoice">Billing</option>
              <option value="staff">Staff & Onboarding</option>
              <option value="auth">Auth & Tenant</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No security audit logs match the specified criteria.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="sm">
                        {log.action}
                      </Badge>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.user_name}
                      </span>
                      <span className="text-slate-400">({log.user_role.toUpperCase()})</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {log.details}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {log.id.substring(0, 16)}...
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-white/5">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Append-only zero-trust security journal
          </span>
          <span>{filteredLogs.length} events recorded</span>
        </div>
      </div>
    </Modal>
  );
};
