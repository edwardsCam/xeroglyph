const images: string[] = [
  'spaghetti_memoirs.jpg',
  'marshall.jpg',
  'leaf.jpeg',
  'sand_skiing.jpg',
  'bernie.jpg',
  'moonrise.jpeg',
  'jess1.jpeg',
]

export const getRandomImage = (): string =>
  `assets/${images[Math.floor(Math.random() * images.length)]}`
