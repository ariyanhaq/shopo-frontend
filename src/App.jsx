/**
 * @file App.jsx
 * @description Main application root component for Shopo with React Hot Toast integration.
 */
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#09090b',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: {
                    primary: '#00df89',
                    secondary: '#011812',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#f43f5e',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
            <AppRoutes />
          </ShopProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
