import baseGenerate from './index'

const axiom = 'fx'
const productionRules = {
  x: 'x+yf+',
  y: '-fx-y',
}
const generate = n => baseGenerate(axiom, productionRules, n)
const drawRules = {
  f: 'DRAW',
  '+': 'TURN 90',
  '-': 'TURN -90',
}

export { generate, drawRules }
