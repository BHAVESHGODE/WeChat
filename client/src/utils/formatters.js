export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function truncate(str, len = 100) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function slugify(str) {
  return str?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
}

export function ratingColor(score) {
  if (!score) return 'var(--text-tertiary)';
  if (score >= 8) return '#43e97b';
  if (score >= 6) return '#ffd700';
  if (score >= 4) return '#ffa751';
  return '#ff6b9d';
}
