import { Point, progressAlongLine } from './math'
import times from './times'

export const growLine = (
  [p1, p2]: [Point, Point],
  time: number,
  resolution: number,
  s: any
): NodeJS.Timeout[] => {
  const build = (i: number): NodeJS.Timeout =>
    setTimeout(() => {
      const progress = progressAlongLine(p1, p2, (i + 1) / resolution)
      s.line(p1.x, p1.y, progress.x, progress.y)
    }, (time * i) / resolution)

  return times(resolution, build)
}
