/**
 * Snake-to-camel mapping utility for Supabase rows.
 * All 11 Supabase tables use snake_case columns but every TypeScript
 * interface uses camelCase. This single utility handles the conversion.
 */

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

export function mapRow<T = Record<string, unknown>>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    out[snakeToCamel(k)] = v
  }
  return out as T
}
