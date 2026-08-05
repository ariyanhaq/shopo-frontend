/**
 * @file AuthLayout.jsx
 * @description Authentication pages layout wrapper with font awareness.
 */
import { Outlet } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';

export default function AuthLayout() {
  const { lang } = useLanguage();

  return (
    <div className={`min-h-screen bg-[#FAFBFD] text-slate-800 font-sans selection:bg-[#00df89] selection:text-[#011812] ${lang === 'bn' ? 'font-bn' : ''}`}>
      <Outlet />
    </div>
  );
}
