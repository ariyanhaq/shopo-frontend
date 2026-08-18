/**
 * @file AuthAction.jsx
 * @description Universal handler for Firebase auth action links (email verification, password reset, etc.).
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { applyAuthActionCode } = useAuth();
  const { lang } = useLanguage();

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode') || searchParams.get('code');

  const [status, setStatus] = useState('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!mode || !oobCode) {
      navigate('/login', { replace: true });
      return;
    }

    if (mode === 'resetPassword') {
      navigate(`/reset-password?oobCode=${oobCode}`, { replace: true });
      return;
    }

    if (mode === 'verifyEmail') {
      const executeVerify = async () => {
        try {
          await applyAuthActionCode(oobCode);
          setStatus('success');
          toast.success(lang === 'bn' ? 'ইমেইল সফলভাবে ভেরিফাই হয়েছে!' : 'Email successfully verified!');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 1800);
        } catch (err) {
          console.error('Action code verification error:', err);
          setStatus('error');
          setErrorMsg(err.message || 'Verification link expired or already used.');
        }
      };
      executeVerify();
      return;
    }

    // Default fallback
    navigate('/login', { replace: true });
  }, [mode, oobCode, navigate, applyAuthActionCode, lang]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFD] p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {status === 'processing' && (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#00df89] mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">
              {lang === 'bn' ? 'অনুরোধটি যাচাই করা হচ্ছে...' : 'Processing your request...'}
            </h2>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {lang === 'bn' ? 'ইমেইল ভেরিফিকেশন সফল!' : 'Email Verified Successfully!'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'bn' ? 'লগইন পেজে নিয়ে যাওয়া হচ্ছে...' : 'Redirecting to login...'}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {lang === 'bn' ? 'ভেরিফিকেশন সম্পন্ন করা যায়নি' : 'Unable to complete verification'}
            </h2>
            <p className="text-xs text-rose-600">{errorMsg}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl bg-[#00df89] text-[#011812] font-bold text-xs shadow-md"
            >
              {lang === 'bn' ? 'লগইনে ফিরে যান' : 'Go to Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
