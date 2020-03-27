import { init as initProps, getProp } from 'utils/propConfig'

export default (s) => {
  initProps('tiles', {
    'Square Count': {
      type: 'number',
      default: 3,
      min: 1,
      onChange: initialize,
    },
    'Split Count': {
      type: 'number',
      default: 5,
      min: 1,
      onChange: initialize,
    },
  })
  const get = (prop) => getProp('tiles', prop)
  const getProps = () => ({
    n: get('Square Count'),
    split: get('Split Count'),
  })

  class Tiles {
    constructor(props) {
      this.squares = []
      for (let r = 0; r < props.n; r++) {
        this.squares.push([])
        for (let c = 0; c < props.n; c++) {
          this.squares[r].push(new Tile({}))
        }
      }
    }

    draw(props) {
      const min = Math.min(window.innerWidth, window.innerHeight)
      const squareHeight = min / props.n

      this.squares.forEach((row, r) => {
        row.forEach((tile, c) => {
          const start = {
            x: c * squareHeight,
            y: r * squareHeight,
          }
          tile.draw({
            start,
            squareHeight,
            split: props.split,
          })
        })
      })
    }
  }

  class Tile {
    constructor(props) {
      this.dir = 1
    }

    draw({ start, squareHeight, split }) {
      const { dir } = this
      this.drawBorder(start, squareHeight)

      const { x: xmin, y: ymin } = start
      const xmax = xmin + squareHeight
      const ymax = ymin + squareHeight

      const halfPerim = squareHeight * 2
      const splitDistance = halfPerim / split
      const mid = Math.floor(split / 2)

      if (dir === 0) {
        // s.line(x0, y0, x1, y1)
      } else {
        // s.line(x1, y0, x0, y1)

        for (let i = 1; i < split; i++) {
          if (i <= mid) {
            const step = i * splitDistance
            const x0 = xmin
            const y0 = ymin + step
            const x1 = xmin + step
            const y1 = ymin

            s.line(x0, y0, x1, y1)
          } else {
            const step = (split - i) * splitDistance
            const x0 = xmax - step
            const y0 = ymax
            const x1 = xmax
            const y1 = ymax - step

            s.line(x0, y0, x1, y1)
          }
        }
      }
    }

    drawBorder(start, squareHeight) {
      s.stroke(255, 255, 255)
      s.noFill()
      s.square(start.x, start.y, squareHeight)
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
