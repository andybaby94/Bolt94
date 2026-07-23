const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function formatKST(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  const h = String(kst.getUTCHours()).padStart(2, '0');
  const min = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

export function formatDateKST(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isTodayKST(iso: string): boolean {
  const kst = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  return (
    kst.getUTCFullYear() === nowKst.getUTCFullYear() &&
    kst.getUTCMonth() === nowKst.getUTCMonth() &&
    kst.getUTCDate() === nowKst.getUTCDate()
  );
}

export function nowKSTLocal(): string {
  const kst = new Date(Date.now() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  const h = String(kst.getUTCHours()).padStart(2, '0');
  const min = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function kstLocalToISO(local: string): string {
  return new Date(local + '+09:00').toISOString();
}

export function isoToKSTLocal(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  const h = String(kst.getUTCHours()).padStart(2, '0');
  const min = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}
