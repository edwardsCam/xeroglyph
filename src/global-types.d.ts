export {}

type WEBGL = 'webgl'
type P2D = 'p2d'
type CLOSE = 'close'
type HSB = 'hsb'
type RGB = 'rgb'
type SQUARE = 'square'
type ROUND = 'round'

declare global {
  type Sketch = {
    setup: () => any
    draw: () => any
    clear: () => any
    fill: (
      a: string | number | number[],
      b?: number,
      c?: number,
      d?: number
    ) => any
    stroke: (
      a: string | number | number[],
      b?: number,
      c?: number,
      d?: number
    ) => any
    strokeWeight: (weight: number) => any
    noise: (x: number, y: number) => number
    createCanvas: (width: number, height: number, renderer?: WEBGL | P2D) => any
    circle: (x: number, y: number, d: number) => any
    line: (x1: number, y1: number, x2: number, y2: number) => any
    vertex: (x: number, y: number) => any
    noStroke: () => any
    noFill: () => any
    beginShape: () => any
    endShape: (mode?: CLOSE) => any
    map: (
      value: number,
      start1: number,
      stop1: number,
      start2: number,
      stop2: number,
      withinBounds?: boolean
    ) => any
    get: (x: number, y: number) => [number, number, number]
    colorMode: (mode: HSB | RGB, val?: number) => any
    frameRate: (val: number) => any
    preload: () => any
    loadImage: (path: string) => any
    strokeCap: (type: SQUARE | ROUND) => any
    strokeJoin: (type: SQUARE | ROUND) => any
    image: (
      img: any,
      x: number,
      y: number,
      width: number,
      height: number
    ) => any
    rect: (x: number, y: number, width: number, height: number) => any
    ellipse: (x: number, y: number, width: number, height: number) => any
    WEBGL: WEBGL
    P2D: P2D
    CLOSE: CLOSE
    HSB: HSB
    SQUARE: SQUARE
    ROUND: ROUND
  }

  interface Point {
    x: number
    y: number
    z?: number
  }

  type Line = [Point, Point]
}
