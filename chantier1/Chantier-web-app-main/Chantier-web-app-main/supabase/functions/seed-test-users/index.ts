import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TEST_USERS = [
  { email: "admin@test.com", password: "123456", nom: "Admin", prenom: "Test", matricule: "ADM001", role: "admin" },
  { email: "administratif@test.com", password: "123456", nom: "Administratif", prenom: "Test", matricule: "ADM002", role: "administratif" },
  { email: "chef@test.com", password: "123456", nom: "Chef", prenom: "Equipe", matricule: "CHF001", role: "chef_equipe" },
  { email: "ouvrier@test.com", password: "123456", nom: "Ouvrier", prenom: "Test", matricule: "OUV001", role: "ouvrier" },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const user of TEST_USERS) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u: any) => u.email === user.email);

      if (existing) {
        // Delete existing user and profile to recreate cleanly
        await supabaseAdmin.from("profiles").delete().eq("id", existing.id);
        await supabaseAdmin.auth.admin.deleteUser(existing.id);
      }

      // Create auth user via Admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        results.push({ email: user.email, success: false, error: authError.message });
        continue;
      }

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          matricule: user.matricule,
          role: user.role,
        });

      if (profileError) {
        results.push({ email: user.email, success: false, error: profileError.message });
        continue;
      }

      results.push({ email: user.email, success: true });
    }

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
