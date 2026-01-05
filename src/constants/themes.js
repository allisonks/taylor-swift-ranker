// src/constants/themes.js

export const COLOR_THEMES = {
  torturedPoets: {
    name: 'Tortured Poets',
    bgGradient: 'bg-gradient-to-b from-stone-400 to-orange-50',
    textPrimary: 'text-stone-900',
    textSecondary: 'text-yellow-950',
  },
  midnights: {
    name: 'Midnights',
    bgGradient: 'bg-gradient-to-b from-blue-900 to-cyan-800',
    textPrimary: 'text-sky-50',
    textSecondary: 'text-purple-50',
  },
  folklore: {
    name: 'Folklore',
    bgGradient: 'bg-gradient-to-b from-neutral-500 to-stone-200',
    textPrimary: 'text-black',
    textSecondary: 'text-gray-900',
  },
  evermore: {
    name: 'Evermore',
    bgGradient: 'bg-gradient-to-b from-amber-700 to-stone-500',
    textPrimary: 'text-amber-50',
    textSecondary: 'text-amber-100',
  },
  lover: {
    name: 'Lover',
    bgGradient: 'bg-gradient-to-b from-pink-300 to-blue-300',
    textPrimary: 'text-purple-950',
    textSecondary: 'text-fuchia-950',
  },
  reputation: {
    name: 'Reputation',
    bgGradient: 'bg-gradient-to-b from-neutral-900 to-green-950',
    textPrimary: 'text-stone-50',
    textSecondary: 'text-red-500',
  },
  red: {
    name: 'Red',
    bgGradient: 'bg-gradient-to-b from-red-700 to-orange-900',
    textPrimary: 'text-white',
    textSecondary: 'text-red-200',
  },
  nineteen89: {
    name: '1989',
    bgGradient: 'bg-gradient-to-b from-sky-300 to-orange-50',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-blue-900',
  },
  showgirl: {
    name: 'Showgirl',
    bgGradient: 'bg-gradient-to-b from-teal-600 to-orange-500',
    textPrimary: 'text-white',
    textSecondary: 'text-zinc-100',
  },
  speaknow: {
    name: 'Speak Now',
    bgGradient: 'bg-gradient-to-b from-purple-700 to-pink-800',
    textPrimary: 'text-white',
    textSecondary: 'text-orange-50',
  },
  fearless: {
    name: 'Fearless',
    bgGradient: 'bg-gradient-to-b from-yellow-300 to-amber-700',
    textPrimary: 'text-black',
    textSecondary: 'text-amber-950',
  },
  debut: {
    name: 'Debut',
    bgGradient: 'bg-gradient-to-b from-emerald-600 to-cyan-400',
    textPrimary: 'text-white',
    textSecondary: 'text-pink-50',
  },
};

// Optional: move this too (since it’s “theme logic”)
export const getAlbumTheme = (albumName = '') => {
  const name = albumName.toLowerCase();

  if (name.includes('midnights')) return 'midnights';
  if (name.includes('evermore')) return 'evermore';
  if (name.includes('folklore')) return 'folklore';
  if (name.includes('lover')) return 'lover';
  if (name.includes('reputation')) return 'reputation';
  if (name.includes('1989')) return 'nineteen89';
  if (name.includes('showgirl')) return 'showgirl';
  if (name.includes('swift')) return 'debut';
  if (name.includes('tortured')) return 'torturedPoets';
  if (name.includes('speak')) return 'speaknow';
  if (name.includes('fearless')) return 'fearless';
  if (name.includes('red')) return 'red';

  return 'torturedPoets';
};
