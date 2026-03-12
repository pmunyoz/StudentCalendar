import { supabase } from "../lib/supabase";

/**
 * Servicio para gestionar la autenticación de usuarios.
 */
export const authService = {
    /**
     * Inicia sesión con email y contraseña.
     */
    async signIn(email: string, password: string) {
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    },

    /**
     * Registra un nuevo usuario con email y contraseña.
     */
    async signUp(email: string, password: string) {
        return await supabase.auth.signUp({
            email,
            password,
        });
    },

    /**
     * Cierra la sesión del usuario actual.
     */
    async signOut() {
        return await supabase.auth.signOut();
    },

    /**
     * Obtiene el usuario actual si existe.
     */
    /**
     * Obtiene la sesión actual.
     */
    async getSession() {
        return await supabase.auth.getSession();
    },

    /**
     * Escucha cambios en el estado de autenticación.
     */
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    }
};
