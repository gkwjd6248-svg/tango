'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Basic client-side validation
  function validate(): string | null {
    if (!email.trim()) return t.auth.errors.required;
    if (!/\S+@\S+\.\S+/.test(email)) return t.auth.errors.invalidEmail;
    if (!password) return t.auth.errors.required;
    if (password.length < 6) return t.auth.errors.passwordTooShort;
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : t.auth.errors.loginFailed;
      setError(msg || t.auth.errors.loginFailed);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 px-4 py-16">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card p-8">
          {/* Logo / heading */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <span className="text-accent-500 text-3xl">♦</span>
              <span className="block font-serif italic text-primary-700 text-2xl font-bold">
                Tango
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-warm-950">{t.auth.loginTitle}</h1>
            <p className="text-warm-500 text-sm mt-1">{t.auth.loginSubtitle}</p>
          </div>

          {/* Error alert */}
          {error && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-warm-800 mb-1.5">
                {t.auth.email}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.emailPlaceholder}
                className="input-field"
                disabled={isLoading}
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-warm-800 mb-1.5">
                {t.auth.password}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.passwordPlaceholder}
                className="input-field"
                disabled={isLoading}
                required
                aria-required="true"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t.auth.loading}
                </span>
              ) : (
                t.auth.loginButton
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-warm-500">
            {t.auth.noAccount}{' '}
            <Link
              href="/auth/register"
              className="text-primary-700 font-medium hover:text-primary-600 transition-colors"
            >
              {t.auth.registerLink}
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-4">
          <Link href="/" className="text-xs text-warm-400 hover:text-warm-600 transition-colors">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
