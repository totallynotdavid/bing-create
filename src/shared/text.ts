const REPLACEMENTS: Record<string, string> = {
  "\\u0026": "&",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

// One pass, so a decoded ampersand is never decoded again: an escaped
// ampersand followed by "amp;" ends as the text "&amp;", not "&".
export function decodeEscapes(text: string): string {
  return text.replace(
    /\\u0026|&(?:amp|quot|#39|lt|gt);/g,
    (match) => REPLACEMENTS[match] ?? match,
  );
}
