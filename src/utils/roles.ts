// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { ROLES, ROLE_PLAYER_COUNTS, TEAM_SIZE } from '../data/constants';

export const ROLE_LABEL_SEPARATOR = ' / ';

export function countPlayersForRoles(roles: string[]): number {
  if (roles.length === 0 || roles.includes('Tutti')) return TEAM_SIZE;

  const uniqueRoles = [...new Set(roles.filter((role) => role !== 'Tutti'))];
  let count = 0;

  for (const role of uniqueRoles) {
    if ((ROLES as readonly string[]).includes(role)) {
      count += ROLE_PLAYER_COUNTS[role as (typeof ROLES)[number]];
    }
  }

  return count > 0 ? count : TEAM_SIZE;
}

export function countPlayersForRoleLabel(roleLabel: string): number {
  const parsed = parseRoleLabel(roleLabel);
  const knownRoles = parsed.filter((role) => (ROLES as readonly string[]).includes(role));
  if (knownRoles.length > 0) {
    return countPlayersForRoles(knownRoles);
  }

  const lower = roleLabel.toLowerCase();
  let count = 0;
  let matched = false;

  for (const role of ROLES) {
    if (lower.includes(role.toLowerCase())) {
      count += ROLE_PLAYER_COUNTS[role];
      matched = true;
    }
  }

  if (lower.includes('banda')) {
    if (!lower.includes('schiacciator')) count += ROLE_PLAYER_COUNTS.Schiacciatori;
    if (!lower.includes('oppost')) count += ROLE_PLAYER_COUNTS.Opposti;
    matched = true;
  }

  if (lower.includes('attaccant')) {
    count += ROLE_PLAYER_COUNTS.Schiacciatori + ROLE_PLAYER_COUNTS.Opposti + ROLE_PLAYER_COUNTS.Centrali;
    matched = true;
  }

  if (lower.includes('difesa') && !lower.includes('liber')) {
    count += ROLE_PLAYER_COUNTS.Liberi;
    matched = true;
  }

  return matched && count > 0 ? count : 1;
}

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
