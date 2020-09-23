import React from 'react'

const infoMap = {
  poi: {
    title: 'Poi',
    instructions: [],
    description: [],
  },
  swirl: {
    title: 'Swirl',
    instructions: [],
    description: [
      'Particles floating in space!',
      'They will gravitate toward your mouse.',
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
      'Pause by either clicking or hitting spacebar.',
      'Hit ctrl+alt+s to save the image.',
    ],
    description: [
      'The algorithm is as follows:',
      'Start with a rectangle, the size of your screen.',
      'At random locations within this rectangle, draw a verticle line and a horizontal line, thus chopping it into four quadrants.',
      'Each quadrant (e.g. top-left, top-right, bottom-right, bottom-left), gets a corresponding fill color.',
      'On each of these quadrants, repeat the same process (chop it into fourths, then chop each of those into fourths, and so on).',
      'Continue this until each slice reaches a certain size, which you can also customize.',
    ],
  },
  city: {
    title: 'Cityscape',
    instructions: [],
    description: [
      'Randomly generate a cityscape!',
      'Follows the same algorithm as "Chipboard", just extended to three dimensions.',
    ],
  },
  joyDivision: {
    title: 'Joy Division',
    instructions: [],
    description: [
      'The algorithm is as follows:',
      'Start with a number of lines, then have them randomly meander up and down, while moving at a constant rate to the side.',
      'About halfway through the screen, a different mode is triggered where each line will try to get back to its starting Y position.',
      "They gravitate toward their starting position using Newton's formula for universal gravitation, actually.",
      'So they behave similarly to planets in orbit, for instance.',
      'As each line gets pulled closer to its center of gravity, the pull gets stronger which causes it to accelerate faster.',
      'When it finally does reach its target, it has too much velocity and it overshoots, before eventually being pulled back again.',
      'Combined with the constant horizontal movement, this creates a cool mountain-like effect.',
    ],
  },
  coral: {
    title: 'Coral',
    instructions: [],
    description: [
      'This is based on growth patterns seen in self-folding organisms in nature, such as coral, red cabbage, walnuts, even the human brain.',
      'Essentially, the tissue is trying to grow as large as possible, within the smallest amount of space, but with one constraint:',
      'it also wants to keep as much distance from its neighbors as possible.',
      '',
      'This makes sense if you think about it from a survival perspective: a colony thrives by growing, and individuals within the colony benefit by being near their friends, but they still need some space to grow.',
    ],
  },
  coral3d: {
    title: 'Coral 3D',
    instructions: [],
    description: [
      'This is essentially the same algorithm as "Coral", but extended to three dimensions.',
    ],
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
  eye: {
    title: 'Eye',
    instructions: [],
    description: [],
  },
  iSpy: {
    title: 'I spy with my little eye',
    instructions: [],
    description: [],
  },
  trinkets: {
    title: 'trinkets',
    instructions: [],
    description: [],
  },
  tiles: {
    title: 'tiles',
    instructions: ['Click or press space to regenerate.'],
    description: [],
  },
  motionDetection: {
    title: 'Motion Detection',
    instructions: [],
    description: [],
  },
  voiceRecognition: {
    title: 'Voice Recognition',
    instructions: [],
    description: [],
  },
  pandorasBox: {
    title: "Pandora's Box",
    instructions: [
      'You can move your mouse to change perspective, and scroll to zoom.',
      '',
      'The "unity" parameter determines how likely tiles are to combine with eachother.',
      'A unity of 0 means no tiles will combine, so you end up with an array of little squares.',
      'A unity of 1 means all (or most) tiles will combine, so you pretty much end up with one big square on each face.',
    ],
    description: [],
  },
}

export default class HelpModal extends React.Component<{
  initial?: boolean
  pattern: string
}> {
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
