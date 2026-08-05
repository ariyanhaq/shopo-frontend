/**
 * @file MainLayout.jsx
 * @description Main public application layout wrapper with font awareness and horizontal scroll prevention.
 */
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function MainLayout() {
  const { lang } = useLanguage();

  return (
    <div className={`flex flex-col min-h-screen overflow-x-hidden w-full max-w-full ${lang === 'bn' ? 'font-bn' : ''}`}>
      <Navbar />
      <main className="flex-1 overflow-x-hidden w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
