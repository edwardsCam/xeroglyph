import {
  generate,
  drawRules,
} from '../l-system/dragon-curve'
import Turtle from '../utils/turtle'

export default s => {
  let drawn = false

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
  }

  s.draw = () => {
    if (!drawn) {
      const turtle = new Turtle(s, {
        x: 200,
        y: 300,
      }, {
        distance: 10,
      })
      generate(10).split('').forEach(c => {
        const rule = drawRules[c]
        if (rule) {
          if (rule === 'DRAW') {
            turtle.move()
          } else if (rule.includes('TURN ')) {
            turtle.turn(
              Number(rule.split('TURN ')[1])
            )
          }
        }
      })
      drawn = true
    }
  }
}
