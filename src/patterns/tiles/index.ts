import { init as initProps, getProp } from 'utils/propConfig.ts'
import { Point } from 'utils/math.ts'

const getRandomValue = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]

const colorSchemes = [
  ['#de7119', '#dee3e2', '#116979', '#18b0b0'],
  ['#e7b2a5', '#f1935c', '#ba6b57', '#30475e'],
  ['#edffea', '#75daad', '#216353', '#7a4d1d'],
]

type Props = {
  n: number
  squareSize: number
  fillScreen: boolean
  split: number
  strokeWeight: number
  partyMode: boolean
  randomness: number
  allowAdjacent: boolean
  colors: string[]
}

type TileProps = Props & {
  start: Point
}

export default (s) => {
  initProps('tiles', {
    draw: {
      type: 'func',
      label: 'Regenerate',
      callback: initialize,
    },
    randomizeColors: {
      when: () => !get('Party Mode!'),
      type: 'func',
      label: 'Randomize colors',
      callback: randomizeColors,
    },
    'Fill Screen': {
      type: 'boolean',
      default: true,
    },
    'Square Size': {
      when: () => !get('Fill Screen'),
      type: 'number',
      default: 150,
      min: 1,
      onChange: initialize,
    },
    'Square Count': {
      type: 'number',
      default: 5,
      min: 1,
      onChange: initialize,
    },
    'Split Count': {
      type: 'number',
      default: 6,
      min: 2,
      onChange: initialize,
    },
    'Stroke Weight': {
      type: 'number',
      default: 2.5,
      min: 0,
      step: 0.25,
      onChange: initialize,
    },
    'Allow Same Adjacent Colors': {
      type: 'boolean',
      default: false,
      onChange: initialize,
    },
    'Party Mode!': {
      type: 'boolean',
      default: false,
    },
    Randomness: {
      type: 'number',
      min: 0,
      default: 0,
      onChange: initialize,
    },
  })
  const get = (prop: string) => getProp('tiles', prop)
  const getProps = (): Props => ({
    n: get('Square Count'),
    squareSize: get('Square Size'),
    fillScreen: get('Fill Screen'),
    split: get('Split Count'),
    strokeWeight: get('Stroke Weight'),
    partyMode: get('Party Mode!'),
    randomness: get('Randomness'),
    allowAdjacent: get('Allow Same Adjacent Colors'),
    colors: colorSchemes[1],
  })

  class Tiles {
    squares: Tile[][]
    constructor(props: Props) {
      this.squares = []
      for (let r = 0; r < props.n; r++) {
        this.squares.push([])
        for (let c = 0; c < props.n; c++) {
          this.squares[r].push(new Tile(props))
        }
      }

      if (props.randomness > 0) this.randomizeSplit()
    }

    draw(props: Props) {
      if (props.strokeWeight) {
        s.stroke(0, 0, 0)
        s.strokeWeight(props.strokeWeight)
      } else {
        s.noStroke()
      }
      const min = Math.min(window.innerWidth, window.innerHeight)
      const squareSize = props.fillScreen ? min / props.n : props.squareSize
      const fullSize = squareSize * props.n

      const startX = window.innerWidth / 2 - fullSize / 2
      const startY = window.innerHeight / 2 - fullSize / 2

      if (props.partyMode) this.randomizeColors()

      this.squares.forEach((row, r) => {
        row.forEach((tile, c) => {
          tile.draw({
            ...props,
            start: {
              x: startX + c * squareSize,
              y: startY + r * squareSize,
            },
            squareSize,
          })
        })
      })
    }

    randomizeColors(): void {
      this.squares.forEach((row) =>
        row.forEach((tile) => tile.setColors(getProps()))
      )
    }

    randomizeSplit(): void {
      const props = getProps()
      const { split, randomness } = props
      this.squares.forEach((row) =>
        row.forEach((tile) => {
          const randomDeviation = Math.floor(
            (Math.random() * (randomness + 1) - randomness / 2) * 2
          )
          tile.setSplit(Math.max(2, split + randomDeviation))
          tile.setColors(props)
        })
      )
    }
  }

  class Tile {
    dir: number
    colors: string[]
    split: number

    constructor(props: Props) {
      this.dir = Math.floor(Math.random() * 2)
      this.colors = []
      this.split = 0
      this.setColors(props)
    }

    setColors(props: Props): void {
      this.colors = []
      const split = this.getSplit(props)
      for (let i = 0; i < split; i++) {
        let c = getRandomValue(props.colors)
        if (!props.allowAdjacent) {
          if (i > 0) {
            while (c === this.colors[i - 1]) {
              c = getRandomValue(props.colors)
            }
          }
        }
        this.colors.push(c)
      }
    }

    setSplit(split: number): void {
      this.split = split
    }

    getSplit(props: Props): number {
      return this.split || props.split
    }

    draw(props: TileProps) {
      const { start, squareSize } = props
      const split = this.getSplit(props)
      const flip = this.dir === 0

      const { x: xmin, y: ymin } = start
      const xmax = xmin + squareSize
      const ymax = ymin + squareSize

      const splitDistance = (squareSize * 2) / split
      const mid = Math.floor(split / 2)

      let prev: { x0: number; y0: number; x1: number; y1: number }
      for (let i = 0; i < split; i++) {
        let x0: number, y0: number, x1: number, y1: number
        if (flip) {
          if (i <= mid) {
            const step = i * splitDistance
            x0 = xmin
            y0 = ymax - step
            x1 = xmin + step
            y1 = ymax
          } else {
            const step = (split - i) * splitDistance
            x0 = xmax - step
            y0 = ymin
            x1 = xmax
            y1 = ymin + step
          }
        } else if (i <= mid) {
          const step = i * splitDistance
          x0 = xmin
          y0 = ymin + step
          x1 = xmin + step
          y1 = ymin
        } else {
          const step = (split - i) * splitDistance
          x0 = xmax - step
          y0 = ymax
          x1 = xmax
          y1 = ymax - step
        }

        if (i > 0) {
          s.fill(this.colors[i - 1])
          if (i === 1) {
            s.triangle(x0, y0, x1, y1, xmin, flip ? ymax : ymin)
          } else {
            s.beginShape()
            // @ts-ignore
            s.vertex(prev.x0, prev.y0)
            // @ts-ignore
            s.vertex(prev.x1, prev.y1)
            s.vertex(xmax, flip ? ymax : ymin)
            s.vertex(x1, y1)
            s.vertex(x0, y0)
            s.vertex(xmin, flip ? ymin : ymax)
            s.endShape()
          }
        }
        prev = { x0, y0, x1, y1 }
      }
      s.fill(this.colors[this.colors.length - 1])
      // @ts-ignore
      s.triangle(prev.x0, prev.y0, prev.x1, prev.y1, xmax, flip ? ymin : ymax)
    }
  }

  let tiles: Tiles
  function initialize() {
    tiles = new Tiles(getProps())
  }

  function randomizeColors() {
    tiles.randomizeColors()
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  s.draw = () => {
    s.clear()
    const props = getProps()
    tiles.draw(props)
  }
}
