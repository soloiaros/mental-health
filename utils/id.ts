export function createId(): string {
  const maybeCrypto = (globalThis as any)?.crypto;
  const uuid = maybeCrypto?.randomUUID?.();
  if (typeof uuid === 'string' && uuid.length > 0) return uuid;

  // Fallback: stable-enough for local-only IDs.
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

