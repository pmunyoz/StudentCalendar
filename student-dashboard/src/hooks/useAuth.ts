import { useContext } from 'react';
import { AuthContext } from '../context/authContextDef';

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => useContext(AuthContext);
