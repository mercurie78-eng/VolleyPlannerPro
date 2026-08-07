import { ROLES } from '../data/constants';

export const ROLE_LABEL_SEPARATOR = ' / ';

export function parseRoleLabel(role: string): string[] {
  if (!role.trim()) return [];
  const parts = role.split(/\s*\/\s*|\s*,\s*/).map((p) => p.trim()).filter(Boolean);
  const known = parts.filter((p) => (ROLES as readonly string[]).includes(p));
  return known.length > 0 ? known : parts;
}

export function formatRoleLabel(roles: string[]): string {
  return roles.filter(Boolean).join(ROLE_LABEL_SEPARATOR);
}

export function toggleRoleSelection(current: string[], role: string): string[] {
  if (role === 'Tutti') return ['Tutti'];

  const withoutTutti = current.filter((r) => r !== 'Tutti');
  const next = withoutTutti.includes(role)
    ? withoutTutti.filter((r) => r !== role)
    : [...withoutTutti, role];

  return next.length > 0 ? next : ['Tutti'];
}
