import React from 'react'
import P5Wrapper from 'react-p5-wrapper'
import ReactDOM from 'react-dom'

import Poi from 'patterns/poi/index.ts'
import { board, city } from 'patterns/chipboard/index.ts'
import InfinityCycle from 'patterns/infinity-cycle'
import Swirl from 'patterns/swirl'
import JoyDivision from 'patterns/joy-division/index.ts'
import Coral from 'patterns/coral'
import Coral3D from 'patterns/coral-3d'
import Cubes from 'patterns/cubes'
import Field from 'patterns/field/index.ts'
import Chonks from 'patterns/chonks/index.ts'
import PixelSorting from 'patterns/pixel-sorting/index.ts'
// import Checkers from 'patterns/checkers'
import Eye from 'patterns/eye'
// import ISpy from 'patterns/i-spy'
// import Trinkets from 'patterns/trinkets'
import Tiles from 'patterns/tiles/index.ts'
import Vida from 'patterns/vida'
// import VoiceRecognition from 'patterns/voice-recognition'
import PandorasBox from 'patterns/pandoras-box/index.ts'
import Squid from 'patterns/squid/index.ts'

import HelpModal from 'components/helpModal.tsx'
import Knobs from 'components/knobs.tsx'
import HomepageLink from 'components/homepageLink.tsx'

const patternMap = {
  pixelSorting: {
    label: 'Pixel Sorting',
    component: PixelSorting,
  },
  chonks: {
    label: 'Chonks',
    component: Chonks,
  },
  field: {
    label: 'Field',
    component: Field,
  },
  poi: {
    label: 'Poi',
    component: Poi,
  },
  squid: {
    label: 'Squid',
    component: Squid,
  },
  chipboard: {
    label: 'Chipboard',
    component: board,
  },
  tiles: {
    label: 'Tiles',
    component: Tiles,
  },
  motionDetection: {
    label: 'Motion Detection',
    component: Vida,
  },
  pandorasBox: {
    label: "Pandora's Box",
    component: PandorasBox,
  },
  eye: {
    label: 'Eye',
    component: Eye,
  },
  cubes: {
    label: 'Cubes',
    component: Cubes,
  },
  coral: {
    label: 'Coral',
    component: Coral,
  },
  swirl: {
    label: 'Swirl',
    component: Swirl,
  },
  joyDivision: {
    label: 'Joy Division',
    component: JoyDivision,
  },
  infinity: {
    label: 'Infinity Cycle',
    component: InfinityCycle,
  },
  city: {
    label: 'Cityscape',
    component: city,
  },
  coral3d: {
    label: 'Coral 3D',
    component: Coral3D,
  },
}

type State = {
  init: boolean
  pattern: string | null
  isShowingHelpModal: boolean
  isShowingKnobs: boolean
}

class App extends React.Component<{}, State> {
  state: State = {
    init: true,
    pattern: null,
    isShowingHelpModal: true,
    isShowingKnobs: false,
  }

  initPattern() {
    const begin = () => {
      this.setState({
        isShowingHelpModal: false,
        isShowingKnobs: false,
        init: false,
      })
      window.removeEventListener('click', begin)
    }

    setTimeout(() => {
      window.addEventListener('click', begin)
      window.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'i':
          case 'Escape':
            if (this.state.init) {
              begin()
            } else {
              this.setState((prevState) => ({
                isShowingHelpModal: !prevState.isShowingHelpModal,
                isShowingKnobs: false,
              }))
            }
            break
          case 'o':
            if (!this.state.init) {
              this.setState((prevState) => ({
                isShowingKnobs: !prevState.isShowingKnobs,
                isShowingHelpModal: false,
              }))
            }
            break
        }
      })
    })
  }

  componentDidMount() {
    window.addEventListener('popstate', function () {
      window.history.go(0)
    })

    const { search } = window.location
    if (search && search.startsWith('?pattern=')) {
      const [, pattern] = search.split('?pattern=')
      this.setState({ pattern })
    }
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.pattern && !prevState.pattern) {
      this.initPattern()
    }
  }

  render() {
    return this.state.pattern ? this.renderPattern() : this.renderIndex()
  }

  renderPattern() {
    const { pattern, init, isShowingKnobs, isShowingHelpModal } = this.state
    return (
      pattern && (
        <div>
          {!init && <P5Wrapper sketch={patternMap[pattern].component} />}
          {(isShowingHelpModal || init) && (
            <HelpModal pattern={pattern} initial={init} />
          )}
          {isShowingKnobs && <Knobs pattern={pattern} />}
        </div>
      )
    )
  }

  renderIndex() {
    const patterns = Object.keys(patternMap)
    return (
      <div className="index-list">
        <div className="index-column">
          {patterns
            .filter((_p, i) => !(i % 2))
            .map((pattern) => (
              <HomepageLink
                key={pattern}
                {...this.generateLinkProps(pattern)}
              />
            ))}
        </div>
        <div className="index-column">
          {patterns
            .filter((_p, i) => i % 2)
            .map((pattern) => (
              <HomepageLink
                key={pattern}
                {...this.generateLinkProps(pattern)}
              />
            ))}
        </div>
      </div>
    )
  }

  generateLinkProps = (pattern: string) => {
    const config = patternMap[pattern]
    return {
      label: config.label,
      href: `/?pattern=${pattern}`,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        window.history.pushState({ pattern }, '', `?pattern=${pattern}`)
        this.setState({ pattern })
      },
      className: pattern,
    }
  }
}

ReactDOM.render(<App />, document.body)
