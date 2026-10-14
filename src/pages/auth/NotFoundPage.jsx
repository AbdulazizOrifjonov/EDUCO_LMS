import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-surface-light dark:bg-surface-dark transition-colors duration-200">
      <div className="w-full max-w-md text-center">
        {/* Large 404 display */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-surface-dark-tertiary border border-blue-100 dark:border-gray-800 flex items-center justify-center shadow-lg">
            <Compass className="w-12 h-12 text-brand-navy dark:text-blue-400 animate-spin-slow" />
          </div>
          <span className="absolute -bottom-2 px-3 py-1 bg-brand-navy text-white text-xs font-bold rounded-full shadow">
            404
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {t('errors.notFound', 'Page not found')}
        </h1>

        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
          The page you are looking for does not exist or has been moved to another location.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => navigate('/')}
            variant="primary"
            size="md"
            icon={Home}
            className="w-full sm:w-auto bg-brand-navy hover:bg-brand-navy-light text-white font-medium px-6 py-2.5 rounded-xl shadow-md"
          >
            Go Home
          </Button>

          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="md"
            icon={ArrowLeft}
            className="w-full sm:w-auto font-medium px-6 py-2.5 rounded-xl"
          >
            {t('common.back', 'Go Back')}
          </Button>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
          EDUCO LMS &bull; Educational Platform
        </div>
      </div>
    </div>
  );
}
