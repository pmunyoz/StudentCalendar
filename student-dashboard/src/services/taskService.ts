import { supabase } from "../lib/supabase";

/**
 * Tipos para las materias y tareas
 */
export interface Subject {
    id: string;
    name: string;
    color: string;
}

export interface Task {
    id: string;
    title: string;
    completed: boolean;
    due_date: string | null;
    subject_id: string | null;
    linked_id: string | null;
    linked_type: 'exam' | 'exercise' | null;
    subject?: Subject;
    created_at: string;
    user_id: string;
    linked_title?: string;
}

/**
 * Servicio para gestionar las operaciones de tareas con la Edge Function 'manage-tasks'.
 * Centraliza la lógica en el backend para permitir escalabilidad y soporte móvil.
 */
export const taskService = {
    /**
     * Obtiene todas las tareas del usuario invocando la Edge Function.
     * @param _userId ID del usuario (el backend lo valida mediante JWT)
     */
    async getTasks(_userId: string): Promise<Task[]> {
        const { data, error } = await supabase.functions.invoke('manage-tasks', {
            method: 'GET'
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        
        return data.data || [];
    },

    /**
     * Crea una nueva tarea mediante la Edge Function.
     * @param task Objeto con los datos de la tarea
     */
    async createTask(task: Partial<Task>): Promise<Task> {
        const { data, error } = await supabase.functions.invoke('manage-tasks', {
            method: 'POST',
            body: task
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);

        return data.data;
    },

    /**
     * Actualiza una tarea existente mediante la Edge Function.
     * @param taskId ID de la tarea a actualizar
     * @param updates Campos a actualizar
     */
    async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
        const { data, error } = await supabase.functions.invoke('manage-tasks', {
            method: 'PATCH',
            body: { id: taskId, ...updates }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);

        return data.data;
    },

    /**
     * Elimina una tarea mediante su ID invocando la Edge Function.
     * @param taskId ID de la tarea a eliminar
     */
    async deleteTask(taskId: string): Promise<void> {
        const { data, error } = await supabase.functions.invoke(`manage-tasks?id=${taskId}`, {
            method: 'DELETE'
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
    }
};
