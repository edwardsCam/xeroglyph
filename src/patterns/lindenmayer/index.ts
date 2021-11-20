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
import { randomInRange } from 'utils/math'
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
  roughness: number
  showWidgets: boolean
  lineGrowTime: number
  lineGrowSegments: number
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
      default: 1,
      min: 0,
      step: 0.5,
    },
    Roughness: {
      type: 'number',
      default: 2,
      min: 0,
      step: 0.5,
    },
    'Show Widgets': {
      type: 'boolean',
      default: true,
    },
    'Draw Timeout': {
      type: 'number',
      default: 0,
      min: Number.NEGATIVE_INFINITY,
    },
    'Line Grow Time': {
      type: 'number',
      default: 500,
      min: Number.NEGATIVE_INFINITY,
    },
    'Line Grow Segments': {
      type: 'number',
      default: 3,
      min: Number.NEGATIVE_INFINITY,
      when: () => get('Line Grow Time') > 0,
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
    roughness: get('Roughness'),
    showWidgets: get('Show Widgets'),
    lineGrowTime: get('Line Grow Time'),
    lineGrowSegments: get('Line Grow Segments'),
  })
  let timeouts: NodeJS.Timeout[] = []
  let last: Props | undefined

  const addTimeout = (cb: () => any, n = 0) => {
    const t = setTimeout(() => {
      cb()
      clearTimeout(t)
    }, n)
    timeouts.push(t)
  }

  const drawWidget = (p: Point) => {
    const bases = [
      [164, 30, 71],
      // [20, 71, 76],
      // [20, 93, 53],
      // [33, 23, 91],
    ]
    pushpop(s, () => {
      const c = bases[randomInRange(0, bases.length - 1, true)]
      const [_h, _s, _b] = [
        c[0] + randomInRange(-10, 10),
        c[1] + randomInRange(-10, 10),
        c[2] + randomInRange(-10, 10),
      ]
      s.noStroke()

      s.fill(_h, _s, _b)

      const radius = randomInRange(10, 20)
      s.translate(p.x - radius / 2, p.y - radius / 2)
      s.rotate(randomInRange(-0.1, 0.1))
      s.rect(0, 0, radius, radius)
      // s.circle(p.x, p.y, 14)
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
    // @ts-ignore
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
      lineGrowTime,
      lineGrowSegments,
      startY,
      startX,
      roughness,
      showWidgets,
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
    const generateLines = (output: string): [Point, Point][] =>
      output.split('').reduce((acc, c) => {
        if (c === '[') {
          turtle.push()
        } else if (c === ']') {
          turtle.pop()
        } else {
          const rule = drawingRules[c] || ''
          if (rule === 'DRAW') {
            const line = turtle.move()
            acc.push(line)
          } else if (rule === 'MOVE') {
            turtle.move()
          } else if (rule.includes('TURN ')) {
            const [, num] = rule.split('TURN ')
            turtle.turn(Number(num))
          }
        }
        return acc
      }, [] as [Point, Point][])
    const lines = generateLines(output)

    let i = 0
    const interpretNextChar = () => {
      if (!lines.length) return
      const line = lines[i]
      if (roughness) {
        line[0].x += s.noise(line[0].x, line[0].y) * roughness
        line[0].y += s.noise(line[0].y, line[0].x) * roughness
        line[1].x += s.noise(line[1].x, line[1].y) * roughness
        line[1].y += s.noise(line[1].y, line[1].x) * roughness
      }

      // const progress = i / (lines.length - 1)
      // const domain: [number, number] = [0, 1]
      // s.stroke(
      //   interpolate(domain, [46, 154], progress),
      //   interpolate(domain, [5, 31], progress),
      //   interpolate(domain, [94, 49], progress)
      // )
      if (lineGrowTime) {
        growLine(line, lineGrowTime, lineGrowSegments, s).forEach(
          ({ time, cb }) => {
            addTimeout(cb, time)
          }
        )
      } else {
        s.line(line[0].x, line[0].y, line[1].x, line[1].y)
      }

      if (showWidgets) {
        if (i === 0) drawWidget(line[0])
        drawWidget(line[1])
      }

      if (++i < lines.length) {
        addTimeout(() => {
          times(props.speed, interpretNextChar)
        }, drawTimeout)
      }
    }

    addTimeout(interpretNextChar)

    last = props
  }
}
