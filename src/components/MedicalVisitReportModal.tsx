// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { useMemo, useState } from 'react';
import { Check, Copy, Printer, X } from 'lucide-react';
import { THEME_CLASSES } from '../theme/constants';
import type { Player } from '../types';

export type MedicalVisitAlertStatus = 'expiring' | 'expired';

export interface MedicalVisitAlert {
  player: Player;
  status: MedicalVisitAlertStatus;
  expiry: string;
}

export interface MedicalVisitReportModalProps {
  alerts: MedicalVisitAlert[];
  generatedAt: Date;
  onClose: () => void;
}

function playerFullName(player: Player): string {
  return `${player.lastName} ${player.firstName}`;
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABEL: Record<MedicalVisitAlertStatus, string> = {
  expired: 'Scaduta',
  expiring: 'In scadenza',
};

function buildWhatsAppText(alerts: MedicalVisitAlert[], generatedAt: Date): string {
  const expired = alerts.filter((a) => a.status === 'expired');
  const expiring = alerts.filter((a) => a.status === 'expiring');
  const lines: string[] = [
    '*Report Visite Mediche*',
    `Generato il ${formatDateTime(generatedAt)}`,
    '',
  ];

  if (alerts.length === 0) {
    lines.push('Nessuna visita medica in scadenza o scaduta.');
    return lines.join('\n');
  }

  lines.push(
    `${alerts.length} ${alerts.length === 1 ? 'segnalazione' : 'segnalazioni'}: ${expired.length} scadute, ${expiring.length} in scadenza (entro 30 giorni).`,
    ''
  );

  const appendSection = (title: string, items: MedicalVisitAlert[]) => {
    if (items.length === 0) return;
    lines.push(`*${title} (${items.length})*`);
    for (const alert of items) {
      const inactive = alert.player.active ? '' : ' _(non attivo)_';
      lines.push(`• ${playerFullName(alert.player)}${inactive} — ${formatDate(alert.expiry)}`);
    }
    lines.push('');
  };

  appendSection('Scadute', expired);
  appendSection('In scadenza', expiring);

  return lines.join('\n').trimEnd();
}

export function MedicalVisitReportModal({
  alerts,
  generatedAt,
  onClose,
}: MedicalVisitReportModalProps) {
  const [copied, setCopied] = useState(false);
  const expired = alerts.filter((a) => a.status === 'expired');
  const expiring = alerts.filter((a) => a.status === 'expiring');
  const whatsappText = useMemo(
    () => buildWhatsAppText(alerts, generatedAt),
    [alerts, generatedAt]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / insecure contexts
      const textarea = document.createElement('textarea');
      textarea.value = whatsappText;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:static print:inset-auto print:p-0 print:bg-transparent print:backdrop-blur-none">
      <div
        className={`${THEME_CLASSES.card} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-theme-border flex flex-col print:max-w-none print:max-h-none print:rounded-none print:shadow-none print:border-0 print:bg-white print:text-slate-900`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border print:hidden">
          <h2 className="text-sm font-bold text-theme-heading">Report Visite Mediche</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiato!' : 'Copia per WhatsApp'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className={`px-3 py-1.5 ${THEME_CLASSES.mutedButton} text-xs font-bold rounded-xl flex items-center gap-1.5 transition`}
            >
              <Printer className="w-3.5 h-3.5" /> Stampa
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-theme-muted text-theme-muted-text transition"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 print:p-0 print:overflow-visible">
          <div className="space-y-1 print:border-b print:border-slate-300 print:pb-3 print:hidden">
            <p className="text-xs text-theme-muted-text">
              Generato il {formatDateTime(generatedAt)}
            </p>
            <p className="text-xs text-theme-secondary">
              {alerts.length === 0
                ? 'Nessuna visita medica in scadenza o scaduta.'
                : `${alerts.length} ${alerts.length === 1 ? 'segnalazione' : 'segnalazioni'}: ${expired.length} scadute, ${expiring.length} in scadenza (entro 30 giorni).`}
            </p>
          </div>

          <div className="space-y-2 print:hidden">
            <label className="block text-[10px] font-bold text-theme-subtle uppercase">
              Anteprima messaggio WhatsApp
            </label>
            <textarea
              readOnly
              value={whatsappText}
              rows={Math.min(16, whatsappText.split('\n').length + 1)}
              className={`w-full ${THEME_CLASSES.input} text-xs font-mono rounded-xl px-3 py-3 resize-y leading-relaxed`}
              onFocus={(e) => e.currentTarget.select()}
            />
            <p className="text-[10px] text-theme-muted-text">
              Usa «Copia per WhatsApp» oppure seleziona e copia il testo qui sopra.
            </p>
          </div>

          <div className="hidden print:block space-y-4">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
              Report Visite Mediche
            </h1>
            <p className="text-xs text-slate-600">Generato il {formatDateTime(generatedAt)}</p>
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-600">Nessuna visita medica in scadenza o scaduta.</p>
            ) : (
              <table className="w-full text-sm border border-slate-300">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100">
                    <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                      Giocatore
                    </th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                      Scadenza
                    </th>
                    <th className="text-left px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                      Stato
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(({ player, status, expiry }) => (
                    <tr key={player.id} className="border-b border-slate-200 last:border-0">
                      <td className="px-3 py-2 text-slate-900 font-semibold">
                        {playerFullName(player)}
                        {!player.active && (
                          <span className="ml-1 text-[10px] font-bold text-amber-700">(non attivo)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700">{formatDate(expiry)}</td>
                      <td
                        className={`px-3 py-2 font-bold text-xs ${
                          status === 'expired' ? 'text-rose-700' : 'text-amber-700'
                        }`}
                      >
                        {STATUS_LABEL[status]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
