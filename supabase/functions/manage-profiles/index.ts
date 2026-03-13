import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "supabase";


/**
 * Manejador principal de la Edge Function 'manage-profiles'.
 * Centraliza las operaciones de perfil de usuario.
 */
Deno.serve(async (req) => {
  // Manejo de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { method } = req;
    let result;

    switch (method) {
      case 'GET': {
        // Obtener perfil del usuario
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      case 'POST': {
        // Actualizar perfil (Upsert)
        const body = await req.json();
        
        // El id siempre debe ser el del usuario autenticado por seguridad
        const { data, error } = await supabaseClient
          .from('profiles')
          .upsert({
            ...body,
            id: user.id,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      default:
        return new Response(JSON.stringify({ success: false, error: 'Método no permitido' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
    });

  } catch (err: unknown) {
    const error = err as Error;
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
});
