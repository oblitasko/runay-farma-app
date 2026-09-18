import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'No autorizado' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) {
    return json({ error: 'No autorizado' }, 401);
  }

  const { data: caller, error: profileError } = await userClient
    .from('profiles')
    .select('user_id, organization_id, role, is_active')
    .eq('user_id', authData.user.id)
    .single();

  if (profileError || !caller || caller.role !== 'owner' || caller.is_active === false) {
    return json({ error: 'Solo el dueño puede crear cajeros' }, 403);
  }

  let payload: { full_name?: string; email?: string; password?: string; store_id?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Solicitud inválida' }, 400);
  }

  const fullName = payload.full_name?.trim() ?? '';
  const email = payload.email?.trim().toLowerCase() ?? '';
  const password = payload.password ?? '';
  const storeId = payload.store_id?.trim() ?? '';

  if (!fullName || !email || !password || !storeId) {
    return json({ error: 'Nombre, correo, contraseña y local son obligatorios' }, 400);
  }
  if (password.length < 6) {
    return json({ error: 'La contraseña debe tener al menos 6 caracteres' }, 400);
  }

  const { data: store, error: storeError } = await userClient
    .from('stores')
    .select('id, organization_id')
    .eq('id', storeId)
    .eq('organization_id', caller.organization_id)
    .maybeSingle();

  if (storeError || !store) {
    return json({ error: 'El local no pertenece a la organización' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { error: pendingError } = await admin.from('staff_pending').upsert({
    email,
    organization_id: caller.organization_id,
    store_id: store.id,
    full_name: fullName,
  });
  if (pendingError) {
    return json({ error: 'No se pudo reservar el alta del cajero' }, 400);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    await admin.from('staff_pending').delete().eq('email', email);
    const message = createError?.message ?? '';
    if (message.toLowerCase().includes('already') || message.toLowerCase().includes('registered')) {
      return json({ error: 'Ese correo ya está registrado' }, 409);
    }
    if (message.toLowerCase().includes('database error')) {
      return json({ error: 'No se pudo crear el cajero. Revisa el correo y el local.' }, 400);
    }
    return json({ error: message || 'No se pudo crear el cajero' }, 400);
  }

  const { data: profile, error: loadError } = await admin
    .from('profiles')
    .select('id, user_id, organization_id, store_id, role, full_name, email, is_active')
    .eq('user_id', created.user.id)
    .single();

  if (loadError || !profile) {
    return json({ error: 'El cajero se creó pero no se encontró el perfil' }, 500);
  }

  return json({ profile });
});
