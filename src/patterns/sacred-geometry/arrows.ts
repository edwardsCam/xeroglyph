import {
  Props,
  drawHex,
  addTimeout,
  clearTimeouts,
  drawLine as _drawLine,
} from './common'
import Scribble from '../../p5.scribble'
import {
  progressAlongLine,
  Point,
  Line,
  getIntersectionPoint,
} from 'utils/math'
import { hexGrid, HexData } from 'utils/hex'

const ONE_THIRD = 1 / 3
const TWO_THIRDS = 2 / 3
export default (s, props: Props) => {
  clearTimeouts()

  const drawLine = (p1: Point, p2: Point) => _drawLine(p1, p2, s, scribble)

  const drawArrows = ({ corners: c, sideLen, apothem }: HexData) => {
    const p1 = progressAlongLine(c[0], c[1], ONE_THIRD)
    const p2 = progressAlongLine(c[0], c[1], TWO_THIRDS)
    const p3 = progressAlongLine(c[1], c[2], ONE_THIRD)
    const p4 = progressAlongLine(c[1], c[2], TWO_THIRDS)
    const p5 = progressAlongLine(c[2], c[3], ONE_THIRD)
    const p6 = progressAlongLine(c[2], c[3], TWO_THIRDS)
    const p7 = progressAlongLine(c[3], c[4], ONE_THIRD)
    const p8 = progressAlongLine(c[3], c[4], TWO_THIRDS)
    const p9 = progressAlongLine(c[4], c[5], ONE_THIRD)
    const p10 = progressAlongLine(c[4], c[5], TWO_THIRDS)
    const p11 = progressAlongLine(c[5], c[0], ONE_THIRD)
    const p12 = progressAlongLine(c[5], c[0], TWO_THIRDS)

    const c1: Line = [p7, p2]
    const c2: Line = [p8, p1]
    const c3: Line = [p9, p4]
    const c4: Line = [p10, p3]
    const c5: Line = [p11, p6]
    const c6: Line = [p12, p5]

    const ONE_THIRD_SIDE = sideLen / 3
    const sideToSide = apothem * 2

    const a = ONE_THIRD_SIDE / Math.sqrt(3)
    const outsidePercentage = (sideToSide + a) / sideToSide
    const insidePercentage = a / sideToSide

    s.push()
    s.strokeWeight(props.strokeWeight)

    // c1 - c6 intersection
    const c1c6int = getIntersectionPoint(c1, c6)
    if (c1c6int) {
      const outside = progressAlongLine(p12, p5, outsidePercentage)
      const inside = progressAlongLine(p7, p2, insidePercentage)
      drawLine(c[2], outside)
      drawLine(outside, c1c6int)
      drawLine(c1c6int, p2)

      drawLine(p7, inside)
      drawLine(inside, c[3])
    }

    // c2 - c4 intersection
    const c2c4int = getIntersectionPoint(c2, c4)
    if (c2c4int) {
      const outside = progressAlongLine(p8, p1, outsidePercentage)
      const inside = progressAlongLine(p11, p6, insidePercentage)
      drawLine(c[0], outside)
      drawLine(outside, c2c4int)
      drawLine(c2c4int, p10)

      drawLine(p11, inside)
      drawLine(inside, c[5])
    }

    // c3 - c5 intersection
    const c3c5int = getIntersectionPoint(c3, c5)
    if (c3c5int) {
      const outside = progressAlongLine(p4, p9, outsidePercentage)
      const inside = progressAlongLine(p3, p10, insidePercentage)
      drawLine(c[4], outside)
      drawLine(outside, c3c5int)
      drawLine(c3c5int, p6)

      drawLine(p3, inside)
      drawLine(inside, c[1])
    }
    s.pop()
  }

  const { len, roughness } = props
  if (len === 0) return

  let scribble: Scribble
  if (roughness > 0) {
    scribble = new Scribble(s)
    scribble.roughness = roughness
  }
  const hexLen = len / Math.sqrt(3)
  const rows = Math.ceil(window.innerHeight / hexLen)
  const cols = Math.ceil(window.innerWidth / hexLen)
  const hexes = hexGrid(hexLen, cols, rows)
  hexes.forEach((hex) => {
    // drawHex(s, hex.corners)
    addTimeout(() => drawArrows(hex))
  })
}
