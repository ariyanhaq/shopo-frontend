/**
 * @file PermissionGuard.jsx
 * @description Strict route guard component that verifies granular RBAC permissions before rendering page contents.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Store, LayoutDashboard } from 'lucide-react';

export default function PermissionGuard({ permission, requireAdmin = false, children }) {
  const { mongoUser, mongoShop } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const isOwner = mongoUser?.role === 'owner';
  const isManager = mongoUser?.role === 'manager';
  const userPerms = Array.isArray(mongoUser?.permissions) ? mongoUser.permissions : [];

  let isPermitted = false;
  if (requireAdmin) {
    isPermitted = isOwner || isManager;
  } else if (isOwner || isManager) {
    isPermitted = true;
  } else if (!permission) {
    isPermitted = true;
  } else if (Array.isArray(permission)) {
    isPermitted = permission.some((p) => userPerms.includes(p));
  } else {
    isPermitted = userPerms.includes(permission);
  }

  if (isPermitted) {
    return children;
  }

  const isGym = mongoShop?.business_type === 'gym';
  const defaultDashboard = isGym ? '/gym/dashboard' : '/dashboard';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-sm">
        <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
        {lang === 'bn' ? 'অ্যাক্সেস অনুমোদিত নয় (Access Restricted)' : 'Access Restricted'}
      </h2>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md mt-1.5 mb-6 font-normal">
        {lang === 'bn'
          ? 'এই ফিচার বা পেজটি ব্যবহার করার জন্য আপনার অ্যাকাউন্টে পর্যাপ্ত পারমিশন নেই। দোকান মালিকের সাথে যোগাযোগ করুন।'
          : 'You do not have permission to access this module. Even with the direct link, access is restricted by store policy.'}
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="text-xs font-semibold gap-1.5 cursor-pointer border-slate-200 dark:border-zinc-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'পেছনে যান' : 'Go Back'}</span>
        </Button>

        {userPerms.includes('pos') ? (
          <Link to="/pos">
            <Button className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold gap-1.5 cursor-pointer shadow-xs">
              <Store className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পিওএস ক্যাশ কাউন্টার' : 'Open POS'}</span>
            </Button>
          </Link>
        ) : (
          <Link to={defaultDashboard}>
            <Button className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold gap-1.5 cursor-pointer shadow-xs">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
