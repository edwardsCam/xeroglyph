const images: string[] = [
  'spaghetti_memoirs.jpg',
  'cale.jpg',
  'marshall.jpg',
  'selfie.jpg',
  'sand_skiing.jpg',
  'bernie.jpg',
]

export const getRandomImage = (): string =>
  `assets/${images[Math.floor(Math.random() * images.length)]}`
