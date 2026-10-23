export const USER_ROLES = {
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const COMPLAINT_CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Internet and IT',
  'Classroom',
  'Laboratory',
  'Library',
  'Furniture',
  'Cleanliness',
  'Security',
  'Parking',
  'Water Supply',
  'Other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type ComplaintPriority = (typeof COMPLAINT_PRIORITIES)[number];

export const COMPLAINT_STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
  'Reopened',
] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

// Campus Hotspots & Map Locations (Exact 9 College Locations)
export const CAMPUS_LOCATIONS = [
  { id: 'canteen', name: 'Canteen', code: 'CAN', x: 25, y: 75 },
  { id: 'floor-0', name: '0th Floor', code: 'FL0', x: 25, y: 35 },
  { id: 'floor-1', name: '1st Floor', code: 'FL1', x: 45, y: 35 },
  { id: 'floor-2', name: '2nd Floor', code: 'FL2', x: 65, y: 35 },
  { id: 'floor-3', name: '3rd Floor', code: 'FL3', x: 45, y: 15 },
  { id: 'floor-4', name: '4th Floor', code: 'FL4', x: 65, y: 15 },
  { id: 'gymkhana', name: 'Gymkhana', code: 'GYM', x: 80, y: 75 },
  { id: 'mpw-workshop', name: 'MPW Workshop', code: 'MPW', x: 75, y: 55 },
  { id: 'library', name: 'Library', code: 'LIB', x: 50, y: 65 },
] as const;

// 9 Exact Facilities for Student Feedback & Ratings
export const CAMPUS_FACILITIES = [
  'Library',
  'Workshop',
  'Sports Room',
  'Computer Labs',
  'Seminar Hall',
  'Washrooms',
  'Classrooms',
  'Lift',
  'Wi-Fi',
] as const;
export type CampusFacility = (typeof CAMPUS_FACILITIES)[number];

// Rule-based automatic routing mapping
export const CATEGORY_DEPARTMENT_ROUTING: Record<string, string> = {
  'Electrical': 'Electrical Maintenance',
  'Plumbing': 'Civil & Plumbing',
  'Internet and IT': 'IT Infrastructure & Networking',
  'Classroom': 'Campus Estate & Facilities',
  'Laboratory': 'Academic Lab Support',
  'Library': 'Library Services',
  'Furniture': 'Carpentry & Estate',
  'Cleanliness': 'Housekeeping & Sanitation',
  'Security': 'Campus Safety & Security',
  'Parking': 'Transport & Parking Office',
  'Water Supply': 'Civil & Plumbing',
  'Other': 'General Administration',
};

// Rule-based priority suggestion based on category & impact
export function suggestPriority(category: string, isHazardous?: boolean, affectsClassroom?: boolean): ComplaintPriority {
  if (isHazardous || category === 'Security') {
    return 'Critical';
  }
  if (category === 'Water Supply' || affectsClassroom || category === 'Internet and IT') {
    return 'High';
  }
  if (category === 'Electrical' || category === 'Plumbing' || category === 'Laboratory') {
    return 'Medium';
  }
  return 'Low';
}
