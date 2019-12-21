function getPixelPosition(r, c, squareSize) {
  return {
    x: c * squareSize,
    y: r * squareSize,
  }
}

function getCoordinates({ x, y }, squareSize) {
  return {
    r: Math.floor(y / squareSize),
    c: Math.floor(x / squareSize),
  }
}

function getCenterOfTile(point, squareSize) {
  const { r, c } = getCoordinates(point, squareSize)
  const { x, y } = getPixelPosition(r, c, squareSize)
  return {
    x: x + squareSize / 2,
    y: y + squareSize / 2,
  }
}

export { getPixelPosition, getCoordinates, getCenterOfTile }
