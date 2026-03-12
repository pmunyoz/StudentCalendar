import { createContext } from 'react';
import type { User } from '@supabase/supabase-js';

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    userName: string;
    avatarUrl: string | null;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    userName: 'Invitado',
    avatarUrl: null,
    signOut: async () => { },
    refreshProfile: async () => { },
});
