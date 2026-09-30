/** Two-letter initials for an avatar circle, e.g. 'דנה כהן' -> 'דכ'. */
export function initialsOf(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}
