import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from './authContextDef';

/**
 * Proveedor de autenticación que gestiona el estado del usuario de Supabase
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Invitado');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('first_name, avatar_url')
                .eq('id', userId)
                .single();

            if (data && !error) {
                if (data.first_name) setUserName(data.first_name);

                // Añadir cache buster si existe URL para forzar actualización visual
                const urlWithBuster = data.avatar_url
                    ? `${data.avatar_url.split('?')[0]}?t=${Date.now()}`
                    : null;
                setAvatarUrl(urlWithBuster);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    useEffect(() => {
        // Verificar sesión actual
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                setUserName(currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario');
                fetchProfile(currentUser.id);
            }
            setLoading(false);
        });

        // Escuchar cambios en la autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                setUserName(currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario');
                fetchProfile(currentUser.id);
            } else {
                setUserName('Invitado');
                setAvatarUrl(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, userName, avatarUrl, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
