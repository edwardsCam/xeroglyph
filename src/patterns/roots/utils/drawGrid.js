import { getPixelPosition } from './gridUtils'

export default function drawGrid(s, platMap, width, resolution, squareSize) {
  for (let i = 0; i <= resolution; i++) {
    const { x, y } = getPixelPosition(i, i, squareSize)
    s.line(x, 0, x, width)
    s.line(0, y, width, y)
  }
  platMap.getMarked().forEach(({ r, c }) => {
    const { x, y } = getPixelPosition(r, c, squareSize)
    s.fill(255, 0, 0)
    s.square(x, y, squareSize)
  })
}
