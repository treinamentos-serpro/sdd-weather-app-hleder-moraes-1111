// Lê "HH:mm" direto da string local da API ("2026-11-11T15:00"), sem criar Date (R-11).
const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/;

// Converte "YYYY-MM-DD" em "dd/mm/aaaa" também sem criar Date (RN-08).
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

export function formatTime(localDateTime: string): string {
  const match = LOCAL_DATE_TIME.exec(localDateTime);
  return match ? match[1] : '—';
}

export function formatDate(localDate: string): string {
  const match = LOCAL_DATE.exec(localDate);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
}
