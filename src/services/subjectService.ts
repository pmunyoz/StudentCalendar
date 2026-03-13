import { supabase } from "../lib/supabase";
import { type Subject } from "./taskService";

/**
 * Servicio para gestionar las materias con Supabase.
 */
export const subjectService = {
    /**
     * Obtiene todas las materias de un usuario invocando la Edge Function.
     * @param _userId ID del usuario (validado por JWT en el backend)
     */
    async getSubjects(): Promise<Subject[]> {
        const { data, error } = await supabase.functions.invoke('manage-subjects', {
            method: 'GET'
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        return data.data || [];
    },

    /**
     * Crea una nueva materia mediante la Edge Function.
     * @param subject Datos de la materia
     */
    async createSubject(subject: { name: string; color: string; user_id: string }): Promise<Subject> {
        const { data, error } = await supabase.functions.invoke('manage-subjects', {
            method: 'POST',
            body: subject
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        return data.data;
    },

    /**
     * Actualiza una materia existente mediante la Edge Function.
     * @param subjectId ID de la materia
     * @param updates Campos a actualizar
     */
    async updateSubject(subjectId: string, updates: Partial<Subject>): Promise<Subject> {
        const { data, error } = await supabase.functions.invoke('manage-subjects', {
            method: 'PATCH',
            body: { id: subjectId, ...updates }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        return data.data;
    },

    /**
     * Elimina una materia mediante la Edge Function.
     * @param subjectId ID de la materia a eliminar
     */
    async deleteSubject(subjectId: string): Promise<void> {
        const { data, error } = await supabase.functions.invoke(`manage-subjects?id=${subjectId}`, {
            method: 'DELETE'
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
    },

    /**
     * Crea materias por defecto para un usuario.
     * @param userId ID del usuario
     */
    async createDefaultSubjects(userId: string): Promise<Subject[]> {
        const defaultSubjects = [
            { name: 'Matemáticas', color: 'blue', user_id: userId },
            { name: 'Historia', color: 'red', user_id: userId },
            { name: 'Literatura', color: 'green', user_id: userId }
        ];
        
        // Podríamos optimizar esto en el backend si fuera necesario, 
        // pero por ahora lo hacemos secuencialmente o con un endpoint masivo.
        const results = await Promise.all(
            defaultSubjects.map(s => this.createSubject(s))
        );
        return results;
    }
};
