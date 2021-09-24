import { init as initProps, getProp, setProp } from 'utils/propConfig'
import { generate, parseRules } from 'l-system'
import * as sierpinski from 'l-system/sierpinski'
import * as hilbert from 'l-system/hilbert'
import * as branch1 from 'l-system/branch1'
import * as penrose from 'l-system/penrose'
// import { generate, drawRules } from 'l-system/dragon-curve'
import Turtle from 'utils/turtle'
import pushpop from 'utils/pushpop'
import { randomInRange, Point } from 'utils/math'
import { randomColor } from 'utils/color'
import { growLine } from 'utils/drawing'

type Props = {
  pattern: 'custom' | 'sierpinski' | 'hilbert' | 'branch' | 'penrose'
  n: number
  distance: number
  weight: number
  axiom: string
  generationRules: string
  drawingRules: string
  drawTimeout: number
  startX: number
  startY: number
}

export default (s) => {
  initProps('lindenmayer', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    Pattern: {
      type: 'dropdown',
      default: 'custom',
      options: ['custom', 'sierpinski', 'hilbert', 'branch', 'penrose'],
      onChange: (pattern) => {
        switch (pattern) {
          case 'sierpinski':
            {
              setProp('lindenmayer', 'Axiom', sierpinski.axiom)
              setProp(
                'lindenmayer',
                'Generation Rules',
                sierpinski.productionRules
              )
              setProp('lindenmayer', 'Drawing Rules', sierpinski.drawingRules)
            }
            break
          case 'hilbert':
            {
              setProp('lindenmayer', 'Axiom', hilbert.axiom)
              setProp(
                'lindenmayer',
                'Generation Rules',
                hilbert.productionRules
              )
              setProp('lindenmayer', 'Drawing Rules', hilbert.drawingRules)
            }
            break
          case 'branch':
            {
              setProp('lindenmayer', 'Axiom', branch1.axiom)
              setProp(
                'lindenmayer',
                'Generation Rules',
                branch1.productionRules
              )
              setProp('lindenmayer', 'Drawing Rules', branch1.drawingRules)
            }
            break
          case 'penrose':
            {
              setProp('lindenmayer', 'Axiom', penrose.axiom)
              setProp(
                'lindenmayer',
                'Generation Rules',
                penrose.productionRules
              )
              setProp('lindenmayer', 'Drawing Rules', penrose.drawingRules)
            }
            break
          case 'custom':
            {
              setProp('lindenmayer', 'Axiom', '')
              setProp('lindenmayer', 'Generation Rules', '')
              setProp('lindenmayer', 'Drawing Rules', '')
            }
            break
        }
      },
    },
    x: {
      type: 'number',
      min: 0,
      max: window.innerWidth,
      default: window.innerWidth / 2,
    },
    y: {
      type: 'number',
      min: 0,
      max: window.innerHeight,
      default: window.innerHeight / 2,
    },
    n: {
      type: 'number',
      default: 4,
      min: 1,
    },
    Distance: {
      type: 'number',
      default: 15,
      min: 0.5,
      step: 0.5,
    },
    Weight: {
      type: 'number',
      default: 0.5,
      min: 0.5,
      step: 0.5,
    },
    'Draw Timeout': {
      type: 'number',
      default: 0,
      min: Number.NEGATIVE_INFINITY,
    },
    Axiom: {
      type: 'string',
      default: '',
    },
    'Generation Rules': {
      type: 'string-multiline',
      default: '',
    },
    'Drawing Rules': {
      type: 'string-multiline',
      default: '',
    },
  })
  const get = (prop: string) => getProp('lindenmayer', prop)
  const getProps = (): Props => ({
    pattern: get('Pattern'),
    n: get('n'),
    distance: get('Distance'),
    weight: get('Weight'),
    axiom: get('Axiom'),
    generationRules: get('Generation Rules'),
    drawingRules: get('Drawing Rules'),
    drawTimeout: get('Draw Timeout'),
    startX: get('x'),
    startY: get('y'),
  })
  let timeouts: NodeJS.Timeout[] = []
  let last: Props | undefined

  const drawWidget = (p: Point) => {
    const bases = [
      [164, 30, 71],
      [20, 71, 76],
      [20, 93, 53],
      [33, 23, 91],
    ]
    pushpop(s, () => {
      const c = bases[randomInRange(0, bases.length - 1, true)]
      const [_h, _s, _b] = [
        c[0] + randomInRange(-10, 10),
        c[1] + randomInRange(-10, 10),
        c[2] + randomInRange(-10, 10),
      ]
      s.strokeWeight(1)
      s.stroke('black')

      s.fill(_h, _s, _b)
      s.circle(p.x, p.y, randomInRange(10, 20))
    })
  }

  const clearTimeouts = () => {
    timeouts.forEach((timeout) => clearTimeout(timeout))
    timeouts = []
  }

  function initialize() {
    s.clear()
    clearTimeouts()
    s.fill(46, 5, 94)
    s.rect(0, 0, window.innerWidth, window.innerHeight)
    last = undefined
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.colorMode(s.HSB)
    s.background('white')
    initialize()
  }

  s.draw = () => {
    const props = getProps()
    if (last && Object.keys(last).every((prop) => last[prop] === props[prop])) {
      return
    }
    initialize()
    const {
      distance,
      weight,
      n,
      axiom,
      generationRules: _generationRules,
      drawingRules: _drawingRules,
      drawTimeout,
      startY,
      startX,
    } = props
    s.stroke('black')
    s.strokeWeight(weight)
    const turtle = new Turtle(
      {
        x: startX,
        y: startY,
      },
      {
        distance,
        angleType: 'degree',
      }
    )
    const generationRules = parseRules(_generationRules)
    const drawingRules = parseRules(_drawingRules)
    const output = generate(axiom, generationRules, n)
    if (output) {
      let i = 0
      const interpretNextChar = () => {
        const c = output[i]
        if (c === '[') {
          turtle.push()
        } else if (c === ']') {
          turtle.pop()
        } else {
          const rule = drawingRules[c] || ''
          if (rule === 'DRAW') {
            const line = turtle.move()
            // s.line(line[0].x, line[0].y, line[1].x, line[1].y)
            growLine(line, 3000, 6, s).forEach((t) => timeouts.push(t))
          } else if (rule === 'MOVE') {
            turtle.move()
          } else if (rule.includes('TURN ')) {
            const [, num] = rule.split('TURN ')
            const turn = Number(num)
            turtle.turn(turn)
            // const whereAmI = turtle.whereAmI()
            // timeouts.push(setTimeout(() => drawWidget(whereAmI), 0))
            // timeouts.push(
            //   setTimeout(() => drawWidget(whereAmI), randomInRange(1000, 2000))
            // )
          }
        }

        if (++i < output.length) {
          timeouts.push(
            setTimeout(() => {
              interpretNextChar()
              // interpretNextChar()
            }, drawTimeout)
          )
        }
      }

      timeouts.push(
        setTimeout(() => {
          interpretNextChar()
        }, drawTimeout)
      )
    }

    last = props
  }
}
