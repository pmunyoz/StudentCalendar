import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "supabase";

/**
 * Manejador principal de la Edge Function 'manage-references'.
 * Obtiene exámenes y ejercicios para vincular a tareas.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Obtener exámenes y ejercicios en paralelo
    const [examsResult, exercisesResult] = await Promise.all([
      supabaseClient.from('exams').select('id, title').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabaseClient.from('exercises').select('id, title').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);

    if (examsResult.error) throw examsResult.error;
    if (exercisesResult.error) throw exercisesResult.error;

    const mentionables = [
      ...(examsResult.data || []).map(e => ({ ...e, type: 'exam' })),
      ...(exercisesResult.data || []).map(e => ({ ...e, type: 'exercise' }))
    ];

    return new Response(JSON.stringify({ success: true, data: mentionables }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err: unknown) {
    const error = err as Error;
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
