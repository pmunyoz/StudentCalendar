import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "supabase";

/**
 * Interfaz para la respuesta de la función.
 */
interface ResponseData {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Manejador principal de la Edge Function 'manage-subjects'.
 * Centraliza las operaciones CRUD para la tabla 'subjects'.
 */
Deno.serve(async (req) => {
  // Manejo de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  // Manejo de Salud / Test (Sin Auth)
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('health') === 'true') {
    return new Response(JSON.stringify({ success: true, message: 'Subjects API is running' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    // Configuración del cliente de Supabase con el token del usuario
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Obtener información del usuario autenticado
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
        // Obtener materias del usuario
        const { data, error } = await supabaseClient
          .from('subjects')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (error) throw error;
        result = data;
        break;
      }

      case 'POST': {
        // Crear nueva materia
        const body = await req.json();
        
        // Validación básica OWASP: Sanear/Validar campos obligatorios
        if (!body.name || body.name.trim().length === 0) {
          throw new Error('El nombre de la materia es obligatorio');
        }

        const { data, error } = await supabaseClient
          .from('subjects')
          .insert({
            ...body,
            user_id: user.id
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      case 'PATCH': {
        // Actualizar materia existente
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) throw new Error('ID de materia no proporcionado');

        const { data, error } = await supabaseClient
          .from('subjects')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      case 'DELETE': {
        // Eliminar materia
        const id = url.searchParams.get('id');

        if (!id) throw new Error('ID de materia no proporcionado');

        const { error } = await supabaseClient
          .from('subjects')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        result = { id, message: 'Materia eliminada' };
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

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
});
