// Supabase Edge Function · admin-account
// Gestión de cuentas (crear, actualizar, cambiar contraseña, eliminar)
// Solo accesible para usuarios con role = 'ADMIN' en public.profiles.
//
// Deploy: supabase functions deploy admin-account --no-verify-jwt
// (La función valida el JWT manualmente con el cliente service role.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" }
  });
}

function validRole(role: unknown) {
  return ["ADMIN", "PRESIDENT", "PLAYER", "FAN"].includes(String(role));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Faltan variables de entorno de Supabase." }, 500);

    const authorization = request.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Falta el token de sesión." }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData?.user) return json({ error: "Sesión no válida." }, 401);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError) return json({ error: profileError.message }, 400);
    if (profile?.role !== "ADMIN") {
      return json({ error: "Solo el organizador puede gestionar cuentas." }, 403);
    }

    const body = await request.json();
    const action = String(body.action || "");
    const accountId = body.accountId ? String(body.accountId) : "";

    if (action === "create") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const name = String(body.name || "").trim();
      const role = validRole(body.role) ? String(body.role) : "FAN";
      if (!email || !password) return json({ error: "Correo y contraseña son obligatorios." }, 400);
      if (password.length < 8) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name || email.split("@")[0],
          role,
          team_id: body.teamId || null,
          player_id: body.playerId || null
        }
      });
      if (createError) return json({ error: createError.message }, 400);

      const userId = created.user?.id;
      if (!userId) return json({ error: "No se pudo crear el usuario." }, 500);

      const { error: upsertError } = await admin.from("profiles").upsert({
        id: userId,
        email,
        name: name || email.split("@")[0],
        role,
        team_id: body.teamId || null,
        player_id: body.playerId || null
      });
      if (upsertError) return json({ error: upsertError.message }, 400);

      return json({ ok: true, accountId: userId });
    }

    if (!accountId) return json({ error: "Falta el identificador de la cuenta." }, 400);

    if (action === "update") {
      const role = validRole(body.role) ? String(body.role) : "FAN";
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      const { error: updateError } = await admin.auth.admin.updateUserById(accountId, {
        ...(email ? { email, email_confirm: true } : {}),
        user_metadata: {
          name: name || undefined,
          role,
          team_id: body.teamId || null,
          player_id: body.playerId || null
        }
      });
      if (updateError) return json({ error: updateError.message }, 400);

      const { error: profileUpdateError } = await admin
        .from("profiles")
        .update({
          ...(email ? { email } : {}),
          ...(name ? { name } : {}),
          role,
          team_id: body.teamId || null,
          player_id: body.playerId || null
        })
        .eq("id", accountId);
      if (profileUpdateError) return json({ error: profileUpdateError.message }, 400);

      return json({ ok: true, accountId });
    }

    if (action === "set_password") {
      const password = String(body.password || "");
      if (password.length < 8) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);
      const { error: passwordError } = await admin.auth.admin.updateUserById(accountId, { password });
      if (passwordError) return json({ error: passwordError.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete") {
      const { error: deleteError } = await admin.auth.admin.deleteUser(accountId);
      if (deleteError) return json({ error: deleteError.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Acción no soportada." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Error inesperado." }, 500);
  }
});
