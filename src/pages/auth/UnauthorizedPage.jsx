import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import Button from '@/components/ui/Button';
import useAuth from '@/hooks/useAuth';
import { ROLES } from '@/lib/constants';

export default function UnauthorizedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleBackToDashboard = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const role = profile?.role || user?.user_metadata?.role || ROLES.STUDENT;
    switch (role) {
      case ROLES.OWNER:
        navigate('/owner');
        break;
      case ROLES.ADMIN:
        navigate('/admin');
        break;
      case ROLES.TEACHER:
        navigate('/teacher');
        break;
      case ROLES.STUDENT:
      default:
        navigate('/student');
        break;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-surface-light dark:bg-surface-dark transition-colors duration-200">
      <div className="w-full max-w-md text-center">
        {/* Lock / Shield Icon Graphic */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-24 h-24 rounded-3xl bg-red-50 dark:bg-red-950/40 border border-brand-red/20 flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-12 h-12 text-brand-red animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-red text-white flex items-center justify-center text-xs font-bold shadow">
            !
          </div>
        </div>

        {/* Code & Title */}
        <span className="block text-sm font-bold tracking-widest text-brand-red uppercase mb-1">
          403 Forbidden
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {t('errors.unauthorized', "You don't have permission")}
        </h1>

        {/* Descriptive message */}
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
          {t(
            'auth.unauthorizedDesc',
            'Your account does not possess the required role permissions to view this resource. Contact your system administrator if this is a mistake.'
          )}
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={handleBackToDashboard}
            variant="primary"
            size="md"
            icon={Home}
            className="w-full sm:w-auto bg-brand-navy hover:bg-brand-navy-light text-white font-medium px-6 py-2.5 rounded-xl shadow-md"
          >
            {t('nav.dashboard', 'Back to Dashboard')}
          </Button>

          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            size="md"
            icon={LogIn}
            className="w-full sm:w-auto font-medium px-6 py-2.5 rounded-xl"
          >
            {t('auth.login', 'Sign in with different account')}
          </Button>
        </div>

        {/* Footer info */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
          EDUCO LMS Security Guard &bull; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
