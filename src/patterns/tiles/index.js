import { init as initProps, getProp } from 'utils/propConfig'

const getRandomValue = (arr) => arr[Math.floor(Math.random() * arr.length)]

export default (s) => {
  initProps('tiles', {
    draw: {
      type: 'func',
      label: 'Redraw!',
      callback: initialize,
    },
    'Fill Screen': {
      type: 'boolean',
      default: true,
    },
    'Square Count': {
      type: 'number',
      default: 5,
      min: 1,
      onChange: initialize,
    },
    'Square Size': {
      when: () => !get('Fill Screen'),
      type: 'number',
      default: 150,
      min: 1,
      onChange: initialize,
    },
    'Split Count': {
      type: 'number',
      default: 6,
      min: 2,
      onChange: initialize,
    },
  })
  const get = (prop) => getProp('tiles', prop)
  const getProps = () => ({
    n: get('Square Count'),
    squareSize: get('Square Size'),
    fillScreen: get('Fill Screen'),
    split: get('Split Count'),
    colors: ['#e7b2a5', '#f1935c', '#ba6b57', '#30475e'],
  })

  class Tiles {
    constructor(props) {
      this.squares = []
      for (let r = 0; r < props.n; r++) {
        this.squares.push([])
        for (let c = 0; c < props.n; c++) {
          this.squares[r].push(new Tile(props))
        }
      }
    }

    draw(props) {
      const min = Math.min(window.innerWidth, window.innerHeight)
      const squareSize = props.fillScreen ? min / props.n : props.squareSize
      const fullSize = squareSize * props.n

      const startX = window.innerWidth / 2 - fullSize / 2
      const startY = window.innerHeight / 2 - fullSize / 2

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
  }

  class Tile {
    constructor(props) {
      this.dir = Math.floor(Math.random() * 2)
      this.colors = []
      for (let i = 0; i < props.split; i++) {
        let c = getRandomValue(props.colors)
        if (i > 0) {
          while (c === this.colors[i - 1]) {
            c = getRandomValue(props.colors)
          }
        }
        this.colors.push(c)
      }
    }

    draw({ start, squareSize, split, colors }) {
      const flip = this.dir === 0

      const { x: xmin, y: ymin } = start
      const xmax = xmin + squareSize
      const ymax = ymin + squareSize

      const splitDistance = (squareSize * 2) / split
      const mid = Math.floor(split / 2)

      s.noStroke()

      let prev
      for (let i = 0; i < split; i++) {
        let x0, y0, x1, y1
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
        } else {
          if (i <= mid) {
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
        }

        if (i > 0) {
          s.fill(this.colors[i - 1])
          if (i === 1) {
            s.triangle(x0, y0, x1, y1, xmin, flip ? ymax : ymin)
          } else {
            s.beginShape()
            s.vertex(prev.x0, prev.y0)
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
      s.triangle(prev.x0, prev.y0, prev.x1, prev.y1, xmax, flip ? ymin : ymax)
    }
  }

  let tiles
  function initialize() {
    tiles = new Tiles(getProps())
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
