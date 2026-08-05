import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.58.0";

export async function findAuthUserIdByEmail(
  supabaseAdmin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const match = data.users.find((user) => user.email?.trim().toLowerCase() === normalized);
    if (match?.id) {
      return match.id;
    }

    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return profile?.id ?? null;
}

export async function verifyPasswordSignIn(
  email: string,
  password: string,
): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) {
    return false;
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  return !error;
}
