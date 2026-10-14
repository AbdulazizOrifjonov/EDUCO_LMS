import React, { useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, Check, Sparkles, ShieldAlert, Shield, ShieldCheck } from 'lucide-react';

/**
 * Evaluates password strength based on:
 * - Uppercase (A-Z)
 * - Lowercase (a-z)
 * - Number (0-9)
 * - Special character (!@#$%^&*...)
 * - Minimum length (8+)
 */
export function evaluatePasswordStrength(password = '') {
  const pwd = String(password || '');
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const hasMinLen = pwd.length >= 8;

  const checksCount = [hasUpper, hasLower, hasNumber, hasSpecial, hasMinLen].filter(Boolean).length;
  const allMet = hasUpper && hasLower && hasNumber && hasSpecial && hasMinLen;

  let level = 'empty'; // 'empty' | 'weak' | 'medium' | 'strong'
  let score = 0; // 0 to 4

  if (pwd.length > 0) {
    if (allMet) {
      level = 'strong';
      score = 4;
    } else if (checksCount >= 3 && pwd.length >= 6) {
      // e.g. "Abdulaziz17" -> hasUpper + hasLower + hasNumber + hasMinLen (missing special char) -> medium (orange/sabzirang)
      level = 'medium';
      score = 2;
      if (checksCount === 4) score = 3;
    } else {
      level = 'weak';
      score = 1;
    }
  }

  return {
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    hasMinLen,
    checksCount,
    allMet,
    level,
    score,
  };
}

export function generateStrongPassword() {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const specials = '!@#$%&*';
  const pick = (str) => str[Math.floor(Math.random() * str.length)];
  const base = [
    pick(uppers),
    pick(lowers),
    pick(lowers),
    pick(lowers),
    pick(specials),
    pick(numbers),
    pick(numbers),
    pick(uppers),
    pick(numbers),
  ];
  return base.join('');
}

const PasswordStrengthInput = forwardRef(function PasswordStrengthInput(
  {
    label,
    value = '',
    onChange,
    onValueChange,
    placeholder = 'Masalan: Educo#2026',
    error,
    required = false,
    showGenerator = true,
    className = '',
    id,
    name,
    ...rest
  },
  ref
) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const strength = evaluatePasswordStrength(value);

  const handleInputChange = (e) => {
    if (onChange) onChange(e);
    if (onValueChange) onValueChange(e.target.value);
  };

  const handleGenerate = () => {
    const generated = generateStrongPassword();
    if (onValueChange) {
      onValueChange(generated);
    }
    if (onChange) {
      onChange({ target: { name, value: generated } });
    }
    setShowPassword(true);
  };

  // Dynamic border & ring color based on strength
  const getInputBorderClasses = () => {
    if (error) {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
    }
    if (strength.level === 'weak') {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500/25 dark:border-red-500';
    }
    if (strength.level === 'medium') {
      return 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/25 dark:border-amber-500';
    }
    if (strength.level === 'strong') {
      return 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/25 dark:border-emerald-500';
    }
    return 'border-gray-300 dark:border-gray-700 focus:border-[#123D78] dark:focus:border-blue-500 focus:ring-[#123D78]/20';
  };

  const getSegmentColor = (index) => {
    if (strength.level === 'empty') return 'bg-gray-200 dark:bg-gray-700';
    if (strength.level === 'weak') {
      return index === 0 ? 'bg-red-500 shadow-sm shadow-red-500/40' : 'bg-gray-200 dark:bg-gray-700';
    }
    if (strength.level === 'medium') {
      return index < strength.score
        ? 'bg-amber-500 shadow-sm shadow-amber-500/40'
        : 'bg-gray-200 dark:bg-gray-700';
    }
    if (strength.level === 'strong') {
      return 'bg-emerald-500 shadow-sm shadow-emerald-500/40';
    }
    return 'bg-gray-200 dark:bg-gray-700';
  };

  const getStatusLabel = () => {
    if (strength.level === 'weak') {
      return {
        text: t('users.pwdWeak', 'Zaif parol (Qizil — xavfsiz emas)'),
        color: 'text-red-600 dark:text-red-400',
        Icon: ShieldAlert,
      };
    }
    if (strength.level === 'medium') {
      return {
        text: t('users.pwdMedium', "O'rtacha parol (Sabzirang — belgi yoki harf qo'shing)"),
        color: 'text-amber-600 dark:text-amber-400',
        Icon: Shield,
      };
    }
    if (strength.level === 'strong') {
      return {
        text: t('users.pwdStrong', 'Kuchli va xavfsiz parol (Yashil)'),
        color: 'text-emerald-600 dark:text-emerald-400',
        Icon: ShieldCheck,
      };
    }
    return null;
  };

  const statusInfo = getStatusLabel();

  const criteriaList = [
    { key: 'upper', met: strength.hasUpper, label: t('users.reqUpper', 'Katta harf (A-Z)') },
    { key: 'lower', met: strength.hasLower, label: t('users.reqLower', 'Kichik harf (a-z)') },
    { key: 'number', met: strength.hasNumber, label: t('users.reqNumber', 'Son (0-9)') },
    { key: 'special', met: strength.hasSpecial, label: t('users.reqSpecial', 'Belgi (!@#$)') },
    { key: 'length', met: strength.hasMinLen, label: t('users.reqLength', '8+ belgi') },
  ];

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {/* Label & Optional Generator Button */}
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={id || name}
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-brand-red ml-1">*</span>}
          </label>
        )}

        {showGenerator && (
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#123D78] hover:text-[#F12D3A] dark:text-blue-400 dark:hover:text-amber-400 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('users.generatePassword', 'Avto-parol')}</span>
          </button>
        )}
      </div>

      {/* Input Box */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
          <Lock className="w-4 h-4" />
        </div>

        <input
          ref={ref}
          id={id || name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`w-full rounded-xl border bg-white dark:bg-surface-dark-secondary text-gray-900 dark:text-white text-sm py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 transition-all font-medium ${getInputBorderClasses()}`}
          {...rest}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Live Strength Progress Bar (4 segments: Red -> Orange -> Green) */}
      <div className="space-y-1.5 pt-0.5">
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`h-full rounded-full transition-all duration-300 ${getSegmentColor(idx)}`}
            />
          ))}
        </div>

        {/* Status Message */}
        {statusInfo && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${statusInfo.color}`}>
            <statusInfo.Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{statusInfo.text}</span>
          </div>
        )}

        {/* Criteria Pills */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {criteriaList.map((item) => (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                item.met
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : value.length > 0
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
                  : 'bg-gray-100 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              <Check className={`w-3 h-3 ${item.met ? 'opacity-100' : 'opacity-30'}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
});

export default PasswordStrengthInput;
