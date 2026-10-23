import React from 'react';
import { ComplaintPriority, ComplaintStatus } from '../../types';

interface StatusBadgeProps {
  status?: ComplaintStatus | string;
  priority?: ComplaintPriority | string;
  type?: 'status' | 'priority' | 'generic';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  priority,
  type = 'status',
  className = '',
}) => {
  if (type === 'priority' || priority) {
    const val = priority || status;
    switch (val) {
      case 'Critical':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200 ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 ${className}`}
          >
            High
          </span>
        );
      case 'Medium':
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 ${className}`}
          >
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
          >
            Low
          </span>
        );
    }
  }

  // Complaint Statuses
  switch (status) {
    case 'Submitted':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 ${className}`}
        >
          Submitted
        </span>
      );
    case 'Under Review':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
        >
          Under Review
        </span>
      );
    case 'Assigned':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          Assigned
        </span>
      );
    case 'In Progress':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          In Progress
        </span>
      );
    case 'Resolved':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          Resolved
        </span>
      );
    case 'Rejected':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          Rejected
        </span>
      );
    case 'Reopened':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 ${className}`}
        >
          Reopened
        </span>
      );
    case 'AVAILABLE':
    case 'OPEN':
    case 'ACTIVE':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          {status}
        </span>
      );
    case 'ACKNOWLEDGED':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          Acknowledged
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          {status || 'Unknown'}
        </span>
      );
  }
};
