// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { ROLES } from '../data/constants';
import { THEME_CLASSES } from '../theme/constants';
import { formatRoleLabel, parseRoleLabel, toggleRoleSelection } from '../utils/roles';

type RoleMultiSelectBaseProps = {
  className?: string;
  compact?: boolean;
  placeholder?: string;
  'aria-label'?: string;
};

type RoleMultiSelectStringProps = RoleMultiSelectBaseProps & {
  mode?: 'string';
  value: string;
  onChange: (value: string) => void;
  includeTutti?: false;
};

type RoleMultiSelectArrayProps = RoleMultiSelectBaseProps & {
  mode: 'array';
  value: string[];
  onChange: (value: string[]) => void;
  includeTutti?: boolean;
};

export type RoleMultiSelectProps = RoleMultiSelectStringProps | RoleMultiSelectArrayProps;

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

export const RoleMultiSelect = memo(function RoleMultiSelect(props: RoleMultiSelectProps) {
  const {
    className = '',
    compact = false,
    placeholder = 'Seleziona ruoli...',
    'aria-label': ariaLabel = 'Seleziona ruoli',
  } = props;

  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected =
    props.mode === 'array' ? props.value : parseRoleLabel(props.value);

  const options = props.mode === 'array' && props.includeTutti
    ? (['Tutti', ...ROLES] as const)
    : ROLES;

  useEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggleRole = (role: string) => {
    if (props.mode === 'array') {
      props.onChange(toggleRoleSelection(props.value, role));
      return;
    }
    const next = selected.includes(role)
      ? selected.filter((r) => r !== role)
      : [...selected, role];
    props.onChange(formatRoleLabel(next));
  };

  const label = selected.length > 0 ? formatRoleLabel(selected) : placeholder;

  const menu =
    open &&
    menuPosition &&
    createPortal(
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
          zIndex: 9999,
        }}
        className="min-w-[10rem] max-h-48 overflow-y-auto bg-theme-card border border-theme-border rounded-lg shadow-lg py-1"
        role="listbox"
        aria-multiselectable
      >
        {options.map((role) => {
          const isSelected = selected.includes(role);
          return (
            <label
              key={role}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-theme-secondary hover:bg-theme-muted cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleRole(role)}
                className="rounded border-theme-border text-emerald-500 focus:ring-emerald-500"
              />
              <span>{role}</span>
            </label>
          );
        })}
      </div>,
      document.body
    );

  return (
    <div ref={rootRef} className={className}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1 border border-theme-border bg-theme-input text-left focus:outline-none focus:border-emerald-500 ${
          compact
            ? 'text-[10px] font-bold text-teal-400 rounded py-0.5 px-1'
            : `${THEME_CLASSES.inputMuted} text-xs rounded-lg px-2.5 py-2`
        }`}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={`truncate ${selected.length === 0 ? 'text-theme-muted-text' : ''}`}>
          {label}
        </span>
        <ChevronDown className={`shrink-0 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-theme-muted-text`} />
      </button>
      {menu}
    </div>
  );
});
