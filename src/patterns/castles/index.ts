import { init as initProps, getProp } from 'utils/propConfig'
import { randomInRange, interpolate, coinToss } from 'utils/math'
import chunk from 'utils/chunk'
import shuffle from 'utils/shuffle'
import pushpop from 'utils/pushpop'
import times from 'utils/times'
import Scribble from '../../p5.scribble'

type Props = {
  n: number
  rows: number
  roughness: number
}

const randomColor = (range: number): [number, number, number] => {
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
      default: 4,
      min: 1,
    },
    Roughness: {
      type: 'number',
      default: 0.5,
      min: 0,
      step: 0.1,
    },
  })

  const get = (prop: string) => getProp('castles', prop)
  const getProps = (): Props => ({
    n: get('Castles'),
    rows: get('Rows'),
    roughness: get('Roughness'),
  })

  let last: Props | undefined
  let scribble: Scribble

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
      if (!scribble) return
      const strokeWeight = randomInRange(1, 2.5)
      const fillColor = randomColor(15)
      s.stroke(0, 0, randomInRange(65, 75))
      s.strokeWeight(strokeWeight)
      s.fill(...fillColor)
      const halfWidth = this.width / 2
      const tlx = location.x - halfWidth
      const trx = tlx + this.width
      const ty = location.y - this.height
      const t = this.headWidth
      const halft = t / 2
      const headLeftX = location.x - halft
      const headRightX = location.x + halft

      const drawStripes = (tlx: number, trx: number, ty: number) => {
        const stripes = randomInRange(0, 3, true)
        times(stripes, (i) => {
          const dx = trx - tlx
          const ymarg = this.height / randomInRange(5, 7)
          const interval = dx / (stripes + 1)
          const x = interval * (i + 1) + tlx
          pushpop(s, () => {
            s.strokeWeight(strokeWeight * randomInRange(0.3, 0.7))
            scribble.scribbleLine(x, ty + ymarg, x, ty + this.height - ymarg)
          })
        })
      }

      pushpop(s, () => {
        s.noStroke()
        s.fill(...fillColor)
        s.rect(tlx, ty, this.width, this.height)
      })
      scribble.scribbleLine(tlx, ty, trx, ty)
      scribble.scribbleLine(trx, ty, trx, ty + this.height)
      scribble.scribbleLine(trx, ty + this.height, tlx, ty + this.height)
      scribble.scribbleLine(tlx, ty + this.height, tlx, ty)
      if (this.type === 'spire') {
        const spireBottom = location.y - this.height - randomInRange(7, 25)
        const height = Math.max(
          10,
          Math.sqrt(t * t - halft * halft) + randomInRange(-25, 15)
        )
        pushpop(s, () => {
          s.fill(...fillColor)
          s.noStroke()
          s.quad(
            tlx,
            ty,
            headLeftX,
            spireBottom,
            headRightX,
            spireBottom,
            trx,
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
        })
        // quad
        scribble.scribbleLine(tlx, ty, headLeftX, spireBottom)
        scribble.scribbleLine(headLeftX, spireBottom, headRightX, spireBottom)
        scribble.scribbleLine(headRightX, spireBottom, trx, ty)
        scribble.scribbleLine(trx, ty, tlx, ty)
        drawStripes(tlx, trx, ty)

        // tri
        scribble.scribbleLine(
          location.x,
          spireBottom - height,
          headLeftX,
          spireBottom
        )
        scribble.scribbleLine(
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
        //     const x = trx * p
        //     s.line(x, y1, x, y2)
        //   }
        // }
      } else if (this.type === 'turret') {
        const crenellationHeight = 10
        let { crenellations, width } = this
        const crenellationWidth = this.headWidth / (crenellations * 2 - 1)
        let cursor: Point = { x: headLeftX, y: ty - 20 }
        let old: Point = cursor
        pushpop(s, () => {
          s.noStroke()
          s.fill(...fillColor)
          const d = this.headWidth - this.width
          s.rect(
            tlx - d / 2,
            ty - crenellationHeight,
            this.width + d,
            crenellationHeight
          )
        })
        drawStripes(tlx, trx, ty)

        scribble.scribbleLine(tlx, ty, headLeftX, ty)
        scribble.scribbleLine(headLeftX, ty, cursor.x, cursor.y)
        while (--crenellations) {
          old = { ...cursor }
          cursor.x += crenellationWidth
          pushpop(s, () => {
            s.noStroke()
            s.fill(...fillColor)
            s.rect(old.x, old.y, crenellationWidth, crenellationHeight)
          })
          scribble.scribbleLine(old.x, old.y, cursor.x, cursor.y)

          old = { ...cursor }
          cursor.y += crenellationHeight
          scribble.scribbleLine(old.x, old.y, cursor.x, cursor.y)

          old = { ...cursor }
          cursor.x += crenellationWidth
          scribble.scribbleLine(old.x, old.y, cursor.x, cursor.y)

          old = { ...cursor }
          cursor.y -= crenellationHeight
          scribble.scribbleLine(old.x, old.y, cursor.x, cursor.y)
        }
        old = { ...cursor }
        cursor.x += crenellationWidth
        pushpop(s, () => {
          s.noStroke()
          s.fill(...fillColor)
          s.rect(old.x, old.y, crenellationWidth, crenellationHeight)
        })
        scribble.scribbleLine(old.x, old.y, cursor.x, cursor.y)
        scribble.scribbleLine(cursor.x, cursor.y, cursor.x, ty)
        scribble.scribbleLine(cursor.x, ty, tlx + width, ty)
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

  function drawCastles(castles: Castle[], { rows, n }: Props) {
    const cols = Math.floor(Math.max(n / rows, 0))
    const colWidth = window.innerWidth / cols
    const chunks = chunk(castles, cols).filter((_c, i) => i < rows)
    const increment = window.innerHeight / (rows + 2)
    chunks.forEach((row, i) => {
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

        const y = (i + 2) * increment + randomInRange(50, 55)
        castle.draw({ x, y })
      })
    })
  }

  function initialize() {
    const props = getProps()
    scribble = new Scribble(s)
    scribble.roughness = props.roughness
    last = undefined
    s.clear()
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
      // @ts-ignore
      if (Object.keys(last).some((prop) => last[prop] !== props[prop])) {
        initialize()
      }
    }

    last = props
  }
}
