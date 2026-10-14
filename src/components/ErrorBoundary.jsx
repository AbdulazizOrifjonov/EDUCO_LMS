import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#101827] flex items-center justify-center p-6 text-gray-900 dark:text-gray-100">
          <div className="max-w-md w-full bg-white dark:bg-[#1a2332] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#F12D3A] flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                EDUCO LMS &bull; Tizimda kutilmagan xatolik
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sahifani yuklashda xatolik yuz berdi. Sahifani qayta yangilang yoki qayta tizimga kiring.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800/80 text-left text-xs font-mono text-red-600 dark:text-red-400 overflow-x-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#123D78] text-white hover:bg-[#1a4f9a] text-sm font-semibold transition-colors shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Qayta yuklash
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 text-sm font-medium transition-colors"
              >
                Keshni tozalash & Kirish
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
