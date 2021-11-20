import { progressAlongLine } from './math'
import times from './times'

type Wat = { time: number; cb: () => any }

export const growLine = (
  [p1, p3]: [Point, Point],
  time: number,
  resolution: number,
  s: any
): Wat[] => {
  const build = (i: number): Wat => ({
    time: (time * i) / resolution,
    cb: () => {
      const p2 = progressAlongLine(p1, p3, (i + 1) / resolution)
      s.line(p1.x, p1.y, p2.x, p2.y)
    },
  })

  return times(resolution, build)
}
