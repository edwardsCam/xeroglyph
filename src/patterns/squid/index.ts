import { init as initProps, getProp } from 'utils/propConfig.ts'
import {
  Point,
  coordWithAngleAndDistance,
  thetaFromTwoPoints,
} from 'utils/math.ts'
import { Vector } from 'p5'

type Props = {
  n: number
  resolution: number
  damp: number
  mode: 'spiral' | 'squid'
}

type ArmProps = {
  resolution: number
  orientation: number
}

export default (s) => {
  initProps('squid', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    n: {
      type: 'number',
      default: 3,
      min: 1,
    },
    resolution: {
      type: 'number',
      default: 5,
      min: 2,
    },
    damp: {
      type: 'number',
      default: 10,
      min: 0,
    },
    mode: {
      type: 'dropdown',
      default: 'spiral',
      options: ['spiral', 'squid'],
    },
  })
  const get = (prop: string) => getProp('squid', prop)
  const getProps = (): Props => ({
    n: get('n'),
    resolution: get('resolution'),
    damp: get('damp'),
    mode: get('mode'),
  })

  class Arm {
    points: {
      p: Vector
      v: Vector
      a: Vector
    }[] = []
    boneLength: number
    origOrientation: number
    orientation: number
    constructor(props: ArmProps) {
      const len = Math.min(window.innerHeight / 2, window.innerWidth / 2)
      this.boneLength = len / props.resolution
      this.origOrientation = props.orientation
      this.orientation = this.origOrientation
      for (let i = 0; i <= props.resolution; i++) {
        const p = coordWithAngleAndDistance(
          center,
          this.origOrientation,
          i * this.boneLength
        )
        this.points.push({
          p: new Vector(p.x, p.y),
          v: new Vector(),
          a: new Vector(),
        })
      }
    }

    mutate(damp: number) {
      this.orientation =
        (thetaFromTwoPoints(center, {
          x: s.mouseX,
          y: s.mouseY,
        }) +
          this.origOrientation) %
        (Math.PI * 2)

      this.points.forEach((point, i) => {
        if (i === 0) return

        const idealPosition = coordWithAngleAndDistance(
          this.points[0].p,
          this.orientation,
          i * this.boneLength
        )

        const dxIdeal = idealPosition.x - point.p.x
        const dyIdeal = idealPosition.y - point.p.y

        const actualDamp = damp * i

        const idealPullX = actualDamp == 0 ? dxIdeal : dxIdeal / actualDamp
        const idealPullY = actualDamp == 0 ? dyIdeal : dyIdeal / actualDamp

        point.v.x = idealPullX
        point.v.y = idealPullY

        point.v.add(point.a)
        point.p.add(point.v)
      })
    }
  }

  let arms: Arm[]
  let center: Point

  function initialize() {
    s.stroke(255, 255, 255)
    s.strokeWeight(5)
    center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
    arms = []
    const { n, resolution } = getProps()
    for (let i = 0; i < n; i++) {
      arms.push(
        new Arm({
          resolution,
          orientation: (Math.PI * 2 * i) / n,
        })
      )
    }
  }

  s.setup = () => {
    // s.noCursor()
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    s.clear()
    const { damp, mode } = getProps()
    arms.forEach((arm) => {
      arm.mutate(damp)
    })

    if (mode === 'spiral') {
      arms.forEach((arm, i) => {
        const nextArm = i === arms.length - 1 ? arms[0] : arms[i + 1]
        arm.points.forEach(({ p }, j) => {
          if (j === 0) return
          const next = nextArm.points[j - 1]
          s.line(p.x, p.y, next.p.x, next.p.y)
        })
      })
    } else {
      arms.forEach((arm) => {
        s.beginShape(s.LINES)
        arm.points.forEach((point) => {
          s.vertex(point.p.x, point.p.y)
        })
        s.endShape()
      })
    }
  }
}
