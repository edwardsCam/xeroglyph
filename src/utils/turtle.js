function Turtle(sketch, startPos, options) {
  let theta = 0
  let pos = startPos
  const DISTANCE = options.distance

  this.move = () => {
    const newPos = {
      x: pos.x + DISTANCE * Math.cos(theta * Math.PI / 180),
      y: pos.y + DISTANCE * Math.sin(theta * Math.PI / 180),
    }
    sketch.line(pos.x, pos.y, newPos.x, newPos.y)
    pos = newPos
  }

  this.turn = angle => {
    theta += angle
    theta = theta % 360
  }
}

export default Turtle
