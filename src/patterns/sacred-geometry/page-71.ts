import { progressAlongLine } from 'utils/math'
import { hexGrid, spaceHexes } from 'utils/hex'
import pushpop from 'utils/pushpop'
import {
  getTriangle,
  getTriangleGrid,
  Grid,
  Triangle,
  Props,
  addTimeout,
  clearTimeouts,
  drawLine as _drawLine,
} from './common'
import Scribble from '../../p5.scribble'

export default (s, props: Props) => {
  const drawLine = (p1: Point, p2: Point) => _drawLine(p1, p2, s, scribble)

  const drawTriangle = ([p1, p2, p3]: Triangle): void => {
    pushpop(s, () => {
      s.strokeWeight(props.strokeWeight)
      drawLine(p1, p2)
      drawLine(p2, p3)
      drawLine(p3, p1)
    })
  }

  const drawHook1 = (grid: Grid): void => {
    const gridline1 = grid.s1[grid.s1.length - 2]
    const gridline2 = grid.s2[Math.floor(grid.s2.length / 2)]
    drawHook(gridline1, gridline2)
  }

  const drawHook2 = (grid: Grid): void => {
    const gridline1 = grid.s2[grid.s1.length - 2]
    const gridline2 = grid.s3[Math.floor(grid.s2.length / 2)]
    drawHook(gridline1, gridline2)
  }

  const drawHook3 = (grid: Grid): void => {
    const gridline1 = grid.s3[grid.s1.length - 2]
    const gridline2 = grid.s1[Math.floor(grid.s2.length / 2)]
    drawHook(gridline1, gridline2)
  }

  const drawHook = (gridline1: Line, gridline2: Line): void => {
    const h1 = gridline1[0]
    const h2 = progressAlongLine(gridline1[0], gridline1[1], 3 / 5)
    const h3 = progressAlongLine(gridline2[0], gridline2[1], 1 / 2)

    pushpop(s, () => {
      s.strokeWeight(props.innerWeight)
      drawLine(h1, h2)
      drawLine(h2, h3)
    })
  }

  const drawTile = (start: Point, inverted: boolean) => {
    const t = getTriangle(start, props.len, inverted)
    drawTriangle(t)

    const grid = getTriangleGrid(t, props.n)
    drawHook1(grid)
    drawHook2(grid)
    drawHook3(grid)
  }

  clearTimeouts()
  let scribble: Scribble

  pushpop(s, () => {
    const { len, roughness, spacing } = props
    if (len === 0) return

    if (roughness > 0) {
      scribble = new Scribble(s)
      scribble.roughness = roughness
    }
    const hexSizeLen = len / Math.sqrt(3)
    const hexes = spaceHexes(
      hexGrid(
        hexSizeLen,
        Math.floor(window.innerWidth / hexSizeLen),
        Math.floor(window.innerHeight / hexSizeLen)
      ),
      spacing
    )
    hexes.forEach(({ center }) => {
      addTimeout(() => {
        drawTile(center, false)
        drawTile(center, true)
      })
    })
  })
}
