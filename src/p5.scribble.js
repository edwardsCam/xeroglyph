/*
  Copied from https://github.com/generative-light/p5.scribble.js
*/

/*
This file contains functions for drawing 2d primitives with a handy sketchy look in p5.js.
Author: Janneck Wullschleger in 07/2016
Web: http://itsjw.de
Mail: jw@itsjw.de
Updated: 24.02.2017 to use with a reference to the p5 instance.
Just put it in as param to the constructor.
Much of the source code is taken from the handy library for processing,
written by Jo Wood, giCentre, City University London based on an idea by Nikolaus Gradwohl.
The handy library is licensed under the GNU Lesser General Public License: http://www.gnu.org/licenses/.
*/

export default function Scribble(p) {
  this.sketch = p || window
  this.bowing = 1
  this.roughness = 1
  this.maxOffset = 2
  this.numEllipseSteps = 9
  this.ellipseInc = (Math.PI * 2) / this.numEllipseSteps

  this.getOffset = function (minVal, maxVal) {
    return this.roughness * (this.sketch.random() * (maxVal - minVal) + minVal)
  }

  this.buildEllipse = function (cx, cy, rx, ry, offset, overlap) {
    const radialOffset = this.getOffset(-0.5, 0.5) - Math.PI / 2

    this.sketch.beginShape()
    this.sketch.curveVertex(
      this.getOffset(-offset, offset) +
        cx +
        0.9 * rx * Math.cos(radialOffset - this.ellipseInc),
      this.getOffset(-offset, offset) +
        cy +
        0.9 * ry * Math.sin(radialOffset - this.ellipseInc)
    )

    for (
      let theta = radialOffset;
      theta < Math.PI * 2 + radialOffset - 0.01;
      theta += this.ellipseInc
    ) {
      this.sketch.curveVertex(
        this.getOffset(-offset, offset) + cx + rx * Math.cos(theta),
        this.getOffset(-offset, offset) + cy + ry * Math.sin(theta)
      )
    }

    this.sketch.curveVertex(
      this.getOffset(-offset, offset) +
        cx +
        rx * Math.cos(radialOffset + Math.PI * 2 + overlap * 0.5),
      this.getOffset(-offset, offset) +
        cy +
        ry * Math.sin(radialOffset + Math.PI * 2 + overlap * 0.5)
    )

    this.sketch.curveVertex(
      this.getOffset(-offset, offset) +
        cx +
        0.98 * rx * Math.cos(radialOffset + overlap),
      this.getOffset(-offset, offset) +
        cy +
        0.98 * ry * Math.sin(radialOffset + overlap)
    )

    this.sketch.curveVertex(
      this.getOffset(-offset, offset) +
        cx +
        0.9 * rx * Math.cos(radialOffset + overlap * 0.5),
      this.getOffset(-offset, offset) +
        cy +
        0.9 * ry * Math.sin(radialOffset + overlap * 0.5)
    )
    this.sketch.endShape()
  }

  this.getIntersectingLines = function (lineCoords, xCoords, yCoords) {
    const intersections = []
    const s1 = new Segment(
      lineCoords[0],
      lineCoords[1],
      lineCoords[2],
      lineCoords[3]
    )

    for (let i = 0; i < xCoords.length; i++) {
      const s2 = new Segment(
        xCoords[i],
        yCoords[i],
        xCoords[(i + 1) % xCoords.length],
        yCoords[(i + 1) % xCoords.length]
      )

      if (s1.compare(s2) == Relation.INTERSECTS) {
        intersections.push([s1.getIntersectionX(), s1.getIntersectionY()])
      }
    }
    return intersections
  }

  this.scribbleLine = function (x1, y1, x2, y2) {
    const lenSq = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)
    let offset = this.maxOffset

    if (this.maxOffset * this.maxOffset * 100 > lenSq) {
      offset = Math.sqrt(lenSq) / 10
    }

    const halfOffset = offset / 2
    const divergePoint = 0.2 + this.sketch.random() * 0.2
    let midDispX = (this.bowing * this.maxOffset * (y2 - y1)) / 200
    let midDispY = (this.bowing * this.maxOffset * (x1 - x2)) / 200
    midDispX = this.getOffset(-midDispX, midDispX)
    midDispY = this.getOffset(-midDispY, midDispY)

    this.sketch.noFill()

    this.sketch.beginShape()
    this.sketch.vertex(
      x1 + this.getOffset(-offset, offset),
      y1 + this.getOffset(-offset, offset)
    )
    this.sketch.curveVertex(
      x1 + this.getOffset(-offset, offset),
      y1 + this.getOffset(-offset, offset)
    )
    this.sketch.curveVertex(
      midDispX +
        x1 +
        (x2 - x1) * divergePoint +
        this.getOffset(-offset, offset),
      midDispY + y1 + (y2 - y1) * divergePoint + this.getOffset(-offset, offset)
    )
    this.sketch.curveVertex(
      midDispX +
        x1 +
        2 * (x2 - x1) * divergePoint +
        this.getOffset(-offset, offset),
      midDispY +
        y1 +
        2 * (y2 - y1) * divergePoint +
        this.getOffset(-offset, offset)
    )
    this.sketch.curveVertex(
      x2 + this.getOffset(-offset, offset),
      y2 + this.getOffset(-offset, offset)
    )
    this.sketch.vertex(
      x2 + this.getOffset(-offset, offset),
      y2 + this.getOffset(-offset, offset)
    )
    this.sketch.endShape()

    this.sketch.beginShape()
    this.sketch.vertex(
      x1 + this.getOffset(-halfOffset, halfOffset),
      y1 + this.getOffset(-halfOffset, halfOffset)
    )
    this.sketch.curveVertex(
      x1 + this.getOffset(-halfOffset, halfOffset),
      y1 + this.getOffset(-halfOffset, halfOffset)
    )
    this.sketch.curveVertex(
      midDispX +
        x1 +
        (x2 - x1) * divergePoint +
        this.getOffset(-halfOffset, halfOffset),
      midDispY +
        y1 +
        (y2 - y1) * divergePoint +
        this.getOffset(-halfOffset, halfOffset)
    )
    this.sketch.curveVertex(
      midDispX +
        x1 +
        2 * (x2 - x1) * divergePoint +
        this.getOffset(-halfOffset, halfOffset),
      midDispY +
        y1 +
        2 * (y2 - y1) * divergePoint +
        this.getOffset(-halfOffset, halfOffset)
    )
    this.sketch.curveVertex(
      x2 + this.getOffset(-halfOffset, halfOffset),
      y2 + this.getOffset(-halfOffset, halfOffset)
    )
    this.sketch.vertex(
      x2 + this.getOffset(-halfOffset, halfOffset),
      y2 + this.getOffset(-halfOffset, halfOffset)
    )
    this.sketch.endShape()
  }

  this.scribbleCurve = function (x1, y1, x2, y2, x3, y3, x4, y4) {
    this.sketch.bezier(
      x1 + this.getOffset(-2, 2),
      y1 + this.getOffset(-2, 2),
      x3 + this.getOffset(-4, 4),
      y3 + this.getOffset(-3, 3),
      x4 + this.getOffset(-3, 3),
      y4 + this.getOffset(-3, 3),
      x2 + this.getOffset(-1, 1),
      y2 + this.getOffset(-1, 1)
    )

    this.sketch.bezier(
      x1 + this.getOffset(-2, 2),
      y1 + this.getOffset(-2, 2),
      x3 + this.getOffset(-3, 3),
      y3 + this.getOffset(-3, 3),
      x4 + this.getOffset(-3, 3),
      y4 + this.getOffset(-4, 4),
      x2 + this.getOffset(-2, 2),
      y2 + this.getOffset(-2, 2)
    )
  }

  this.scribbleRect = function (x, y, w, h) {
    const halfWidth = w / 2
    const halfHeight = h / 2
    const left = Math.min(x - halfWidth, x + halfWidth)
    const right = Math.max(x - halfWidth, x + halfWidth)
    const top = Math.min(y - halfHeight, y + halfHeight)
    const bottom = Math.max(y - halfHeight, y + halfHeight)

    this.scribbleLine(left, top, right, top)
    this.scribbleLine(right, top, right, bottom)
    this.scribbleLine(right, bottom, left, bottom)
    this.scribbleLine(left, bottom, left, top)
  }

  this.scribbleRoundedRect = function (x, y, w, h, radius) {
    const halfWidth = w / 2
    const halfHeight = h / 2

    if (radius == 0 || radius > halfWidth || radius > halfHeight) {
      this.scribbleRect(x, y, w, h)
      return
    }

    const left = Math.min(x - halfWidth, x + halfWidth)
    const right = Math.max(x - halfWidth, x + halfWidth)
    const top = Math.min(y - halfHeight, y + halfHeight)
    const bottom = Math.max(y - halfHeight, y + halfHeight)

    this.scribbleLine(left + radius, top, right - radius, top, 1.5)
    this.scribbleLine(right, top + radius, right, bottom - radius, 1.5)
    this.scribbleLine(right - radius, bottom, left + radius, bottom, 1.5)
    this.scribbleLine(left, bottom - radius, left, top + radius, 1.5)

    this.scribbleCurve(
      left + radius,
      top,
      left,
      top + radius,
      left + radius * 0.1,
      top + radius * 0.1,
      left + radius * 0.1,
      top + radius * 0.1
    )
    this.scribbleCurve(
      right - radius,
      top,
      right,
      top + radius,
      right - radius * 0.1,
      top + radius * 0.1,
      right - radius * 0.1,
      top + radius * 0.1
    )
    this.scribbleCurve(
      left + radius,
      bottom,
      left,
      bottom - radius,
      left + radius * 0.1,
      bottom - radius * 0.1,
      left + radius * 0.1,
      bottom - radius * 0.1
    )
    this.scribbleCurve(
      right - radius,
      bottom,
      right,
      bottom - radius,
      right - radius * 0.1,
      bottom - radius * 0.1,
      right - radius * 0.1,
      bottom - radius * 0.1
    )
  }

  this.scribbleEllipse = function (x, y, w, h) {
    let rx = Math.abs(w / 2)
    let ry = Math.abs(h / 2)

    rx += this.getOffset(-rx * 0.05, rx * 0.05)
    ry += this.getOffset(-ry * 0.05, ry * 0.05)

    this.buildEllipse(
      x,
      y,
      rx,
      ry,
      1,
      this.ellipseInc * this.getOffset(0.1, this.getOffset(0.4, 1))
    )
    this.buildEllipse(x, y, rx, ry, 1.5, 0)
  }

  this.scribbleFilling = function (xCoords, yCoords, gap, angle) {
    if (
      xCoords == null ||
      yCoords == null ||
      xCoords.length == 0 ||
      yCoords.length == 0
    ) {
      return
    }

    const hachureAngle = this.sketch.radians(angle % 180)
    const cosAngle = Math.cos(hachureAngle)
    const sinAngle = Math.sin(hachureAngle)
    const tanAngle = Math.tan(hachureAngle)

    let left = xCoords[0]
    let right = xCoords[0]
    let top = yCoords[0]
    let bottom = yCoords[0]

    for (let i = 1; i < xCoords.length; i++) {
      left = Math.min(left, xCoords[i])
      right = Math.max(right, xCoords[i])
      top = Math.min(top, yCoords[i])
      bottom = Math.max(bottom, yCoords[i])
    }

    const it = new HachureIterator(
      top - 1,
      bottom + 1,
      left - 1,
      right + 1,
      gap,
      sinAngle,
      cosAngle,
      tanAngle
    )
    let rectCoords = null

    while ((rectCoords = it.getNextLine()) != null) {
      const lines = this.getIntersectingLines(rectCoords, xCoords, yCoords)

      for (let i = 0; i < lines.length; i += 2) {
        if (i < lines.length - 1) {
          const p1 = lines[i]
          const p2 = lines[i + 1]
          this.scribbleLine(p1[0], p1[1], p2[0], p2[1], 2)
        }
      }
    }
  }
}

function HachureIterator(
  _top,
  _bottom,
  _left,
  _right,
  _gap,
  _sinAngle,
  _cosAngle,
  _tanAngle
) {
  const sinAngle = _sinAngle
  const tanAngle = _tanAngle
  const top = _top
  const bottom = _bottom
  const left = _left
  const right = _right
  const gap = _gap

  let pos
  let deltaX, hGap
  let sLeft, sRight

  if (Math.abs(sinAngle) < 0.0001) {
    pos = left + gap
  } else if (Math.abs(sinAngle) > 0.9999) {
    pos = top + gap
  } else {
    deltaX = (bottom - top) * Math.abs(tanAngle)
    pos = left - Math.abs(deltaX)
    hGap = Math.abs(gap / _cosAngle)
    sLeft = new Segment(left, bottom, left, top)
    sRight = new Segment(right, bottom, right, top)
  }

  this.getNextLine = function () {
    if (Math.abs(sinAngle) < 0.0001) {
      if (pos < right) {
        const line = [pos, top, pos, bottom]
        pos += gap
        return line
      }
    } else if (Math.abs(sinAngle) > 0.9999) {
      if (pos < bottom) {
        const line = [left, pos, right, pos]
        pos += gap
        return line
      }
    } else {
      let xLower = pos - deltaX / 2
      let xUpper = pos + deltaX / 2
      let yLower = bottom
      let yUpper = top

      if (pos < right + deltaX) {
        while (
          (xLower < left && xUpper < left) ||
          (xLower > right && xUpper > right)
        ) {
          pos += hGap
          xLower = pos - deltaX / 2
          xUpper = pos + deltaX / 2

          if (pos > right + deltaX) {
            return null
          }
        }

        const s = new Segment(xLower, yLower, xUpper, yUpper)

        if (s.compare(sLeft) == Relation.INTERSECTS) {
          xLower = s.getIntersectionX()
          yLower = s.getIntersectionY()
        }
        if (s.compare(sRight) == Relation.INTERSECTS) {
          xUpper = s.getIntersectionX()
          yUpper = s.getIntersectionY()
        }
        if (tanAngle > 0) {
          xLower = right - (xLower - left)
          xUpper = right - (xUpper - left)
        }

        const line = [xLower, yLower, xUpper, yUpper]
        pos += hGap
        return line
      }
    }
    return null
  }
}

function Segment(_x1, _y1, _x2, _y2) {
  const x1 = _x1
  const y1 = _y1
  const x2 = _x2
  const y2 = _y2
  let undef
  let xi = Number.MAX_VALUE
  let yi = Number.MAX_VALUE

  const a = y2 - y1
  const b = x1 - x2
  const c = x2 * y1 - x1 * y2

  if (a == 0 && b == 0 && c == 0) {
    undef = true
  } else {
    undef = false
  }

  this.compare = function (otherSegment) {
    if (this.isUndefined() || otherSegment.isUndefined()) {
      return Relation.UNDEFINED
    }

    let grad1 = Number.MAX_VALUE
    let grad2 = Number.MAX_VALUE
    let int1 = 0
    let int2 = 0

    if (Math.abs(b) > 0.00001) {
      grad1 = -a / b
      int1 = -c / b
    }

    if (Math.abs(otherSegment.getB()) > 0.00001) {
      grad2 = -otherSegment.getA() / otherSegment.getB()
      int2 = -otherSegment.getC() / otherSegment.getB()
    }

    if (grad1 == Number.MAX_VALUE) {
      if (grad2 == Number.MAX_VALUE) {
        if (-c / a != -otherSegment.getC() / otherSegment.getA()) {
          return Relation.SEPARATE
        }

        if (
          y1 >= Math.min(otherSegment.getPy1(), otherSegment.getPy2()) &&
          y1 <= Math.max(otherSegment.getPy1(), otherSegment.getPy2())
        ) {
          xi = x1
          yi = y1
          return Relation.INTERSECTS
        }

        if (
          y2 >= Math.min(otherSegment.getPy1(), otherSegment.getPy2()) &&
          y2 <= Math.max(otherSegment.getPy1(), otherSegment.getPy2())
        ) {
          xi = x2
          yi = y2
          return Relation.INTERSECTS
        }

        return Relation.SEPARATE
      }

      xi = x1
      yi = grad2 * xi + int2

      if (
        (y1 - yi) * (yi - y2) < -0.00001 ||
        (otherSegment.getPy1() - yi) * (yi - otherSegment.getPy2()) < -0.00001
      ) {
        return Relation.SEPARATE
      }

      if (Math.abs(otherSegment.getA()) < 0.00001) {
        if (
          (otherSegment.getPx1() - xi) * (xi - otherSegment.getPx2()) <
          -0.00001
        ) {
          return Relation.SEPARATE
        }
        return Relation.INTERSECTS
      }
      return Relation.INTERSECTS
    }

    if (grad2 == Number.MAX_VALUE) {
      xi = otherSegment.getPx1()
      yi = grad1 * xi + int1

      if (
        (otherSegment.getPy1() - yi) * (yi - otherSegment.getPy2()) <
          -0.00001 ||
        (y1 - yi) * (yi - y2) < -0.00001
      ) {
        return Relation.SEPARATE
      }

      if (Math.abs(a) < 0.00001) {
        if ((x1 - xi) * (xi - x2) < -0.00001) {
          return Relation.SEPARATE
        }
        return Relation.INTERSECTS
      }
      return Relation.INTERSECTS
    }

    if (grad1 == grad2) {
      if (int1 != int2) {
        return Relation.SEPARATE
      }

      if (
        x1 >= Math.min(otherSegment.getPx1(), otherSegment.getPx2()) &&
        x1 <= Math.max(otherSegment.getPy1(), otherSegment.getPy2())
      ) {
        xi = x1
        yi = y1
        return Relation.INTERSECTS
      }

      if (
        x2 >= Math.min(otherSegment.getPx1(), otherSegment.getPx2()) &&
        x2 <= Math.max(otherSegment.getPx1(), otherSegment.getPx2())
      ) {
        xi = x2
        yi = y2
        return Relation.INTERSECTS
      }

      return Relation.SEPARATE
    }

    xi = (int2 - int1) / (grad1 - grad2)
    yi = grad1 * xi + int1

    if (
      (x1 - xi) * (xi - x2) < -0.00001 ||
      (otherSegment.getPx1() - xi) * (xi - otherSegment.getPx2()) < -0.00001
    ) {
      return Relation.SEPARATE
    }
    return Relation.INTERSECTS
  }

  this.getPx1 = function () {
    return x1
  }

  this.getPy1 = function () {
    return y1
  }

  this.getPx2 = function () {
    return x2
  }

  this.getPy2 = function () {
    return y2
  }

  this.isUndefined = function () {
    return undef
  }

  this.getA = function () {
    return a
  }

  this.getB = function () {
    return b
  }

  this.getC = function () {
    return c
  }

  this.getIntersectionX = function () {
    return xi
  }

  this.getIntersectionY = function () {
    return yi
  }

  this.getLength = function (tx1, ty1, tx2, ty2) {
    const dx = tx2 - tx1
    const dy = ty2 - ty1
    return Math.sqrt(dx * dx + dy * dy)
  }
}

const Relation = {
  LEFT: 1,
  RIGHT: 2,
  INTERSECTS: 3,
  AHEAD: 4,
  BEHIND: 5,
  SEPARATE: 6,
  UNDEFINED: 7,
}
