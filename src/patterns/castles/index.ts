import { init as initProps, getProp } from 'utils/propConfig.ts'
import { Point, randomInRange, interpolate, coinToss } from 'utils/math'
import chunk from 'utils/chunk.ts'
import shuffle from 'utils/shuffle.ts'

type Props = {
  n: number
  rows: number
}

const randomColor = (range = 5): [number, number, number] => {
  const baseH = 270
  const baseS = 8
  const baseB = 5
  return [
    Math.max(0, randomInRange(baseH - range, baseH + range, true)),
    Math.max(0, randomInRange(baseS - range, baseS + range, true)),
    Math.max(0, randomInRange(baseB - range, baseB + range, true)),
  ]
}

export default (s) => {
  initProps('castles', {
    restart: {
      type: 'func',
      label: 'Restart',
      callback: initialize,
    },
    Castles: {
      type: 'number',
      default: 200,
      min: 1,
    },
    Rows: {
      type: 'number',
      default: 7,
      min: 1,
    },
  })

  const get = (prop: string) => getProp('castles', prop)
  const getProps = (): Props => ({
    n: get('Castles'),
    rows: get('Rows'),
  })

  let last: Props | undefined

  class Castle {
    type: 'turret' | 'spire'
    windowType: 'line'
    windows: number
    height: number
    width: number
    headWidth: number
    crenellations: number

    constructor(
      type: 'turret' | 'spire',
      height: number,
      width: number,
      headWidth: number,
      windowType: 'line',
      windows: number,
      crenellations: number
    ) {
      this.type = type
      this.height = height
      this.width = width
      this.headWidth = headWidth
      this.windowType = windowType
      this.windows = windows
      this.crenellations = crenellations
    }

    draw(location: Point) {
      s.strokeWeight(randomInRange(1, 2.5))
      s.fill(...randomColor())
      s.stroke(0, 0, randomInRange(65, 75))
      const halfWidth = this.width / 2
      const tlx = location.x - halfWidth
      const ty = location.y - this.height
      const t = this.headWidth
      const halft = t / 2
      const headLeftX = location.x - halft
      const headRightX = location.x + halft

      s.rect(tlx, ty, this.width, this.height)
      if (this.type === 'spire') {
        const spireBottom = location.y - this.height - randomInRange(7, 25)
        const height = Math.max(
          10,
          Math.sqrt(t * t - halft * halft) + randomInRange(-25, 15)
        )
        s.quad(
          tlx,
          ty,
          headLeftX,
          spireBottom,
          headRightX,
          spireBottom,
          tlx + this.width,
          ty
        )
        s.triangle(
          headLeftX,
          spireBottom,
          location.x,
          spireBottom - height,
          headRightX,
          spireBottom
        )

        // for (let i = 1; i <= this.windows; i++) {
        //   if (this.windowType === 'line') {
        //     const p = i / (this.windows + 1)
        //     const yrange = randomInRange(0.1, 0.5)
        //     const y1 = ty + this.height * yrange
        //     const y2 = location.y - this.height * yrange
        //     const x = tlx + this.width * p
        //     s.line(x, y1, x, y2)
        //   }
        // }
      } else if (this.type === 'turret') {
        let { crenellations } = this
        const crenellationWidth = this.headWidth / (crenellations * 2 - 1)
        let cursor: Point = { x: headLeftX, y: ty - 20 }
        s.beginShape()
        s.vertex(tlx, ty)
        s.vertex(headLeftX, ty)
        s.vertex(cursor.x, cursor.y)
        while (--crenellations) {
          cursor.x += crenellationWidth
          s.vertex(cursor.x, cursor.y)

          cursor.y += 10
          s.vertex(cursor.x, cursor.y)

          cursor.x += crenellationWidth
          s.vertex(cursor.x, cursor.y)

          cursor.y -= 10
          s.vertex(cursor.x, cursor.y)
        }
        cursor.x += crenellationWidth
        s.vertex(cursor.x, cursor.y)
        s.vertex(cursor.x, ty)
        s.vertex(tlx, ty)
        s.endShape()
      }
    }
  }

  function generateCastles(n: number): Castle[] {
    const castles: Castle[] = []
    for (let i = 0; i < n; i++) {
      const width = randomInRange(30, 65)
      castles.push(
        new Castle(
          coinToss() ? 'spire' : 'turret',
          randomInRange(30, 150),
          width,
          width * randomInRange(1.05, 1.5),
          'line',
          randomInRange(0, 3, true),
          randomInRange(2, 6, true)
        )
      )
    }
    return castles
  }

  function drawCastles(castles: Castle[], props: Props) {
    const { rows, n } = props
    const cols = Math.floor(Math.max(n / rows, 0))
    const colWidth = window.innerWidth / cols

    const chunks = chunk(castles, cols)
    chunks.forEach((row, i) => {
      const p = (i + 1) / (rows + 1)
      const rowWithPositions = row.map((castle, pos) => ({ castle, pos }))
      const shuffled = shuffle(rowWithPositions)
      shuffled.forEach(({ castle, pos }) => {
        let x = interpolate(
          [0, row.length - 1],
          [colWidth, window.innerWidth - colWidth],
          pos
        )
        x += randomInRange(-5, 5)
        if (i % 2) x += colWidth / 2

        let y = window.innerHeight * p
        y += window.innerHeight / (rows + 1)
        y += randomInRange(0, 5)

        castle.draw({ x, y })
      })
    })
  }

  function initialize() {
    last = undefined
    s.clear()
    const props = getProps()
    const castles = generateCastles(props.n)
    drawCastles(castles, props)
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.colorMode(s.HSB)
    initialize()
  }

  s.draw = () => {
    const props = getProps()
    if (last) {
      if (Object.keys(last).some((prop) => last[prop] !== props[prop])) {
        initialize()
      }
    }

    last = props
  }
}
