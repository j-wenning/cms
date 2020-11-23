import React from 'react'

export default class RangeSlider extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      vals: props.vals || [0, 100],
      boundsMin: props.min || 0,
      boundsMax: props.max || 100
    }
    this.title = props.title || 'Range Slider'
    this.className = props.className || ''
    this.titleClass = props.titleClass || ''
    this.updateVals = props.updateVals || (() => {})
  }

  updateBounds(e, index) {
    const newVals = [...this.state.vals]
    newVals[index] = Number(e.currentTarget.value)
    this.setState({ vals: newVals })
    this.updateVals(newVals)
  }

  render() {
    const rangeStyle = {
      '--min': this.state.boundsMin,
      '--max': this.state.boundsMax,
      '--fill': this.state.vals.map((val, i) => `
        linear-gradient(
          90deg,
          red calc(var(--r) + (var(--v${i}) - var(--min)) / var(--dif) * var(--uw)),
          transparent 0
        )
      `).join(',').replace(/\s+/, ' ')
    }
    this.state.vals.forEach((val, i) => (rangeStyle['--v' + i] = val))
    return (
      <div className={'multi-range-container ' + this.className}>
        <div
          role='group'
          aria-labelledby='multi-lbl'
          className='multi-range'
          style={rangeStyle}>
          <div id='multi-lbl' className={this.titleClass}>{this.title}</div>
          {
            this.state.vals.map((val, i) => (
              <React.Fragment key={i}>
                <label htmlFor={'v' + i} className="sr-only">Value {i}</label>
                <input
                  onChange={e => this.updateBounds(e, i)}
                  type='range'
                  id={'v' + i}
                  min={this.state.boundsMin}
                  defaultValue={val}
                  max={this.state.boundsMax} />
                <output htmlFor={'v' + i} style={{ '--c': `var(--v${i})` }} />
              </React.Fragment>
            ))
          }
        </div>
      </div>
    )
  }
}
