export type PlatformSegment = 'dashboard' | 'companies' | 'admins';

export function parsePlatformSegment(value: string | undefined): PlatformSegment {
  if (value === 'companies' || value === 'admins') return value;
  return 'dashboard';
}
