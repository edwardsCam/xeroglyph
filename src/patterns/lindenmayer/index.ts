import { init as initProps, getProp, setProp } from 'utils/propConfig'
import { generate, parseRules } from 'l-system'
import * as sierpinski from 'l-system/sierpinski'
import * as hilbert from 'l-system/hilbert'
import * as branch1 from 'l-system/branch1'
import * as penrose from 'l-system/penrose'
import * as dragon from 'l-system/dragon-curve'
import * as peano from 'l-system/peano-gosper'
import Turtle from 'utils/turtle'
import pushpop from 'utils/pushpop'
import { randomInRange, Point, interpolate } from 'utils/math'
import { growLine } from 'utils/drawing'
import times from 'utils/times'

type Props = {
  pattern:
    | 'custom'
    | 'sierpinski'
    | 'hilbert'
    | 'branch'
    | 'penrose'
    | 'dragon'
    | 'peano-gosper'
  n: number
  distance: number
  weight: number
  axiom: string
  generationRules: string
  drawingRules: string
  drawTimeout: number
  startX: number
  startY: number
  speed: number
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
      options: [
        'custom',
        'sierpinski',
        'hilbert',
        'branch',
        'penrose',
        'dragon',
        'peano-gosper',
      ],
      onChange: (pattern) => {
        const fill = (pattern) => {
          setProp('lindenmayer', 'Axiom', pattern.axiom)
          setProp('lindenmayer', 'Generation Rules', pattern.productionRules)
          setProp('lindenmayer', 'Drawing Rules', pattern.drawingRules)
        }

        switch (pattern) {
          case 'sierpinski':
            fill(sierpinski)
            break
          case 'hilbert':
            fill(hilbert)
            break
          case 'branch':
            fill(branch1)
            break
          case 'penrose':
            fill(penrose)
            break
          case 'dragon':
            fill(dragon)
            break
          case 'peano-gosper': {
            fill(peano)
            break
          }
          case 'custom':
            fill({ axiom: '', productionRules: '', drawingRules: '' })
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
      min: 0,
      step: 0.5,
    },
    'Draw Timeout': {
      type: 'number',
      default: 0,
      min: Number.NEGATIVE_INFINITY,
    },
    Speed: {
      type: 'number',
      default: 1,
      min: 1,
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
    speed: get('Speed'),
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
      // s.strokeWeight(0.7)
      // s.stroke('black')
      s.noStroke()

      s.fill(_h, _s, _b)
      s.circle(p.x, p.y, 14)
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
    const lineCount = output.length
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
            // const domain: [number, number] = [0, lineCount - 1]
            // s.stroke(
            //   interpolate(domain, [46, 154], i),
            //   interpolate(domain, [5, 31], i),
            //   interpolate(domain, [94, 49], i)
            // )
            // s.line(line[0].x, line[0].y, line[1].x, line[1].y)
            growLine(line, 600, 4, s).forEach((t) => timeouts.push(t))
          } else if (rule === 'MOVE') {
            turtle.move()
          } else if (rule.includes('TURN ')) {
            const [, num] = rule.split('TURN ')
            const turn = Number(num)
            turtle.turn(turn)
            // const whereAmI = turtle.whereAmI()
            // timeouts.push(setTimeout(() => drawWidget(whereAmI), 0))
            // timeouts.push(
            //   setTimeout(() => drawWidget(whereAmI), randomInRange(600, 800))
            // )
          }
        }

        if (++i < output.length) {
          timeouts.push(
            setTimeout(() => {
              times(props.speed, interpretNextChar)
            }, drawTimeout)
          )
        } else {
          // timeouts.push(setTimeout(() => clearTimeouts()))
        }
      }

      timeouts.push(
        setTimeout(() => {
          interpretNextChar()
        }, 0)
      )
    }

    last = props
  }
}
