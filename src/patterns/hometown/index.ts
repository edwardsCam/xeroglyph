import { init as initProps, getProp } from 'utils/propConfig'
import times from 'utils/times'
import { interpolate, coordWithAngleAndDistance } from 'utils/math'
import pushpop from 'utils/pushpop'
import SimplexNoise from 'simplex-noise'

const _DRAW_MODE_ = ['dots', 'lines'] as const

type Props = {
  shapeN: number
  d: number
  n: number
  height: number
  noiseDamp: number
  waveSpeed: number
  weight: number
  drawMode: typeof _DRAW_MODE_[number]
}

export default (s) => {
  initProps('hometown', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    p: {
      type: 'number',
      default: 3,
      min: 3,
    },
    n: {
      type: 'number',
      default: 40,
      min: 1,
    },
    d: {
      type: 'number',
      default: 400,
      min: 10,
    },
    height: {
      type: 'number',
      default: 150,
      min: 0,
      step: 2,
    },
    'noise damp': {
      type: 'number',
      default: 0.001,
      min: 0,
      step: 0.0001,
    },
    'wave speed': {
      type: 'number',
      default: 0.02,
      min: 0,
      step: 0.001,
    },
    weight: {
      type: 'number',
      default: 3,
      min: 0,
      step: 0.25,
    },
    'draw mode': {
      type: 'dropdown',
      options: [..._DRAW_MODE_],
      default: _DRAW_MODE_[0],
    },
  })
  const get = (prop: string) => getProp('hometown', prop)
  const getProps = (): Props => ({
    shapeN: get('p'),
    d: get('d'),
    n: get('n'),
    height: get('height'),
    noiseDamp: get('noise damp'),
    waveSpeed: get('wave speed'),
    drawMode: get('draw mode'),
    weight: get('weight'),
  })
  let zoom: number
  let simplex: SimplexNoise

  function initialize() {
    s.clear()
    simplex = new SimplexNoise()
    zoom = 1000
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
    initialize()
  }

  s.draw = () => {
    const { shapeN, d, n, height, noiseDamp, waveSpeed, drawMode, weight } =
      getProps()
    s.clear()
    s.camera(0, 0, zoom, 0, 0, 0, 0, 1, 0)
    s.rotateY(interpolate([0, window.innerWidth], [0, Math.PI * 2], s.mouseX))
    s.rotateX(interpolate([0, window.innerHeight], [0, Math.PI * 2], s.mouseY))
    s.fill('white')
    if (drawMode === 'dots') {
      s.noStroke()
    } else if (drawMode === 'lines') {
      s.stroke('white')
      s.strokeWeight(weight)
      s.noFill()
    }
    const center: Point = {
      x: 0,
      y: 0,
    }

    const anchors = times(shapeN, (i: number) => {
      const theta = interpolate([0, shapeN], [0, Math.PI * 2], i)
      return coordWithAngleAndDistance(center, theta, d)
    })

    const points = anchors.reduce((points, p, i) => {
      const next = anchors[i === anchors.length - 1 ? 0 : i + 1]
      const list = times(n, (j) => {
        const progress = interpolate([0, n], [0, 1], j)
        const x = interpolate([0, 1], [p.x, next.x], progress)
        const y = interpolate([0, 1], [p.y, next.y], progress)
        const f = s.frameCount * waveSpeed
        const noise = simplex.noise2D(x * noiseDamp + f, y * noiseDamp + f)
        const heightAdjustment = interpolate(
          [-1, 1],
          [-height / 2, height / 2],
          noise
        )
        const z = noise + heightAdjustment
        return { x, y, z }
      })
      return [...points, ...list]
    }, [] as Point[])

    points.forEach(({ x, y, z }, i) => {
      if (drawMode === 'dots') {
        pushpop(s, () => {
          s.translate(x, y, z)
          s.sphere(weight)
        })
      } else if (drawMode === 'lines') {
        if (i === 0) {
          s.beginShape()
        }
        s.vertex(x, y, z)
        if (i === points.length - 1) {
          const first = points[0]
          s.vertex(first.x, first.y, first.z)
          s.endShape()
        }
      }
    })
  }

  s.mouseWheel = (e) => {
    zoom += e.delta / 10
  }
}
