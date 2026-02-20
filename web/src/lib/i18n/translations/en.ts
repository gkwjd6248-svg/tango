export const en = {
  // Navigation
  nav: {
    events: 'Events',
    community: 'Community',
    deals: 'Deals',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    profile: 'Profile',
    bookmarks: 'Bookmarks',
    notifications: 'Notifications',
  },

  // Auth
  auth: {
    loginTitle: 'Welcome back',
    loginSubtitle: 'Sign in to your Tango account',
    registerTitle: 'Join the community',
    registerSubtitle: 'Create your Tango account',
    email: 'Email',
    password: 'Password',
    nickname: 'Nickname',
    countryCode: 'Country',
    loginButton: 'Sign In',
    registerButton: 'Create Account',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    loginLink: 'Sign in',
    registerLink: 'Create one',
    loading: 'Please wait...',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Enter your password',
    nicknamePlaceholder: 'Your tango name',
    errors: {
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      passwordTooShort: 'Password must be at least 6 characters',
      loginFailed: 'Login failed. Please check your credentials.',
      registerFailed: 'Registration failed. Please try again.',
    },
  },

  // Events
  events: {
    title: 'Tango Events',
    subtitle: 'Discover milongas, practicas, and festivals worldwide',
    filterBy: 'Filter by',
    city: 'City',
    country: 'Country',
    eventType: 'Event Type',
    allTypes: 'All Types',
    milonga: 'Milonga',
    practica: 'Practica',
    festival: 'Festival',
    workshop: 'Workshop',
    concert: 'Concert',
    noEvents: 'No events found',
    noEventsSubtext: 'Try adjusting your filters or check back later',
    loadMore: 'Load more events',
    loading: 'Loading events...',
    viewDetails: 'View details',
    bookmark: 'Save event',
    bookmarked: 'Saved',
    startDate: 'Starts',
    endDate: 'Ends',
    venue: 'Venue',
    entryFee: 'Entry fee',
    free: 'Free entry',
    organizer: 'Organizer',
    website: 'Website',
    nearbyHotels: 'Nearby Hotels',
  },

  // Community
  community: {
    title: 'Community Board',
    subtitle: 'Connect with tango dancers around the world',
    newPost: 'New Post',
    writePlaceholder: "What's on your mind?",
    post: 'Post',
    cancel: 'Cancel',
    like: 'Like',
    comment: 'Comment',
    translate: 'Translate',
    showOriginal: 'Show original',
    loadMore: 'Load more posts',
    loading: 'Loading posts...',
    noPosts: 'No posts yet',
    noPostsSubtext: 'Be the first to share something with the community',
    allCountries: 'All Countries',
    filterCountry: 'Filter by country',
    comments: 'Comments',
    noComments: 'No comments yet. Be the first!',
    writeComment: 'Write a comment...',
    submitComment: 'Submit',
    deleteComment: 'Delete',
    postType: {
      general: 'General',
      question: 'Question',
      tip: 'Tip',
      event: 'Event',
    },
    ago: {
      justNow: 'Just now',
      minutesAgo: '{{n}}m ago',
      hoursAgo: '{{n}}h ago',
      daysAgo: '{{n}}d ago',
    },
  },

  // Deals
  deals: {
    title: 'Tango Deals',
    subtitle: 'Exclusive offers for the tango community',
    allCategories: 'All',
    shoes: 'Shoes',
    clothing: 'Clothing',
    music: 'Music',
    travel: 'Travel',
    accessories: 'Accessories',
    discount: '{{pct}}% OFF',
    viewDeal: 'View Deal',
    loadMore: 'Load more deals',
    loading: 'Loading deals...',
    noDeals: 'No deals available right now',
    noDealsSubtext: 'Check back soon for exclusive tango offers',
    originalPrice: 'Was',
    dealPrice: 'Now',
  },

  // Common
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try again',
    close: 'Close',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    back: 'Back',
    seeAll: 'See all',
    loginRequired: 'Please sign in to continue',
  },

  // Footer
  footer: {
    about: 'About',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    contact: 'Contact',
    copyright: '© 2025 Tango Community. All rights reserved.',
  },
};

export type Translations = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: (typeof en)[K][P] extends object
      ? { [Q in keyof (typeof en)[K][P]]: string }
      : string;
  };
};
