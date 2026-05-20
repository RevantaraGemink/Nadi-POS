/**
 * Returns the current date and time formatted for display.
 * Example output: "20 Mei 2026 – 14:00"
 */
export function formatCurrentDateTime() {
  const now = new Date();
  const date = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const time = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} – ${time}`;
}
