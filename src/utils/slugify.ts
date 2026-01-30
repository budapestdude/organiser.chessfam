/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Build a tournament URL with ID and slug
 */
export function buildTournamentUrl(id: number, name: string, path?: string): string {
  const slug = slugify(name);
  const base = `/tournament/${id}/${slug}`;
  return path ? `${base}/${path}` : base;
}
