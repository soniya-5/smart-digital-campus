export type UserRole = 'STUDENT' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  studentId?: string | null;
  phone?: string | null;
  roomNo?: string | null;
  points: number;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt?: string;
}

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected'
  | 'Reopened';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string | null;
  roomNumber?: string | null;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  isHazardous: boolean;
  affectsClassroom: boolean;
  isAnonymous?: boolean;
  evidenceImage?: string | null;
  resolutionNotes?: string | null;
  reporterId: string;
  assignedDepartmentId?: string | null;
  assignedStaffId?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  reporter?: {
    id: string;
    name: string;
    email: string;
    studentId?: string | null;
    phone?: string | null;
  };
  assignedDepartment?: {
    id: string;
    name: string;
    code: string;
  } | null;
  assignedStaff?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  statusHistory?: ComplaintStatusHistory[];
  comments?: ComplaintComment[];
  feedback?: ComplaintFeedback | null;
  verifications?: CommunityVerification[];
  _count?: {
    comments: number;
    verifications: number;
  };
}

export interface ComplaintStatusHistory {
  id: string;
  complaintId: string;
  oldStatus?: string | null;
  newStatus: string;
  changedById: string;
  notes?: string | null;
  createdAt: string;
  changedBy?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface ComplaintComment {
  id: string;
  complaintId: string;
  userId: string;
  message: string;
  isStaffNote: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface ComplaintFeedback {
  id: string;
  complaintId: string;
  studentId: string;
  rating: number;
  comments?: string | null;
  submittedAt: string;
}

export interface CommunityVerification {
  id: string;
  complaintId: string;
  userId: string;
  stillExists: boolean;
  notes?: string | null;
  verifiedAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CampusHotspot {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  totalComplaints: number;
  activeComplaints: number;
  criticalComplaints: number;
  categoryBreakdown: Record<string, number>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: string;
  contactMethod: string;
  status: 'AVAILABLE' | 'SOLD' | 'CLOSED';
  sellerId: string;
  image?: string | null;
  createdAt: string;
  seller?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

export interface StudyGroup {
  id: string;
  title: string;
  description: string;
  subject: string;
  course: string;
  meetingMode: string;
  schedule: string;
  capacity: number;
  creatorId: string;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
  };
  members?: {
    id: string;
    userId: string;
    joinedAt: string;
    user?: {
      id: string;
      name: string;
      studentId?: string | null;
    };
  }[];
}

export interface FacilityRating {
  id: string;
  facilityName: string;
  category: string;
  rating: number;
  comments?: string | null;
  userId: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

export interface LostAndFoundItem {
  id: string;
  type: 'LOST' | 'FOUND';
  itemName: string;
  description: string;
  category: string;
  location: string;
  dateReported: string;
  status: 'OPEN' | 'MATCHED' | 'RETURNED' | 'CLOSED';
  reporterId: string;
  image?: string | null;
  contactInfo?: string | null;
  createdAt: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CanteenItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  description?: string | null;
  image?: string | null;
}

export interface TimetableEntry {
  id: string;
  userId?: string | null;
  subject: string;
  code?: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
  facultyName?: string | null;
  batch?: string | null;
  type?: string | null;
  createdAt?: string;
}

export interface AttendanceSession {
  timetableEntryId: string;
  subject: string;
  code: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
  facultyName?: string | null;
  batch?: string | null;
  type?: string | null;
  date: string;
  status: 'ATTENDED' | 'NOT_ATTENDED' | 'UNMARKED';
  sessionId?: string | null;
  markedAt?: string | null;
}

export interface AttendanceSubjectStat {
  code: string;
  subject: string;
  attended: number;
  notAttended: number;
  totalRecorded: number;
  percentage: number | null;
  isEligible: boolean;
  faculty?: string | null;
  location: string;
}

export interface AttendanceStatsResponse {
  overall: {
    totalAttended: number;
    totalRecorded: number;
    percentage: number;
    target: number;
    isEligible: boolean;
    hasData: boolean;
  };
  subjectBreakdown: AttendanceSubjectStat[];
  timetableCount: number;
  totalSessionsCount: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location?: string | null;
  organizer?: string | null;
  isOfficial: boolean;
  capacity?: number | null;
  registeredCount?: number;
  isUserRegistered?: boolean;
}

export interface ExamRecord {
  id: string;
  courseCode: string;
  courseName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  department: string;
  seatNumber?: string | null;
  notes?: string | null;
  daysRemaining?: number;
  isPast?: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subject: string;
  totalClasses: number;
  attendedClasses: number;
  percentage?: number;
  isEligible?: boolean;
  lastUpdated: string;
  notes?: string | null;
}

export interface SOSAlert {
  id: string;
  reporterId: string;
  alertType: string;
  location: string;
  details?: string | null;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedById?: string | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  reporter?: {
    id: string;
    name: string;
    phone?: string | null;
    studentId?: string | null;
    email: string;
  };
  acknowledgedBy?: {
    name: string;
  };
}

export interface HealthScoreData {
  score: number;
  grade: string;
  color: string;
  metrics: {
    totalComplaints: number;
    activeComplaints: number;
    resolvedComplaints: number;
    criticalUnresolved: number;
    overdueUnresolved: number;
    resolutionRatePercentage: number;
  };
  formulaDescription: string;
}
