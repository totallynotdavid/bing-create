export function generateFilename(prompt: string, index: number): string {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);

  return `${slug}_${index}.jpg`;
}
