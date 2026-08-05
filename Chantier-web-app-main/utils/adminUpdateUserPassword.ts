import { supabaseAnonKey, supabaseUrl } from '@/services/supabase';

export type AdminUserAuthUpdate = {
  password?: string;
  email?: string;
};

export async function updateUserPassword(
  userId: string,
  accessToken: string,
  update: AdminUserAuthUpdate,
): Promise<void> {
  const payload: { user_id: string; password?: string; email?: string } = { user_id: userId };
  if (update.password?.trim()) payload.password = update.password.trim();
  if (update.email?.trim()) payload.email = update.email.trim();

  if (!payload.password && !payload.email) {
    return;
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/update-user-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: { error?: string } = {};
  try {
    json = text ? (JSON.parse(text) as { error?: string }) : {};
  } catch {
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? 'update-user-password function not deployed'
          : text.slice(0, 200) || 'update_password_failed',
      );
    }
  }

  if (!res.ok) {
    throw new Error(json.error || text || 'update_password_failed');
  }
}
