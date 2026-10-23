import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertCircle,
  FileText,
  MapPin,
  ShoppingBag,
  Users,
  Star,
  Search,
  Utensils,
  Calendar,
  Clock,
  BellRing,
  Award,
  CheckSquare,
  ShieldAlert,
  UserCheck,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const getDashboardPath = () => {
    if (role === 'ADMIN') return '/admin-dashboard';
    if (role === 'STAFF') return '/staff-dashboard';
    return '/dashboard';
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-royal-600 text-white shadow-md shadow-royal-600/25'
        : 'text-slate-600 hover:text-royal-700 hover:bg-royal-50/70'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with Close button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <span className="font-bold text-slate-800 text-sm">Navigation Menu</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main Section */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Core Workspace
            </div>
            <nav className="space-y-1">
              <NavLink to={getDashboardPath()} className={navItemClass} onClick={onClose}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>

              {role === 'STUDENT' && (
                <NavLink to="/complaints/submit" className={navItemClass} onClick={onClose}>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Report Infrastructure Issue</span>
                </NavLink>
              )}

              <NavLink to="/complaints" className={navItemClass} onClick={onClose}>
                <FileText className="w-4 h-4" />
                <span>
                  {role === 'STUDENT'
                    ? 'My Complaints'
                    : role === 'STAFF'
                    ? 'Assigned Tasks'
                    : 'All Complaints'}
                </span>
              </NavLink>

              <NavLink to="/hotspots" className={navItemClass} onClick={onClose}>
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Campus Hotspots & Map</span>
              </NavLink>
            </nav>
          </div>

          {/* Student & Community Services */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Campus Life & Services
            </div>
            <nav className="space-y-1">
              <NavLink to="/marketplace" className={navItemClass} onClick={onClose}>
                <ShoppingBag className="w-4 h-4" />
                <span>Campus Marketplace</span>
              </NavLink>

              <NavLink to="/study-groups" className={navItemClass} onClick={onClose}>
                <Users className="w-4 h-4" />
                <span>Study Groups</span>
              </NavLink>

              <NavLink to="/ratings" className={navItemClass} onClick={onClose}>
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Facility Ratings</span>
              </NavLink>

              <NavLink to="/lost-found" className={navItemClass} onClick={onClose}>
                <Search className="w-4 h-4" />
                <span>Lost & Found</span>
              </NavLink>

              <NavLink to="/canteen" className={navItemClass} onClick={onClose}>
                <Utensils className="w-4 h-4" />
                <span>Canteen Menu</span>
              </NavLink>
            </nav>
          </div>

          {/* Academic Modules */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Academic Hub
            </div>
            <nav className="space-y-1">
              {role === 'STUDENT' && (
                <NavLink to="/timetable" className={navItemClass} onClick={onClose}>
                  <Clock className="w-4 h-4" />
                  <span>Personal Timetable</span>
                </NavLink>
              )}

              <NavLink to="/events" className={navItemClass} onClick={onClose}>
                <Calendar className="w-4 h-4" />
                <span>College Calendar & Events</span>
              </NavLink>

              <NavLink to="/announcements" className={navItemClass} onClick={onClose}>
                <BellRing className="w-4 h-4" />
                <span>Official Announcements</span>
              </NavLink>

              <NavLink to="/exams" className={navItemClass} onClick={onClose}>
                <Award className="w-4 h-4" />
                <span>Exam Countdown</span>
              </NavLink>

              {role === 'STUDENT' && (
                <NavLink to="/attendance" className={navItemClass} onClick={onClose}>
                  <CheckSquare className="w-4 h-4" />
                  <span>Attendance Tracker</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* Administrative Controls */}
          {role === 'ADMIN' && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-royal-700 uppercase">
                Administration
              </div>
              <nav className="space-y-1">
                <NavLink to="/admin/users" className={navItemClass} onClick={onClose}>
                  <UserCheck className="w-4 h-4" />
                  <span>User & Role Management</span>
                </NavLink>

                <NavLink to="/admin/audit-logs" className={navItemClass} onClick={onClose}>
                  <Shield className="w-4 h-4" />
                  <span>Security Audit Trail</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Emergency SOS */}
          <div className="pt-2">
            <NavLink
              to="/sos"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`
              }
              onClick={onClose}
            >
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Campus SOS Emergency</span>
            </NavLink>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] text-slate-500 font-medium">
            Smart Digital Campus v1.0
          </div>
          <div className="text-[10px] text-slate-400">Academic Submission 2026</div>
        </div>
      </aside>
    </>
  );
};
