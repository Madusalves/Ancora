import type { ImageSource } from 'expo-image';

// Ícone de categoria (coluna `categories.icon`) → asset do Figma + tamanho original.
type CategoryIcon = { source: ImageSource; width: number; height: number };

export const CATEGORY_ICONS: Record<string, CategoryIcon> = {
  restaurant: { source: require('../../../assets/icons/tx/cat-restaurant.svg'), width: 15, height: 20 },
  car: { source: require('../../../assets/icons/tx/cat-car.svg'), width: 18, height: 16 },
  medical: { source: require('../../../assets/icons/tx/cat-medical.svg'), width: 20, height: 20 },
  home: { source: require('../../../assets/icons/tx/cat-home.svg'), width: 16, height: 18 },
  film: { source: require('../../../assets/icons/tx/cat-film.svg'), width: 20, height: 16 },
  school: { source: require('../../../assets/icons/tx/cat-school.svg'), width: 22, height: 18 },
  cash: { source: require('../../../assets/icons/tx/cat-cash.svg'), width: 22, height: 16 },
  pets: { source: require('../../../assets/icons/tx/cat-pets.svg'), width: 20, height: 20 },
  shirt: { source: require('../../../assets/icons/tx/cat-shirt.svg'), width: 20, height: 20 },
  bike: { source: require('../../../assets/icons/tx/cat-bike.svg'), width: 20, height: 20 },
  beauty: { source: require('../../../assets/icons/tx/cat-beauty.svg'), width: 20, height: 20 },
  bag: { source: require('../../../assets/icons/tx/cat-bag.svg'), width: 20, height: 20 },
  cart: { source: require('../../../assets/icons/tx/cat-cart.svg'), width: 20, height: 20 },
  game: { source: require('../../../assets/icons/tx/cat-game.svg'), width: 20, height: 20 },
  plane: { source: require('../../../assets/icons/tx/cat-plane.svg'), width: 20, height: 20 },
  gift: { source: require('../../../assets/icons/tx/cat-gift.svg'), width: 20, height: 20 },
  phone: { source: require('../../../assets/icons/tx/cat-phone.svg'), width: 20, height: 20 },
  music: { source: require('../../../assets/icons/tx/cat-music.svg'), width: 20, height: 20 },
  coffee: { source: require('../../../assets/icons/tx/cat-coffee.svg'), width: 20, height: 20 },
  heart: { source: require('../../../assets/icons/tx/cat-heart.svg'), width: 20, height: 20 },
  briefcase: { source: require('../../../assets/icons/tx/cat-briefcase.svg'), width: 20, height: 20 },
  tag: { source: require('../../../assets/icons/tx/cat-tag.svg'), width: 20, height: 20 },
};
