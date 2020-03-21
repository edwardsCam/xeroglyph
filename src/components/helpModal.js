import React from 'react'

const infoMap = {
  swirl: {
    title: 'Swirl',
    instructions: [],
    description: [
      'Particles floating in space, they will gravitate toward your mouse.',
    ],
  },
  infinity: {
    title: 'Infinity Cycle',
    instructions: [],
    description: [
      'A series of lines that rotate in a sinusoid. Several things are happening here:',
      '1: the lines are forever spinning in a circle,',
      '2: the camera is rotating around the center, and',
      '3: as it goes from one side to another, the frequency of the sinusoid is increasing. This gives the illusion of the wave "stretching" or "twisting" itself.',
      '...',
      'You can pause/re-enable any of these three mechanisms.',
      '* Hit `q` to toggle the "twisting" effect, essentially keeping the waveform at a constant shape.',
      '* Hit `w` to toggle the sinusoidal movement. Note that even while this is paused, you can continue the twisting effect.',
      '* Hit `e` to toggle the camera rotation.',
    ],
  },
  chipboard: {
    title: 'Chipboard',
    instructions: [
      'Pause by clicking or hitting spacebar.',
      'Hit ctrl+alt+s to save the image.',
    ],
    description: [
      'Start with a rectangle.',
      'At random locations within the rectangle, draw a verticle line and a horizontal line, thus chopping it into four smaller quadrants.',
      'Each quadrant (e.g. top-left, top-right, bottom-right, bottom-left), has a corresponding fill color.',
      'On each of these quadrants, repeat the same process.',
      'Continue this until each quadrant is smaller than the width defined by minBlankSpace.',
    ],
  },
  city: {
    title: 'Cityscape',
    instructions: [],
    description: ['Randomly generate a cityscape!'],
  },
  joyDivision: {
    title: 'Joy Division',
    instructions: [],
    description: [''],
  },
  coral: {
    title: 'Coral',
    instructions: [],
    description: [],
  },
  coral3d: {
    title: 'Coral 3D',
    instructions: [],
    description: [],
  },
  cubes: {
    title: 'Cubes',
    instructions: [],
    description: [],
  },
  checkers: {
    title: 'Checkers',
    instructions: [],
    description: [],
  },
}

export default class HelpModal extends React.Component {
  render() {
    const { initial, pattern } = this.props
    const info = infoMap[pattern]
    return info ? (
      <div className="helpModal">
        <h1>{info.title}</h1>
        <br />

        <h2>{'Instructions'}</h2>
        <p>{'At any time, hit Escape or `i` to open this info modal.'}</p>
        <p>
          {
            'Hit `o` to open an options dialog where you can tweak the parameters. Try messing around with some different options!'
          }
        </p>
        {info.instructions.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        {initial && <p>{'Click anywhere or hit Escape to begin!'}</p>}

        <br />
        <h2>{'Description'}</h2>
        {info.description.map((line, i) =>
          line === '' ? <hr key={i} /> : <p key={i}>{line}</p>
        )}
      </div>
    ) : (
      <div className="helpModal">{`Unknown pattern ${pattern}!`}</div>
    )
  }
}
