export function formatWorkRestLabel(
  workSeconds: number,
  restSeconds: number,
  sets?: number
): string | null {
  if (workSeconds <= 0 && restSeconds <= 0) return null;

  const work = workSeconds > 0 ? `${workSeconds}s lavoro` : null;
  const rest = restSeconds > 0 ? `${restSeconds}s pausa` : null;
  const timing = [work, rest].filter(Boolean).join(' / ');
  if (!timing) return null;

  if (sets != null && sets > 0) {
    return `${sets}× (${timing})`;
  }
  return timing;
}
