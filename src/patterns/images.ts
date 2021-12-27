const images: string[] = [
  'spaghetti_memoirs.jpg',
  'marshall.jpg',
  'leaf.jpeg',
  'sand_skiing.jpg',
  'moonrise.jpeg',
  'robbers_roost.jpeg',
  'flower.jpeg',
  'aloe.jpeg',
  'desert.jpeg',
  'boat.jpg',
  'delicate-arch.jpeg',
  'emma.jpeg',
]

export const getRandomImage = (): string =>
  `assets/${images[Math.floor(Math.random() * images.length)]}`
