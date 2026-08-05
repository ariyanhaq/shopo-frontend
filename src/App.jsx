/**
 * @file App.jsx
 * @description Main application root component for Shopo.
 */
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes/AppRoutes';
import { AuthProvider } from '@/context/AuthContext';
import { ShopProvider } from '@/context/ShopContext';
import { LanguageProvider } from '@/context/LanguageContext';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ShopProvider>
            <AppRoutes />
          </ShopProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
