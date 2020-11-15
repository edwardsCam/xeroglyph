import { progressAlongLine, Point } from 'utils/math'
import { hexGrid } from 'utils/hex'
import {
  getTriangle,
  getTriangleGrid,
  Grid,
  drawTriangle,
  Line,
  Props,
} from './common'

let timeouts: NodeJS.Timeout[] = []

export default (s, props: Props) => {
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

    s.line(h1.x, h1.y, h2.x, h2.y)
    s.line(h2.x, h2.y, h3.x, h3.y)
  }

  const drawTile = (start: Point, inverted: boolean) => {
    const t = getTriangle(start, props.len, inverted)
    drawTriangle(s, t, props.borderWeight * 2)

    const grid = getTriangleGrid(t, props.n)
    drawHook1(grid)
    drawHook2(grid)
    drawHook3(grid)
  }

  timeouts.forEach((timeout) => clearTimeout(timeout))
  timeouts = []

  const { len } = props
  const hexSizeLen = len / Math.sqrt(3)
  const hexes = hexGrid(
    hexSizeLen,
    Math.floor(window.innerWidth / hexSizeLen),
    Math.floor(window.innerHeight / hexSizeLen)
  )
  s.strokeWeight(props.innerWeight)
  hexes.forEach(({ center }) => {
    timeouts.push(
      setTimeout(() => {
        drawTile(center, false)
        drawTile(center, true)
      }, 0)
    )
  })
}
