import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

const resources = {
  en: {
    translation: {
      // Tab labels
      events: 'Events',
      community: 'Community',
      deals: 'Deals',
      profile: 'Profile',

      // Auth
      login: 'Log In',
      register: 'Register',
      logout: 'Log Out',

      // Event types
      milonga: 'Milonga',
      festival: 'Festival',
      workshop: 'Workshop',
      class: 'Class',
      practica: 'Practica',

      // Common actions
      translate: 'Translate',
      like: 'Like',
      comment: 'Comment',
      share: 'Share',
      bookmark: 'Bookmark',
      bookmarked: 'Bookmarked',
      refresh: 'Refresh',
      submit: 'Submit',
      cancel: 'Cancel',
      back: 'Back',
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Try again',

      // Events screen
      noEvents: 'No events found nearby',
      pullToRefresh: 'Pull down to refresh',

      // Event detail
      eventDetail: 'Event Details',
      venue: 'Venue',
      dateTime: 'Date & Time',
      price: 'Price',
      description: 'Description',
      hotelsNearby: 'Hotels Nearby',
      freeEntry: 'Free Entry',
      bookHotel: 'Book Hotel',
      viewOnMap: 'View on Map',
      shareEvent: 'Share Event',

      // Community screen
      global: 'Global',
      myCountry: 'My Country',
      noPosts: 'No posts yet',
      beFirst: 'Be the first to share!',
      writePost: 'Write a post...',
      postType: 'Post Type',
      countryScope: 'Visibility',
      postTypeGeneral: 'General',
      postTypeQuestion: 'Question',
      postTypeEventShare: 'Event Share',
      postTypeVideo: 'Video',
      scopeGlobal: 'Global',
      scopeMyCountry: 'My Country',
      createPost: 'New Post',
      postPlaceholder: 'Share something with the tango community...',
      postSuccess: 'Post shared!',
      translatedText: 'Translated',
      showOriginal: 'Show original',

      // Deals screen
      noDeals: 'Deals coming soon!',
      allCategories: 'All',
      shoes: 'Shoes',
      clothing: 'Clothing',
      accessories: 'Accessories',
      music: 'Music',
      viewDeal: 'View Deal',
      off: 'off',

      // Profile screen
      myBookmarks: 'My Bookmarked Events',
      myPosts: 'My Posts',
      settings: 'Settings',
      joinCommunity: 'Join the Tango Community',
      connectDancers: 'Connect with dancers worldwide',
      noBookmarks: 'No bookmarked events yet',
      browseEvents: 'Browse Events',
    },
  },
  ko: {
    translation: {
      // Tab labels
      events: '행사',
      community: '커뮤니티',
      deals: '특가',
      profile: '프로필',

      // Auth
      login: '로그인',
      register: '회원가입',
      logout: '로그아웃',

      // Event types
      milonga: '밀롱가',
      festival: '페스티벌',
      workshop: '워크숍',
      class: '수업',
      practica: '프랙티카',

      // Common actions
      translate: '번역',
      like: '좋아요',
      comment: '댓글',
      share: '공유',
      bookmark: '북마크',
      bookmarked: '북마크됨',
      refresh: '새로고침',
      submit: '등록',
      cancel: '취소',
      back: '뒤로',
      loading: '불러오는 중...',
      error: '오류가 발생했습니다',
      retry: '다시 시도',

      // Events screen
      noEvents: '근처에 행사가 없습니다',
      pullToRefresh: '당겨서 새로고침',

      // Event detail
      eventDetail: '행사 상세',
      venue: '장소',
      dateTime: '날짜 및 시간',
      price: '입장료',
      description: '설명',
      hotelsNearby: '주변 호텔',
      freeEntry: '무료 입장',
      bookHotel: '호텔 예약',
      viewOnMap: '지도에서 보기',
      shareEvent: '행사 공유',

      // Community screen
      global: '글로벌',
      myCountry: '우리나라',
      noPosts: '아직 게시물이 없습니다',
      beFirst: '첫 번째로 공유해보세요!',
      writePost: '게시물 작성...',
      postType: '게시물 유형',
      countryScope: '공개 범위',
      postTypeGeneral: '일반',
      postTypeQuestion: '질문',
      postTypeEventShare: '행사 공유',
      postTypeVideo: '동영상',
      scopeGlobal: '전체 공개',
      scopeMyCountry: '우리나라만',
      createPost: '새 게시물',
      postPlaceholder: '탱고 커뮤니티와 나눠보세요...',
      postSuccess: '게시물이 등록되었습니다!',
      translatedText: '번역됨',
      showOriginal: '원문 보기',

      // Deals screen
      noDeals: '특가 상품이 곧 업데이트됩니다!',
      allCategories: '전체',
      shoes: '탱고화',
      clothing: '의류',
      accessories: '액세서리',
      music: '음악',
      viewDeal: '상품 보기',
      off: '할인',

      // Profile screen
      myBookmarks: '북마크한 행사',
      myPosts: '내 게시물',
      settings: '설정',
      joinCommunity: '탱고 커뮤니티에 참여하세요',
      connectDancers: '전 세계 댄서들과 연결하세요',
      noBookmarks: '북마크한 행사가 없습니다',
      browseEvents: '행사 탐색',
    },
  },
  es: {
    translation: {
      // Tab labels
      events: 'Eventos',
      community: 'Comunidad',
      deals: 'Ofertas',
      profile: 'Perfil',

      // Auth
      login: 'Iniciar sesion',
      register: 'Registrarse',
      logout: 'Cerrar sesion',

      // Event types
      milonga: 'Milonga',
      festival: 'Festival',
      workshop: 'Taller',
      class: 'Clase',
      practica: 'Practica',

      // Common actions
      translate: 'Traducir',
      like: 'Me gusta',
      comment: 'Comentar',
      share: 'Compartir',
      bookmark: 'Guardar',
      bookmarked: 'Guardado',
      refresh: 'Actualizar',
      submit: 'Publicar',
      cancel: 'Cancelar',
      back: 'Atras',
      loading: 'Cargando...',
      error: 'Algo salio mal',
      retry: 'Intentar de nuevo',

      // Events screen
      noEvents: 'No hay eventos cercanos',
      pullToRefresh: 'Desliza para actualizar',

      // Event detail
      eventDetail: 'Detalles del evento',
      venue: 'Lugar',
      dateTime: 'Fecha y hora',
      price: 'Precio',
      description: 'Descripcion',
      hotelsNearby: 'Hoteles cercanos',
      freeEntry: 'Entrada libre',
      bookHotel: 'Reservar hotel',
      viewOnMap: 'Ver en mapa',
      shareEvent: 'Compartir evento',

      // Community screen
      global: 'Global',
      myCountry: 'Mi pais',
      noPosts: 'Aun no hay publicaciones',
      beFirst: 'Se el primero en compartir!',
      writePost: 'Escribe algo...',
      postType: 'Tipo de publicacion',
      countryScope: 'Visibilidad',
      postTypeGeneral: 'General',
      postTypeQuestion: 'Pregunta',
      postTypeEventShare: 'Compartir evento',
      postTypeVideo: 'Video',
      scopeGlobal: 'Global',
      scopeMyCountry: 'Solo mi pais',
      createPost: 'Nueva publicacion',
      postPlaceholder: 'Comparte algo con la comunidad tanguera...',
      postSuccess: 'Publicacion compartida!',
      translatedText: 'Traducido',
      showOriginal: 'Mostrar original',

      // Deals screen
      noDeals: 'Ofertas proximamente!',
      allCategories: 'Todo',
      shoes: 'Zapatos',
      clothing: 'Ropa',
      accessories: 'Accesorios',
      music: 'Musica',
      viewDeal: 'Ver oferta',
      off: 'descuento',

      // Profile screen
      myBookmarks: 'Eventos guardados',
      myPosts: 'Mis publicaciones',
      settings: 'Configuracion',
      joinCommunity: 'Unete a la comunidad',
      connectDancers: 'Conecta con bailarines de todo el mundo',
      noBookmarks: 'No hay eventos guardados aun',
      browseEvents: 'Explorar eventos',
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
