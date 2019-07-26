import baseGenerate from './index'

const axiom = 'a'
const productionRules = {
  'a': 'b-a-b',
  'b': 'a+b+a',
}
const generate = n => baseGenerate(axiom, productionRules, n)
const drawRules = {
  'a': 'DRAW',
  'b': 'DRAW',
  '+': 'TURN 60',
  '-': 'TURN -60',
}

export {
  generate,
  drawRules,
}
