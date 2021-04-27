import { Point } from 'utils/math'
import { defineGrid, extendHex, Hex } from 'honeycomb-grid'

export type HexData = {
  raw: Hex<{ size: number }>
  rectCorner: Point
  corners: Point[]
  center: Point
  apothem: number
  rectLen: number
  sideLen: number
}

export const hexGrid = (
  sideLen: number,
  width: number,
  height: number,
  orientation: 'pointy' | 'flat' = 'pointy'
): HexData[] => {
  const Hex = extendHex({
    size: sideLen,
    orientation,
    start: { x: 1000, y: 0 },
  })
  const Grid = defineGrid(Hex)
  const rect = Grid.rectangle({ width, height })
  return rect.map((hex) => {
    const rectCorner = hex.toPoint()
    const corners = hex.corners().map((corner) => corner.add(rectCorner))
    const apothem = (sideLen * Math.sqrt(3)) / 2
    const center: Point = {
      x: corners[2].x,
      y: corners[0].y + apothem / 2,
    }
    return {
      raw: hex,
      rectCorner: {
        x: rectCorner.x,
        y: rectCorner.y,
      },
      corners,
      center,
      apothem,
      rectLen: apothem * 2,
      sideLen,
    }
  }) as HexData[]
}
