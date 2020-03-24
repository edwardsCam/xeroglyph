import React from 'react'
import P5Wrapper from 'react-p5-wrapper'
import ReactDOM from 'react-dom'

import { board, city } from 'patterns/chipboard'
import InfinityCycle from 'patterns/infinity-cycle'
import Swirl from 'patterns/swirl'
import JoyDivision from 'patterns/joy-division'
import Coral from 'patterns/coral'
import Coral3D from 'patterns/coral-3d'
import Cubes from 'patterns/cubes'
import Checkers from 'patterns/checkers'
import Eye from 'patterns/eye'
import ISpy from 'patterns/i-spy'

import HelpModal from 'components/helpModal'
import Knobs from 'components/knobs'

const defaultPattern = 'chipboard'

const patternMap = {
  infinity: InfinityCycle,
  swirl: Swirl,
  chipboard: board,
  city: city,
  joyDivision: JoyDivision,
  coral: Coral,
  coral3d: Coral3D,
  cubes: Cubes,
  checkers: Checkers,
  eye: Eye,
  iSpy: ISpy,
}

const getPattern = () => {
  const patternParam = window.location.search.split('pattern=')
  return patternParam.length > 1 ? patternParam[1] : defaultPattern
}

const getSketch = () => patternMap[getPattern()]

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      init: true,
      isShowingHelpModal: false,
      isShowingKnobs: false,
    }
    document.title = getPattern()
  }

  componentDidMount() {
    const begin = () => {
      this.setState(prevState => ({ isShowingHelpModal: false, isShowingKnobs: false, init: false }))
      window.removeEventListener('click', begin)
    }

    window.addEventListener('click', begin)
    window.addEventListener('keydown', e => {
      switch (e.key) {
        case 'i':
        case 'Escape':
          if (this.state.init) {
            begin()
          } else {
            this.setState(prevState => ({ isShowingHelpModal: !prevState.isShowingHelpModal, isShowingKnobs: false }))
          }
          break
        case 'o':
          if (!this.state.init) {
            this.setState(prevState => ({ isShowingKnobs: !prevState.isShowingKnobs, isShowingHelpModal: false }))
          }
          break
      }
    })
  }

  render() {
    const pattern = getPattern()
    const { init, isShowingHelpModal, isShowingKnobs } = this.state
    return (
      <div>
        {!init && <P5Wrapper sketch={getSketch()} />}
        {(isShowingHelpModal || init) && <HelpModal pattern={pattern} initial={init} />}
        {isShowingKnobs && <Knobs pattern={pattern} />}
      </div>
    )
  }
}

ReactDOM.render(<App />, document.body)
