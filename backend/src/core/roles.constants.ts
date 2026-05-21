export const ROLES = {
  ALL: ['admin', 'admin_manager', 'deputy_directorate', 'school_principal', 'teacher_m', 'teacher_f'] as const,
  DELETE: ['admin', 'admin_manager', 'deputy_directorate'] as const,
  ADMIN_ONLY: ['admin'] as const,
  ADMIN_MANAGER_UP: ['admin', 'admin_manager'] as const,
  SCHOOL_ADMIN_UP: ['admin', 'admin_manager', 'deputy_directorate', 'school_principal'] as const,
} as const;
