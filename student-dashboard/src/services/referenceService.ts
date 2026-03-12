import { supabase } from "../lib/supabase";

export interface Mentionable {
    id: string;
    title: string;
    type: 'exam' | 'exercise';
}

/**
 * Servicio para obtener referencias (exámenes y ejercicios) para vincular tareas.
 */
export const referenceService = {
    /**
     * Obtiene todos los exámenes y ejercicios de un usuario invocando la Edge Function.
     * @param _userId ID del usuario (validado por JWT en el backend)
     */
    async getMentionables(_userId: string): Promise<Mentionable[]> {
        const { data, error } = await supabase.functions.invoke('manage-references', {
            method: 'GET'
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        
        return data.data || [];
    }
};
