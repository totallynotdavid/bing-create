// Create a readable filename for an image generated from a prompt.
// Bing images include a non-human id in the URL (e.g., OIG4.HfM5lIwyCttDOzJbyOCW), so we build a slug instead.
// The filename uses: <prompt-as-slug>_<index>.jpg
export function generateFilename(prompt: string, index: number): string {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+/, "")
    .replace(/_+$/, "")
    .slice(0, 50);

  return `${slug}_${index}.jpg`;
}
