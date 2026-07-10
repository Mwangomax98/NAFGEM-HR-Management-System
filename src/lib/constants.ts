export const NAFGEM_REGIONS = [
  'Kilimanjaro',
  'Manyara',
  'Arusha',
  'Tanga',
  'Lindi',
] as const;

export const NAFGEM_PROGRAMS = [
  'FGM Prevention',
  'GBV Response',
  'Girls Education',
  'Community Advocacy',
  'Survivor Support',
] as const;

export const STAFF_REQUEST_TYPES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'it_equipment', label: 'IT / Equipment' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'transport', label: 'Transport / Logistics' },
  { value: 'facility_access', label: 'Facility Access' },
  { value: 'other', label: 'Other' },
] as const;

export const STAFF_REQUEST_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export const MAIN_SITE_URL = import.meta.env.VITE_MAIN_SITE_URL || 'https://nafgemtanzania.or.tz';
export const HR_PORTAL_URL = import.meta.env.VITE_HR_PORTAL_URL || 'https://hr.nafgemtanzania.or.tz';
