

export default s => {


  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight, s.WEBGL)
  }

  s.draw = () => {
    s.clear()
    s.rotateY(s.frameCount * 0.01)
    s.quad(
      0, 0, 0,
      10, 20, 30,
      40, 50, 60,
      70, 80, 90
    )
  }
}
