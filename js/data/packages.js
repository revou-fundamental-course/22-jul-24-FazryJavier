// Dummy package catalogue. Text (name, description, highlights) lives in the locale files
// under `pkg.<id>.name|desc|highlights`; this file holds only language-neutral data.
export const REGIONS = ['asia', 'europe'];

export const PACKAGES = [
    { id: 'japan', region: 'asia', days: 7, price: 18500000, rating: 4.9, reviews: 214, image: 'img/japan.jpg', badge: 'popular' },
    { id: 'china', region: 'asia', days: 6, price: 12900000, rating: 4.7, reviews: 96, image: 'img/china.jpg', badge: null },
    { id: 'india', region: 'asia', days: 8, price: 14200000, rating: 4.6, reviews: 74, image: 'img/india.jpg', badge: 'new' },
    { id: 'singapore', region: 'asia', days: 4, price: 8900000, rating: 4.8, reviews: 188, image: 'img/singapore.jpg', badge: null },
    { id: 'england', region: 'europe', days: 9, price: 31500000, rating: 4.8, reviews: 121, image: 'img/england.jpg', badge: null },
    { id: 'italy', region: 'europe', days: 10, price: 33900000, rating: 4.9, reviews: 167, image: 'img/italy.jpg', badge: 'popular' },
    { id: 'paris', region: 'europe', days: 7, price: 29800000, rating: 4.8, reviews: 203, image: 'img/france.jpg', badge: null },
    { id: 'turkey', region: 'europe', days: 8, price: 21400000, rating: 4.7, reviews: 109, image: 'img/turki.jpg', badge: 'new' },
];

export const HERO_SLIDES = ['img/tokyo.jpg', 'img/guilin.jpg', 'img/paris.jpg', 'img/london.jpg'];
