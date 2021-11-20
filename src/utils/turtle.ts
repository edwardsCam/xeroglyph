import { coordWithAngleAndDistance, toRadians } from './math'

function Turtle(
  startPos: Point,
  options: { distance: number; angleType: 'radian' | 'degree' }
) {
  let dir = 0
  let pos = startPos
  const { distance, angleType } = options
  const stack: [Point, number][] = []

  this.move = (): [Point, Point] => {
    const newPos = coordWithAngleAndDistance(pos, dir, distance)
    const oldPos = { ...pos }
    pos = newPos
    return [oldPos, { ...newPos }]
  }

  this.turn = (angle: number) => {
    dir += angleType === 'radian' ? angle : toRadians(angle)
    dir %= angleType === 'radian' ? Math.PI * 2 : 360
  }

  this.push = () => {
    stack.push([{ ...pos }, dir])
  }

  this.pop = () => {
    const popped = stack.pop()
    if (popped) {
      pos = popped[0]
      dir = popped[1]
    }
  }

  this.whereAmI = (): Point => ({ ...pos })
}

export default Turtle
