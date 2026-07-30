import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin by checking their session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();
    if (callerProfile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent admin from deleting themselves
    if (user_id === caller.id) {
      return new Response(JSON.stringify({ error: "Impossible de supprimer votre propre compte" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: chefZones } = await supabaseAdmin
      .from("zones_equipe")
      .select("id")
      .eq("chef_equipe_id", user_id)
      .limit(1);

    if (chefZones && chefZones.length > 0) {
      return new Response(
        JSON.stringify({
          error:
            "Impossible de supprimer cet utilisateur : il est encore chef d'au moins une zone d'équipe. Réassignez la zone ou supprimez-la d'abord dans la gestion.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: avatarObjects } = await supabaseAdmin.storage.from("avatars").list(user_id);
    if (avatarObjects?.length) {
      const paths = avatarObjects.map((obj: { name: string }) => `${user_id}/${obj.name}`);
      const { error: storageError } = await supabaseAdmin.storage.from("avatars").remove(paths);
      if (storageError) {
        console.warn("[delete-user] avatar storage cleanup failed", storageError.message);
      }
    }

    const { data: pendingDivers, error: pendingDiversError } = await supabaseAdmin
      .from("chantiers")
      .select("id")
      .eq("created_by", user_id)
      .eq("source", "divers")
      .eq("divers_statut", "en_attente");
    if (pendingDiversError) throw pendingDiversError;

    for (const chantier of pendingDivers ?? []) {
      const chantierId = chantier.id as string;
      await supabaseAdmin.from("declarations_heures").delete().eq("chantier_id", chantierId);
      await supabaseAdmin.from("periodes_travail").delete().eq("chantier_id", chantierId);
      await supabaseAdmin.from("affectations_chantiers").delete().eq("chantier_id", chantierId);
      await supabaseAdmin.from("zones_chantiers").delete().eq("chantier_id", chantierId);
      const { error: deleteChantierError } = await supabaseAdmin
        .from("chantiers")
        .delete()
        .eq("id", chantierId);
      if (deleteChantierError) throw deleteChantierError;
    }

    const { error: reassignCreatorError } = await supabaseAdmin
      .from("chantiers")
      .update({ created_by: caller.id })
      .eq("created_by", user_id)
      .eq("source", "divers")
      .in("divers_statut", ["approuve", "rejete"]);
    if (reassignCreatorError) throw reassignCreatorError;

    const { error: reassignReviewerError } = await supabaseAdmin
      .from("chantiers")
      .update({ divers_reviewed_by: caller.id })
      .eq("divers_reviewed_by", user_id);
    if (reassignReviewerError) throw reassignReviewerError;

    // Delete from auth.users — cascades to profiles ; affectations.chef_equipe_id → SET NULL ;
    // déclarations / périodes liées au user sont en CASCADE depuis profiles (données de l'utilisateur).
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const raw = error instanceof Error ? error.message : String(error ?? "");
    let message = raw;
    if (raw.includes("periodes_travail") && raw.includes("does not exist")) {
      message =
        "Erreur base de données lors de la suppression (trigger periodes_travail). Contactez l'administrateur pour appliquer la migration fix_auth_delete_user_search_path.";
    } else if (raw.includes("Database error deleting user")) {
      message =
        "Impossible de supprimer cet utilisateur : des données liées bloquent encore la suppression. Vérifiez qu'il n'est pas chef d'une zone d'équipe.";
    } else if (raw.includes("violates foreign key constraint")) {
      message =
        "Impossible de supprimer cet utilisateur : des enregistrements liés existent encore dans la base.";
    } else if (raw.includes("chantiers_divers_fields_consistent")) {
      message =
        "Impossible de supprimer cet utilisateur : des chantiers divers liés bloquent la suppression. Appliquez la migration fix_delete_user_divers_chantiers puis redéployez delete-user.";
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
