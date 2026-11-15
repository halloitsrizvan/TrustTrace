export function sanitizeTipMessage(value?: string): string | null {
  if (!value) return null;
  const withoutControls = Array.from(value)
    .map((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code < 32 || code === 127 ? ' ' : character;
    })
    .join('');
  const clean = withoutControls.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return clean.slice(0, 140) || null;
}
