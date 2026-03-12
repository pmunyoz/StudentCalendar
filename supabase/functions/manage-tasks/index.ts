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
 * Manejador principal de la Edge Function 'manage-tasks'.
 * Centraliza las operaciones CRUD para la tabla 'tasks'.
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
    return new Response(JSON.stringify({ success: true, message: 'API is running' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    // Debug: Log headers
    console.log("Authorization Header:", req.headers.get('Authorization') ? "Present" : "Missing");

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
      console.error("Auth Error:", userError?.message || "No user found");
      return new Response(JSON.stringify({ success: false, error: 'No autorizado: ' + (userError?.message || "Token inválido") }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log("Authenticated User ID:", user.id);

    const { method } = req;
    let result;

    switch (method) {
      case 'GET': {
        // Obtener tareas del usuario
        const { data, error } = await supabaseClient
          .from('tasks')
          .select('*, subject:subjects(*)')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true, nullsFirst: false });

        if (error) throw error;
        result = data;
        break;
      }

      case 'POST': {
        // Crear nueva tarea
        const body = await req.json();

        // Validación básica OWASP: Sanear/Validar campos obligatorios
        if (!body.title || body.title.trim().length === 0) {
          throw new Error('El título es obligatorio');
        }

        const { data, error } = await supabaseClient
          .from('tasks')
          .insert({
            ...body,
            user_id: user.id, // Forzar ID del usuario autenticado
            created_at: new Date().toISOString()
          })
          .select('*, subject:subjects(*)')
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      case 'PATCH': {
        // Actualizar tarea existente
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) throw new Error('ID de tarea no proporcionado');

        const { data, error } = await supabaseClient
          .from('tasks')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id) // Seguridad: Solo el dueño puede editar
          .select('*, subject:subjects(*)')
          .single();

        if (error) throw error;
        result = data;
        break;
      }

      case 'DELETE': {
        // Eliminar tarea
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) throw new Error('ID de tarea no proporcionado');

        const { error } = await supabaseClient
          .from('tasks')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id); // Seguridad: Solo el dueño puede eliminar

        if (error) throw error;
        result = { id, message: 'Tarea eliminada' };
        break;
      }

      default:
        return new Response(JSON.stringify({ success: false, error: 'Método no permitido' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
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
