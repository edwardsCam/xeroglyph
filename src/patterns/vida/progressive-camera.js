import Vida from '../../p5.vida'

let myCapture // camera
let myVida // VIDA

const HEIGHT = 420
const WIDTH = (HEIGHT * 4) / 3

function initCaptureDevice(s) {
  try {
    myCapture = s.createCapture(s.VIDEO)
    myCapture.size(WIDTH, HEIGHT)
    myCapture.elt.setAttribute('playsinline', '')
    myCapture.hide()
    console.log(
      '[initCaptureDevice] capture ready. Resolution: ' +
        myCapture.width +
        ' ' +
        myCapture.height
    )
  } catch (_err) {
    console.log('[initCaptureDevice] capture error: ' + _err)
  }
}

export function setup(s) {
  s.createCanvas(WIDTH * 2, HEIGHT * 2) // we need some space...
  initCaptureDevice(s) // and access to the camera
  myVida = new Vida(s) // create the object

  myVida.progressiveBackgroundFlag = true
  myVida.mirror = myVida.MIRROR_HORIZONTAL
  myVida.handleBlobsFlag = true

  myVida.normMinBlobMass = 0.0002 // uncomment if needed
  myVida.normMaxBlobMass = 4 // uncomment if needed

  myVida.normMinBlobArea = 0.0002 // uncomment if needed
  myVida.normMaxBlobArea = 4 // uncomment if needed

  //myVida.trackBlobsMaxNormDist = 0.3; // uncomment if needed
  //myVida.rejectBlobsMethod = myVida.REJECT_NONE_BLOBS; // uncomment if needed
  myVida.approximateBlobPolygonsFlag = true

  // s.frameRate(30) // set framerate
}

export function draw(s, props) {
  myVida.approximateBlobPolygonsFlag = props.drawBlobs
  myVida.imageFilterThreshold = props.imageFilterThreshold
  myVida.imageFilterFeedback = props.imageFilterFeedback
  myVida.pointsPerApproximatedBlobPolygon = props.blobResolution
  myVida.update(myCapture)
  s.image(myVida.currentImage, 0, 0)
  s.image(myVida.backgroundImage, WIDTH, 0)
  s.image(myVida.differenceImage, 0, HEIGHT)
  if (!props.hideImage) {
    s.image(
      props.showThresholdImage ? myVida.thresholdImage : myVida.currentImage,
      WIDTH,
      HEIGHT
    )
  } else {
    // s.fill(0, 0, 0)
    // s.rect(WIDTH, HEIGHT, WIDTH, HEIGHT)
  }
  s.noStroke()
  s.fill(255, 255, 255)
  s.text('camera', 20, 20)
  s.text('progressive background image', WIDTH + 20, 20)
  s.text('difference image', 20, HEIGHT + 20)
  s.text('threshold image', WIDTH + 20, HEIGHT + 20)

  myVida.drawBlobs(WIDTH, HEIGHT, props)
}
