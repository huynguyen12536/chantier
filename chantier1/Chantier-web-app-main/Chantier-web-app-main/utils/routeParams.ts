/** Normalize expo-router param (string | string[] | undefined) to a single string. */
export function routeParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value[0] || undefined;
  return value || undefined;
}
