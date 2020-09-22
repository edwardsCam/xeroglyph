import { init as initProps, getProp } from 'utils/propConfig.ts'
import * as vida from './progressive-camera'

export default (s) => {
  initProps('motionDetection', {
    'Hide Image': {
      type: 'boolean',
      default: true,
    },
    'Show Threshold Image': {
      type: 'boolean',
      default: false,
      when: () => !get('Hide Image'),
    },
    'Draw Bounding Boxes': {
      type: 'boolean',
      default: false,
    },
    'Show Blob Info': {
      type: 'boolean',
      when: () => get('Draw Bounding Boxes'),
    },
    'Draw Blobs': {
      type: 'boolean',
      default: true,
    },
    'Blob Resolution': {
      type: 'number',
      when: () => get('Draw Blobs'),
      default: 60,
      min: 3,
    },
    imageFilterThreshold: {
      type: 'number',
      default: 0.25,
      min: 0,
      max: 1,
      step: 0.01,
    },
    imageFilterFeedback: {
      type: 'number',
      default: 0.94,
      min: 0,
      max: 1,
      step: 0.005,
    },
  })
  const get = (prop) => getProp('motionDetection', prop)
  const getProps = () => ({
    hideImage: get('Hide Image'),
    showThresholdImage: get('Show Threshold Image'),
    drawBoundingBox: get('Draw Bounding Boxes'),
    showBlobInfo: get('Show Blob Info'),
    drawBlobs: get('Draw Blobs'),
    blobResolution: get('Blob Resolution'),
    imageFilterThreshold: get('imageFilterThreshold'),
    imageFilterFeedback: get('imageFilterFeedback'),
  })

  s.setup = () => {
    vida.setup(s)
  }

  s.draw = () => {
    const props = getProps()
    vida.draw(s, props)
  }
}
