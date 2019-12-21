import PriorityQueue from 'utils/priorityQueue'
import drawGrid from './utils/drawGrid'
import { getCenterOfTile, getCoordinates } from './utils/gridUtils'
import {
  randomInRange,
  coordWithAngleAndDistance,
  interpolate,
  distance,
  toRadians,
} from 'utils/math'
import throttle from 'lodash.throttle'

export default s => {
  let lines = []
  let _props_ = {
    resolution: 21,
    startAngle: 0,
    decayRate: 0.01,
    minBranchAngle: 5,
    maxBranchAngle: 120,
    radius: 200,
  }
  const unitWidth = (_props_.radius * 2) / _props_.resolution
  let cursor = new Cursor(centerPoint(), centerCoords(), _props_.startAngle, 1)
  const q = new PriorityQueue('trunkiness')
  const throttledGenerate = throttle(() => generateOne(_props_), 10)
  const platMap = new PlatMap(_props_.resolution)
  platMap.mark(cursor.coords)

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
  }

  s.draw = () => {
    // s.clear()
    drawGrid(s, platMap, _props_.radius * 2, _props_.resolution, unitWidth)
    throttledGenerate()
    drawLines()
  }

  function generateOne({
    startAngle,
    decayRate,
    minBranchAngle,
    maxBranchAngle,
    radius,
  }) {
    const nextCursor = getNextCursor()
    if (nextCursor) {
      platMap.mark(nextCursor.coords)
      addLine(cursor.point, nextCursor.point)
      q.push(nextCursor)
      cursor = nextCursor
    } else if (q.has()) {
      cursor = q.pop()
    }

    function getNextCursor() {
      const flexibility = interpolate(
        [0, 1],
        [maxBranchAngle, minBranchAngle],
        cursor.trunkiness
      )
      const heading = cursor.heading + randomInRange(-flexibility, flexibility)
      let tmpPoint = coordWithAngleAndDistance(
        cursor.point,
        toRadians(heading),
        unitWidth
      )
      if (!inBounds(tmpPoint)) return null
      tmpPoint = getCenterOfTile(tmpPoint, unitWidth)
      return new Cursor(
        new Point(tmpPoint.x, tmpPoint.y),
        getCoordinates(tmpPoint, unitWidth),
        heading,
        cursor.trunkiness - decayRate
      )
    }

    function inBounds(point) {
      return distance(centerPoint(), point) < radius
    }
  }

  function drawLines() {
    lines.forEach(({ p1, p2 }) => s.line(p1.x, p1.y, p2.x, p2.y))
  }

  function addLine(p1, p2) {
    lines.push({ p1, p2 })
  }

  function centerPoint() {
    return new Point(_props_.radius, _props_.radius)
  }

  function centerCoords() {
    return getCoordinates(centerPoint(), unitWidth)
  }
}

function PlatMap(width) {
  let count = 0
  const g = []
  for (let i = 0; i < width; i++) {
    g.push([])
    for (let j = 0; j < width; j++) {
      g[i].push(false)
    }
  }

  this.mark = ({ r, c }) => (g[r][c] = true)
  this.isMarked = ({ r, c }) => g[r][c]
  this.getMarked = () =>
    g.reduce(
      (list1, row, r) =>
        list1.concat(
          row.reduce((list2, square, c) => {
            if (square) list2.push({ r, c })
            return list2
          }, [])
        ),
      []
    )
}

function Point(x, y) {
  this.x = x
  this.y = y
}

function Cursor(point, coords, heading, trunkiness) {
  this.point = point
  this.coords = coords
  this.heading = heading
  this.trunkiness = trunkiness
}
