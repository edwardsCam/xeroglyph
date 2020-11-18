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

  const drawSnowflake = ({ corners: c }: HexData) => {
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

    s.push()
    s.strokeWeight(props.strokeWeight)

    const c1c5int = getIntersectionPoint(c1, c5)
    const c1c6int = getIntersectionPoint(c1, c6)
    const c2c3int = getIntersectionPoint(c2, c3)
    const c2c4int = getIntersectionPoint(c2, c4)
    const c2c6int = getIntersectionPoint(c2, c6)
    const c3c5int = getIntersectionPoint(c3, c5)
    const c3c6int = getIntersectionPoint(c3, c6)
    const c4c1int = getIntersectionPoint(c4, c1)
    const c4c5int = getIntersectionPoint(c4, c5)

    if (c1c6int && c3c6int && c4c1int) {
      drawLine(p4, c3c6int)
      drawLine(c3c6int, c1c6int)
      drawLine(c1c6int, c4c1int)
      drawLine(c4c1int, p3)
    }

    if (c2c4int && c2c6int && c4c5int) {
      drawLine(p12, c2c6int)
      drawLine(c2c6int, c2c4int)
      drawLine(c2c4int, c4c5int)
      drawLine(c4c5int, p11)
    }

    if (c3c5int && c2c3int && c1c5int) {
      drawLine(p8, c2c3int)
      drawLine(c2c3int, c3c5int)
      drawLine(c3c5int, c1c5int)
      drawLine(c1c5int, p7)
    }

    const int02 = getIntersectionPoint([c[0], c[2]], c2)
    if (int02) {
      drawLine(c[0], int02)
      drawLine(int02, p1)
    }

    const int15 = getIntersectionPoint([c[1], c[5]], c1)
    if (int15) {
      drawLine(p2, int15)
      drawLine(int15, c[1])
    }

    const int24 = getIntersectionPoint([c[2], c[4]], c6)
    if (int24) {
      drawLine(c[2], int24)
      drawLine(int24, p5)
    }

    const int13 = getIntersectionPoint([c[1], c[3]], c5)
    if (int13) {
      drawLine(p6, int13)
      drawLine(int13, c[3])
    }

    const int04 = getIntersectionPoint([c[0], c[4]], c3)
    if (int04) {
      drawLine(c[4], int04)
      drawLine(int04, p9)
    }

    const int35 = getIntersectionPoint([c[3], c[5]], c4)
    if (int35) {
      drawLine(p10, int35)
      drawLine(int35, c[5])
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
    // drawHex(hex.corners, s)
    addTimeout(() => drawSnowflake(hex))
  })
}
