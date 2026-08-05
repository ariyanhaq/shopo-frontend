/**
 * @file AuthContext.jsx
 * @description Context API provider placeholder for authentication state.
 */
import { createContext } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}
