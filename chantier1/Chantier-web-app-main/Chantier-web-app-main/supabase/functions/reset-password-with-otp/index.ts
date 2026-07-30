import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { findAuthUserIdByEmail, verifyPasswordSignIn } from "../_shared/authUsers.ts";
import { hashOtp } from "../_shared/otp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ResetWithOtpRequest {
  email?: string;
  otp?: string;
  password?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ResetWithOtpRequest = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "invalid_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return new Response(JSON.stringify({ error: "invalid_otp" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "password_too_short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createSupabaseAdmin();

    const otpHash = await hashOtp(email, otp);
    const now = new Date().toISOString();

    const { data: otpRows, error: otpError } = await supabaseAdmin
      .from("password_reset_otps")
      .select("id")
      .eq("email", email)
      .eq("otp_hash", otpHash)
      .is("used_at", null)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1);

    const otpRow = otpRows?.[0] ?? null;

    if (otpError || !otpRow) {
      return new Response(JSON.stringify({ error: "invalid_or_expired_otp" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = await findAuthUserIdByEmail(supabaseAdmin, email);
    if (!userId) {
      return new Response(JSON.stringify({ error: "user_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    });

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message || "password_update_failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const loginWorks = await verifyPasswordSignIn(email, password);
    if (!loginWorks) {
      return new Response(JSON.stringify({ error: "password_update_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin
      .from("password_reset_otps")
      .update({ used_at: now })
      .eq("id", otpRow.id);

    await supabaseAdmin
      .from("password_reset_otps")
      .update({ used_at: now })
      .eq("email", email)
      .is("used_at", null);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "server_error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
