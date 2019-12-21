import React from 'react'

const infoMap = {
  swirl: {
    title: 'Swirl',
    description: [
      'Particles floating in space, they will gravitate toward your mouse',
    ],
  },
  infinity: {
    title: 'Infinity Cycle',
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
    description: [''],
  },
  city: {
    title: 'Cityscape',
    description: [''],
  },
}

export default class HelpModal extends React.Component {
  render() {
    const { pattern } = this.props
    const info = infoMap[pattern]
    if (!info) return null
    return (
      <div className="helpModal">
        <h1>{info.title}</h1>
        {info.description.map(d => (
          <p>{d}</p>
        ))}
      </div>
    )
  }
}
