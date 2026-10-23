import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Tag,
  User,
  Shield,
  MessageSquare,
  Star,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Send,
  Building,
  CheckSquare,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../types';

export const ComplaintDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update modal state (Staff/Admin)
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Admin Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [deptStaffList, setDeptStaffList] = useState<any[]>([]);

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [isStaffNote, setIsStaffNote] = useState(false);

  // Student Feedback rating
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Reopen modal
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Complaint>(`/complaints/${id}`);
      if (res.success && res.data) {
        setComplaint(res.data);
      } else {
        setError(res.error || 'Failed to load complaint details.');
      }
    } catch {
      setError('Network error loading complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  // Load departments for Admin assignment
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/admin/departments').then((res) => {
        if (res.success && res.data) setDepartments(res.data);
      });
      api.get('/admin/users?role=STAFF').then((res) => {
        if (res.success && res.data) setDeptStaffList(res.data);
      });
    }
  }, [user]);

  // Submit new comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const res = await api.post(`/complaints/${id}/comments`, {
      message: commentText.trim(),
      isStaffNote,
    });

    if (res.success) {
      setCommentText('');
      fetchComplaintDetails();
    }
  };

  // Status transition
  const handleUpdateStatus = async () => {
    const res = await api.post(`/complaints/${id}/status`, {
      status: newStatus,
      resolutionNotes,
    });
    if (res.success) {
      setShowStatusModal(false);
      fetchComplaintDetails();
    }
  };

  // Admin assign
  const handleAssign = async () => {
    const res = await api.post(`/complaints/${id}/assign`, {
      departmentId: selectedDeptId || undefined,
      staffId: selectedStaffId || undefined,
    });
    if (res.success) {
      setShowAssignModal(false);
      fetchComplaintDetails();
    }
  };

  // Student feedback
  const handleSubmitFeedback = async () => {
    const res = await api.post(`/complaints/${id}/feedback`, {
      rating: feedbackRating,
      comments: feedbackComment,
    });
    if (res.success) {
      setShowFeedbackModal(false);
      fetchComplaintDetails();
    }
  };

  // Reopen
  const handleReopen = async () => {
    const res = await api.post(`/complaints/${id}/reopen`, {
      reason: reopenReason,
    });
    if (res.success) {
      setShowReopenModal(false);
      fetchComplaintDetails();
    }
  };

  // Community verify
  const handleCommunityVerify = async () => {
    const res = await api.post(`/complaints/${id}/verify`, {
      stillExists: true,
    });
    if (res.success) {
      fetchComplaintDetails();
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-royal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading complaint record...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Unable to view complaint</h2>
        <p className="text-xs text-slate-500">{error || 'Record does not exist or access is restricted.'}</p>
        <Link
          to="/complaints"
          className="inline-flex items-center gap-2 px-4 py-2 bg-royal-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Complaints List
        </Link>
      </div>
    );
  }

  const isReporter = user?.id === complaint.reporterId;
  const canUpdateStatus = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const canReopen =
    complaint.status === 'Resolved' && (isReporter || user?.role === 'ADMIN');
  const canVerify =
    user?.role === 'STUDENT' && !isReporter && complaint.status !== 'Resolved';
  const hasVerified = complaint.verifications?.some((v) => v.userId === user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button & ID Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-royal-600 hover:text-royal-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Complaints List
        </Link>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {canUpdateStatus && (
            <button
              onClick={() => {
                setNewStatus(complaint.status);
                setShowStatusModal(true);
              }}
              className="px-3.5 py-1.5 bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Update Status
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => {
                setSelectedDeptId(complaint.assignedDepartmentId || '');
                setSelectedStaffId(complaint.assignedStaffId || '');
                setShowAssignModal(true);
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Assign Dept / Staff
            </button>
          )}

          {canReopen && (
            <button
              onClick={() => setShowReopenModal(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reopen Issue
            </button>
          )}

          {isReporter && complaint.status === 'Resolved' && !complaint.feedback && (
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5" /> Rate Resolution
            </button>
          )}
        </div>
      </div>

      {/* Main Issue Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-bold text-royal-700 bg-royal-50 px-3 py-1 rounded-lg border border-royal-200">
            {complaint.id}
          </span>
          <StatusBadge status={complaint.status} />
          <StatusBadge priority={complaint.priority} type="priority" />
          {complaint.isHazardous && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
              Hazard Warning
            </span>
          )}
          {complaint.isAnonymous && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
              Anonymous Report
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{complaint.title}</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Location</span>
            <span className="font-semibold text-slate-800">{complaint.location || 'Not Specified'}</span>
            {complaint.roomNumber && (
              <span className="block text-slate-500 text-[10px]">{complaint.roomNumber}</span>
            )}
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Category</span>
            <span className="font-semibold text-slate-800">{complaint.category}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Assigned Department</span>
            <span className="font-semibold text-royal-700">
              {complaint.assignedDepartment?.name || 'Unassigned'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Reporter</span>
            <span className="font-semibold text-slate-800">
              {complaint.isAnonymous
                ? user?.role === 'ADMIN'
                  ? `${complaint.reporter?.name || 'Student'} (Anonymous)`
                  : 'Anonymous Student'
                : complaint.reporter?.name || 'Student'}
            </span>
          </div>
        </div>

        {/* Description Body */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Description
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {complaint.description}
          </p>
        </div>

        {/* Evidence Photo */}
        {complaint.evidenceImage && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Attached Evidence Photo
            </h3>
            <img
              src={complaint.evidenceImage}
              alt="Complaint evidence"
              className="max-h-80 rounded-xl border border-slate-200 object-cover shadow-xs"
            />
          </div>
        )}

        {/* Resolution Notes Box */}
        {complaint.resolutionNotes && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
              <CheckCircle className="w-4 h-4" /> Official Resolution Notes:
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              {complaint.resolutionNotes}
            </p>
          </div>
        )}

        {/* Community Verification Action */}
        {canVerify && (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-royal-900 block">Is this issue still present on campus?</span>
              <span className="text-royal-700 text-[11px]">
                Confirm this defect to help maintenance prioritize work and earn +2 Campus Points.
              </span>
            </div>

            <button
              disabled={hasVerified}
              onClick={handleCommunityVerify}
              className="px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 shrink-0"
            >
              {hasVerified ? '✓ Already Verified by You' : 'Confirm Issue Exists (+2 pts)'}
            </button>
          </div>
        )}

        {/* Student Feedback display */}
        {complaint.feedback && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <span>Student Satisfaction Rating:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= complaint.feedback!.rating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {complaint.feedback.comments && (
              <p className="text-amber-950 italic">"{complaint.feedback.comments}"</p>
            )}
          </div>
        )}
      </div>

      {/* Two Column Layout: Timeline Audit & Comments Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Audit Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-royal-600" />
            Audit Trail & Status Timeline
          </h2>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
              complaint.statusHistory.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-royal-600 ring-4 ring-royal-50" />
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.newStatus} />
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-slate-600 mt-1">{item.notes}</p>
                  )}
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Updated by: {item.changedBy?.name || 'System Auto-Router'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No status changes recorded.</p>
            )}
          </div>
        </div>

        {/* Comments & Follow-Up Thread */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-royal-600" />
              Follow-Up Comments & Progress Notes
            </h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {complaint.comments && complaint.comments.length > 0 ? (
                complaint.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className={`p-3 rounded-xl border text-xs ${
                      comm.isStaffNote
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-800">
                        {comm.user?.name}
                        {comm.isStaffNote && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-bold">
                            INTERNAL NOTE
                          </span>
                        )}
                      </span>
                      <span className="text-slate-400">
                        {new Date(comm.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700">{comm.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  No comments or follow-up notes yet.
                </p>
              )}
            </div>
          </div>

          {/* Add Comment Box */}
          <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 space-y-2">
            <textarea
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment or follow-up question..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-royal-500/20 focus:border-royal-600"
            />

            <div className="flex items-center justify-between">
              {(user?.role === 'STAFF' || user?.role === 'ADMIN') ? (
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={isStaffNote}
                    onChange={(e) => setIsStaffNote(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                  />
                  <span>Internal Staff Note</span>
                </label>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-1.5 bg-royal-600 hover:bg-royal-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-40 flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" /> Post
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 1: Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Complaint Status"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select New Status *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-royal-500"
            >
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resolution or Progress Notes
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Detail actions taken, repairs made, parts replaced, or reasons for rejection..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-royal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateStatus}
              className="px-5 py-2 bg-royal-600 text-white rounded-xl text-xs font-bold hover:bg-royal-700"
            >
              Save Status
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Admin Department & Staff Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Department & Staff Member"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Responsible Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="">Select Department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign Specific Staff Member
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="">Unassigned (Department Queue)</option>
              {deptStaffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              className="px-5 py-2 bg-royal-600 text-white rounded-xl text-xs font-bold hover:bg-royal-700"
            >
              Confirm Assignment
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Student Satisfaction Rating Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Rate Resolution Quality"
      >
        <div className="space-y-4">
          <div className="text-center py-2">
            <p className="text-xs text-slate-500 mb-2">How satisfied are you with this repair?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= feedbackRating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Feedback / Comments (Optional)
            </label>
            <textarea
              rows={3}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Tell us what went well or what could be improved..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowFeedbackModal(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitFeedback}
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
            >
              Submit Feedback (+5 pts)
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal 4: Reopen Complaint Modal */}
      <Modal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        title="Reopen Infrastructure Issue"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            If the problem reoccurred or the resolution was unsatisfactory, specify the reason below.
            Campus administration will be notified immediately.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Reopening *
            </label>
            <textarea
              required
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Explain why the issue requires further maintenance..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowReopenModal(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!reopenReason.trim()}
              onClick={handleReopen}
              className="px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 disabled:opacity-40"
            >
              Confirm Reopen
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
