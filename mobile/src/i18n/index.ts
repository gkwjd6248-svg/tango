import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

const resources = {
  en: {
    translation: {
      events: 'Events',
      community: 'Community',
      deals: 'Deals',
      profile: 'Profile',
      login: 'Log In',
      register: 'Register',
      milonga: 'Milonga',
      festival: 'Festival',
      workshop: 'Workshop',
      class: 'Class',
      practica: 'Practica',
      translate: 'Translate',
      noEvents: 'No events found nearby',
      pullToRefresh: 'Pull down to refresh',
    },
  },
  ko: {
    translation: {
      events: '행사',
      community: '커뮤니티',
      deals: '특가',
      profile: '프로필',
      login: '로그인',
      register: '회원가입',
      milonga: '밀롱가',
      festival: '페스티벌',
      workshop: '워크숍',
      class: '수업',
      practica: '프랙티카',
      translate: '번역',
      noEvents: '근처에 행사가 없습니다',
      pullToRefresh: '당겨서 새로고침',
    },
  },
  es: {
    translation: {
      events: 'Eventos',
      community: 'Comunidad',
      deals: 'Ofertas',
      profile: 'Perfil',
      login: 'Iniciar sesion',
      register: 'Registrarse',
      milonga: 'Milonga',
      festival: 'Festival',
      workshop: 'Taller',
      class: 'Clase',
      practica: 'Practica',
      translate: 'Traducir',
      noEvents: 'No hay eventos cercanos',
      pullToRefresh: 'Desliza para actualizar',
    },
  },
};

const deviceLanguage = getLocales()[0]?.languageCode || 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
