export default s => {
  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
  }

  s.draw = () => {
    drawCircle(window.innerHeight / 2, 600, 8)
  }

  function drawCircle(x, radius, level) {
    s.fill(
      (126 * level) / 3.0
    )
    s.ellipse(x, window.innerHeight / 2, radius * 2, radius * 2)
    if (level > 1) {
      drawCircle(x - radius / 2, radius / 2, level - 1)
      drawCircle(x + radius / 2, radius / 2, level - 1)
    }
  }
}
