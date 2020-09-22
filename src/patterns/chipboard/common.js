import { randomInRange, interpolate } from 'utils/math.ts'

function rir(min, max, randomness) {
  const middle = (min + max) / 2
  return randomInRange(
    interpolate([0, 1], [middle, min], randomness),
    interpolate([0, 1], [middle, max], randomness)
  )
}

const colorSchemes = {
  icelandSlate: {
    color1: 'rgba(236, 236, 236, 0.5)',
    color2: 'rgba(159, 211, 199, 0.5)',
    color3: 'rgba(56, 81, 112, 0.5)',
    color4: 'rgba(20, 45, 76, 0.5)',
  },
  duskyForest: {
    color1: '#587850',
    color2: '#709078',
    color3: '#78b0a0',
    color4: '#f8d0b0',
  },
  greySlate: {
    color1: '#e9e9e5',
    color2: '#d4d6c8',
    color3: '#9a9b94',
    color4: '#52524e',
  },
  blackVelvet: {
    color1: '#252525',
    color2: '#ff0000',
    color3: '#af0404',
    color4: '#414141',
    bg: '#9a9b94',
  },
}

export { rir, colorSchemes }
