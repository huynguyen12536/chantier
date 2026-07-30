import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { sendOtpEmail } from "../_shared/smtp.ts";
import { generateOtp, hashOtp, otpExpiresAt, resendAllowedAfter } from "../_shared/otp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendOtpRequest {
  email?: string;
  lang?: "fr" | "en";
}

async function findUserIdByEmail(
  supabaseAdmin: ReturnType<typeof createSupabaseAdmin>,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: SendOtpRequest = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const lang = body.lang === "en" ? "en" : "fr";

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "invalid_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createSupabaseAdmin();

    const userId = await findUserIdByEmail(supabaseAdmin, email);

    // Always return success to avoid email enumeration
    if (!userId) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: recentRows, error: recentError } = await supabaseAdmin
      .from("password_reset_otps")
      .select("created_at")
      .eq("email", email)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentError) {
      return new Response(JSON.stringify({ error: recentError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recent = recentRows?.[0] ?? null;

    if (recent?.created_at && !resendAllowedAfter(recent.created_at)) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(email, otp);

    const { error: insertError } = await supabaseAdmin.from("password_reset_otps").insert({
      email,
      otp_hash: otpHash,
      expires_at: otpExpiresAt(),
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendOtpEmail(email, otp, lang);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "server_error";
    const status = message === "mail_not_configured" ? 503 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
