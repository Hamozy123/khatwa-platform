const SCOPED_ROLES = ['deputy_directorate', 'school_principal', 'teacher_m', 'teacher_f'];

export function buildScopeFilter(user?: { role: string; governorate?: string; directorate?: string; administration?: string; schoolName?: string }): Record<string, any> {
  if (!user || !SCOPED_ROLES.includes(user.role)) return {};
  const filter: Record<string, any> = {};
  if (user.directorate) filter.directorate = user.directorate;
  if (user.schoolName) filter.schoolName = user.schoolName;
  return filter;
}

export function buildUserScopeFilter(user?: { role: string; governorate?: string; directorate?: string; administration?: string; schoolName?: string }): Record<string, any> {
  if (!user || !SCOPED_ROLES.includes(user.role)) return {};
  const filter: Record<string, any> = {};
  if (user.directorate) filter.directorate = user.directorate;
  if (user.administration) filter.administration = user.administration;
  if (user.schoolName) filter.schoolName = user.schoolName;
  return filter;
}
