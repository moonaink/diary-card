/** Outcome of reading untrusted data (a backup file): the value, or the reason it was rejected. */
export type ParseResult<T> = { ok: true; value: T } | { ok: false; reason: string }

export const parsed = <T>(value: T): ParseResult<T> => ({ ok: true, value })

export const rejected = <T>(reason: string): ParseResult<T> => ({ ok: false, reason })
