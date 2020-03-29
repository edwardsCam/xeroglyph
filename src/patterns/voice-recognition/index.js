import { Speech, SpeechRec } from '../../p5.speech'

export default (s) => {
  let speecRec
  s.setup = () => {
    s.createCanvas(window.innerWidth, window.innerHeight)
    s.textFont('Helvetica', 24)
    s.fill(255, 255, 255)

    speecRec = new SpeechRec()
    speecRec.onResult = () => {
      s.clear()
      s.text(speecRec.resultString, 24, 48)
    }
    speecRec.start(true, true)
  }

  s.draw = () => {}
}
