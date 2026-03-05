'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/lib/i18n';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '';
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '';

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Auth?: {
        login: (opts: {
          success: (authObj: { access_token: string }) => void;
          fail: (err: unknown) => void;
        }) => void;
      };
    };
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void;
        signIn: () => Promise<{
          authorization: { id_token: string };
        }>;
      };
    };
  }
}

interface SocialLoginButtonsProps {
  onError?: (msg: string) => void;
}

export function SocialLoginButtons({ onError }: SocialLoginButtonsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const socialLogin = useAuthStore((s) => s.socialLogin);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleSocialSuccess = async (
    provider: 'google' | 'kakao' | 'naver' | 'apple',
    token: string,
  ) => {
    setLoadingProvider(provider);
    try {
      const result = await socialLogin({ provider, token });
      if (result.isNewUser) {
        router.push('/profile?complete=1');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: string }).message)
          : t.auth.errors.loginFailed;
      onError?.(msg);
    } finally {
      setLoadingProvider(null);
    }
  };

  // --- Google ---
  const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
    if (credentialResponse.credential) {
      handleSocialSuccess('google', credentialResponse.credential);
    }
  };

  // --- Kakao ---
  const handleKakaoLogin = () => {
    if (!window.Kakao?.isInitialized()) {
      window.Kakao?.init(KAKAO_JS_KEY);
    }
    window.Kakao?.Auth?.login({
      success: (authObj: { access_token: string }) => {
        handleSocialSuccess('kakao', authObj.access_token);
      },
      fail: () => onError?.(t.auth.errors.loginFailed),
    });
  };

  // --- Naver ---
  const handleNaverLogin = () => {
    const STATE = Math.random().toString(36).substring(2);
    const callbackUrl = `${window.location.origin}/auth/naver-callback`;
    const url = `https://nid.naver.com/oauth2.0/authorize?response_type=token&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${STATE}`;

    const popup = window.open(url, 'naver-login', 'width=500,height=600');

    const handler = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.naverToken) {
        window.removeEventListener('message', handler);
        popup?.close();
        handleSocialSuccess('naver', event.data.naverToken);
      }
    };
    window.addEventListener('message', handler);
  };

  // --- Apple ---
  const handleAppleLogin = () => {
    window.AppleID?.auth
      .signIn()
      .then((response) => {
        handleSocialSuccess('apple', response.authorization.id_token);
      })
      .catch(() => {
        onError?.(t.auth.errors.loginFailed);
      });
  };

  const isLoading = loadingProvider !== null;

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-warm-200 dark:border-warm-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-warm-900 text-warm-400 dark:text-warm-500">
            {t.auth.orContinueWith}
          </span>
        </div>
      </div>

      {/* Google */}
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <div className="flex justify-center [&>div]:w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => onError?.(t.auth.errors.loginFailed)}
              theme="outline"
              size="large"
              width="400"
              text="continue_with"
            />
          </div>
        </GoogleOAuthProvider>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onError?.('Google Client ID not configured')}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-800 text-warm-800 dark:text-warm-200 hover:bg-warm-50 dark:hover:bg-warm-700 transition-colors"
        >
          <GoogleIcon />
          {t.auth.continueWithGoogle}
        </button>
      )}

      {/* Kakao */}
      <button
        type="button"
        onClick={handleKakaoLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#FEE500', color: '#000000D9' }}
      >
        <KakaoIcon />
        {loadingProvider === 'kakao' ? t.auth.loading : t.auth.continueWithKakao}
      </button>

      {/* Naver */}
      <button
        type="button"
        onClick={handleNaverLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#03C75A' }}
      >
        <NaverIcon />
        {loadingProvider === 'naver' ? t.auth.loading : t.auth.continueWithNaver}
      </button>

      {/* Apple */}
      <button
        type="button"
        onClick={handleAppleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium bg-black text-white dark:bg-white dark:text-black transition-colors hover:opacity-90 disabled:opacity-50"
      >
        <AppleIcon />
        {loadingProvider === 'apple' ? t.auth.loading : t.auth.continueWithApple}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path
        d="M10 2C5.03 2 1 5.13 1 8.97c0 2.49 1.66 4.67 4.15 5.9-.13.47-.83 3.02-.86 3.22 0 0-.02.15.08.21.1.06.21.01.21.01.28-.04 3.24-2.14 3.75-2.5.55.08 1.11.12 1.67.12 4.97 0 9-3.13 9-6.97S14.97 2 10 2"
        fill="#000000D9"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path d="M13.5 10.6L6.3 2H2v16h4.5V9.4L13.7 18H18V2h-4.5v8.6z" fill="white" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M15.07 10.68c-.02-2.08 1.7-3.08 1.78-3.13-.97-1.42-2.48-1.61-3.01-1.63-1.28-.13-2.5.75-3.15.75-.65 0-1.65-.73-2.71-.71-1.4.02-2.68.81-3.4 2.06-1.45 2.52-.37 6.25 1.04 8.3.69 1 1.51 2.12 2.59 2.08 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.71.65 1.12-.02 1.83-1.02 2.51-2.02.79-1.16 1.12-2.28 1.14-2.34-.02-.01-2.18-.84-2.2-3.33zM13.01 4.38c.57-.7.96-1.66.85-2.63-.82.03-1.82.55-2.41 1.24-.53.61-.99 1.59-.86 2.52.91.07 1.85-.46 2.41-1.13z" />
    </svg>
  );
}
