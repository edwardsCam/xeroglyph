import { init as initProps, getProp } from 'utils/propConfig'
import zigzag from './zigzag'

export default s => {
  const get = prop => getProp('trinkets', prop)
  const getProps = () => ({})

  initProps('trinkets', {})

  let zig
  function initialize() {
    zig = zigzag(s)
  }

  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    initialize()
  }

  let padding = 0
  let h = 4

  s.draw = () => {
    s.clear()

    zig.draw({
      height: h * 32,
      padding,
      dir: 0,
      color: [255, 255, 255],
      isInverted: false,
      n: 8,
      start: {
        x: 100,
        y: 0,
      },
    })

    zig.draw({
      height: h * 16,
      padding,
      dir: 2,
      color: [255, 255, 255],
      isInverted: false,
      n: 16,
      start: {
        x: 100,
        y: 128,
      },
    })

    zig.draw({
      height: h * 8,
      padding,
      dir: 0,
      color: [255, 255, 255],
      isInverted: false,
      n: 32,
      start: {
        x: 100,
        y: 192,
      },
    })

    zig.draw({
      height: h * 4,
      padding,
      dir: 2,
      color: [255, 255, 255],
      isInverted: false,
      n: 64,
      start: {
        x: 100,
        y: 224,
      },
    })

    zig.draw({
      height: h * 2,
      padding,
      dir: 0,
      color: [255, 255, 255],
      isInverted: false,
      n: 128,
      start: {
        x: 100,
        y: 240,
      },
    })

    zig.draw({
      height: h,
      padding,
      dir: 0,
      color: [255, 255, 255],
      isInverted: false,
      n: 256,
      start: {
        x: 100,
        y: 248,
      },
    })

    zig.draw({
      height: h,
      padding,
      dir: 2,
      color: [255, 255, 255],
      isInverted: false,
      n: 256,
      start: {
        x: 100,
        y: 252,
      },
    })

    zig.draw({
      height: h * 2,
      padding,
      dir: 2,
      color: [255, 255, 255],
      isInverted: false,
      n: 128,
      start: {
        x: 100,
        y: 256,
      },
    })

    zig.draw({
      height: h * 4,
      padding,
      dir: 0,
      color: [255, 255, 255],
      isInverted: false,
      n: 64,
      start: {
        x: 100,
        y: 264,
      },
    })

    zig.draw({
      height: h * 8,
      padding,
      dir: 2,
      color: [255, 255, 255],
      isInverted: false,
      n: 32,
      start: {
        x: 100,
        y: 280,
      },
    })

    zig.draw({
      height: h * 16,
      padding,
      dir: 0,
      color: [255, 255, 255],
      isInverted: false,
      n: 16,
      start: {
        x: 100,
        y: 312,
      },
    })

    zig.draw({
      height: h * 32,
      padding,
      dir: 2,
      color: [255, 255, 255],
      isInverted: false,
      n: 8,
      start: {
        x: 100,
        y: 376,
      },
    })

    // padding = 0.5 + Math.cos(s.frameCount * 0.01) / 2
    // h = 0.5 + Math.cos(s.frameCount * 0.01) / 2
  }
}
