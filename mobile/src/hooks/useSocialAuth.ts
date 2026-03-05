import { Alert, Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../store/useAuthStore';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
});

WebBrowser.maybeCompleteAuthSession();

const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID || '';

const naverDiscovery = {
  authorizationEndpoint: 'https://nid.naver.com/oauth2.0/authorize',
  tokenEndpoint: 'https://nid.naver.com/oauth2.0/token',
};

export function useSocialAuth() {
  const socialLogin = useAuthStore((s) => s.socialLogin);

  const loginWithGoogle = async (): Promise<{ isNewUser?: boolean } | null> => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = (userInfo as any).data?.idToken || (userInfo as any).idToken;
      if (!idToken) {
        Alert.alert('Error', 'Failed to get Google ID token');
        return null;
      }
      return await socialLogin({ provider: 'google', token: idToken });
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Google Login Failed', error.message || 'Please try again');
      }
      return null;
    }
  };

  const loginWithKakao = async (): Promise<{ isNewUser?: boolean } | null> => {
    try {
      const result = await KakaoLogin.login();
      if (result.accessToken) {
        return await socialLogin({
          provider: 'kakao',
          token: result.accessToken,
        });
      }
      return null;
    } catch (error: any) {
      Alert.alert('Kakao Login Failed', error.message || 'Please try again');
      return null;
    }
  };

  const loginWithNaver = async (): Promise<{ isNewUser?: boolean } | null> => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'tango' });
      const request = new AuthSession.AuthRequest({
        clientId: NAVER_CLIENT_ID,
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
        scopes: [],
      });
      const result = await request.promptAsync(naverDiscovery);
      if (
        result.type === 'success' &&
        result.authentication?.accessToken
      ) {
        return await socialLogin({
          provider: 'naver',
          token: result.authentication.accessToken,
        });
      }
      return null;
    } catch (error: any) {
      Alert.alert('Naver Login Failed', error.message || 'Please try again');
      return null;
    }
  };

  const loginWithApple = async (): Promise<{ isNewUser?: boolean } | null> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const nickname = credential.fullName
          ? [credential.fullName.givenName, credential.fullName.familyName]
              .filter(Boolean)
              .join(' ')
          : undefined;
        return await socialLogin({
          provider: 'apple',
          token: credential.identityToken,
          nickname: nickname || undefined,
        });
      }
      return null;
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Login Failed', error.message || 'Please try again');
      }
      return null;
    }
  };

  return {
    loginWithGoogle,
    loginWithKakao,
    loginWithNaver,
    loginWithApple,
    isAppleAvailable: Platform.OS === 'ios',
  };
}
