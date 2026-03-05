'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return t.auth.errors.required;
    if (!/\S+@\S+\.\S+/.test(email)) return t.auth.errors.invalidEmail;
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

    // Simulated delay — no real email service is connected
    await new Promise<void>((resolve) => setTimeout(resolve, 1200));

    setIsLoading(false);
    setIsSuccess(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 dark:bg-[#1A1410] px-4 py-16">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card p-8">
          {/* Logo / heading */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <span className="text-accent-500 text-3xl">♦</span>
              <span className="block font-serif italic text-primary-700 dark:text-primary-400 text-2xl font-bold">
                Tango
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-warm-950 dark:text-warm-100">{t.auth.forgotPasswordTitle}</h1>
            <p className="text-warm-500 dark:text-warm-400 text-sm mt-1">{t.auth.forgotPasswordSubtitle}</p>
          </div>

          {isSuccess ? (
            /* Success state */
            <div className="text-center space-y-5">
              <div
                role="status"
                aria-live="polite"
                className="px-4 py-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 text-sm leading-relaxed"
              >
                {t.auth.forgotPasswordSuccess}
              </div>
              <Link
                href="/auth/login"
                className="inline-block text-sm text-primary-700 dark:text-primary-400 hover:text-primary-600 font-medium transition-colors"
              >
                {t.auth.backToLogin}
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              {/* Error alert */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-warm-800 dark:text-warm-200 mb-1.5"
                  >
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      {t.auth.loading}
                    </span>
                  ) : (
                    t.auth.forgotPasswordButton
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-warm-500 dark:text-warm-400">
                <Link
                  href="/auth/login"
                  className="text-primary-700 dark:text-primary-400 font-medium hover:text-primary-600 transition-colors"
                >
                  {t.auth.backToLogin}
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Back to home */}
        <p className="text-center mt-4">
          <Link href="/" className="text-xs text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 transition-colors">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
