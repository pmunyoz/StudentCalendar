import { supabase } from "../lib/supabase";

export interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    birth_date: string | null;
    avatar_url: string | null;
    updated_at: string;
}

/**
 * Servicio para gestionar la información del usuario y su perfil.
 */
export const userService = {
    /**
     * Obtiene el perfil de un usuario invocando la Edge Function.
     * @param _userId ID del usuario (validado por JWT en el backend)
     */
    async getProfile(_userId: string): Promise<Profile | null> {
        const { data, error } = await supabase.functions.invoke('manage-profiles', {
            method: 'GET'
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        return data.data;
    },

    /**
     * Actualiza o crea el perfil del usuario mediante la Edge Function.
     * @param profile Datos del perfil a actualizar
     */
    async updateProfile(profile: Partial<Profile> & { id: string }): Promise<void> {
        const { data, error } = await supabase.functions.invoke('manage-profiles', {
            method: 'POST',
            body: profile
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
    },

    /**
     * Sube un avatar al almacenamiento de Supabase.
     * @param userId ID del usuario
     * @param file Archivo de imagen
     */
    async uploadAvatar(userId: string, file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    /**
     * Actualiza la información de autenticación del usuario.
     * @param updates Actualizaciones de email o password
     */
    async updateAuthUser(updates: { email?: string; password?: string }): Promise<void> {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
    }
};
