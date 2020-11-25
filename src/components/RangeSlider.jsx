import React from 'react';
import $ from 'jquery';

export default class RangeSlider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      vals: props.vals || [0, 100],
      boundsMin: props.min || 0,
      boundsMax: props.max || 100,
      outputHeight: 0
    };
    this.className = props.className || '';
    this.updateVals = props.updateVals || (() => {});
    this.outRef = React.createRef();
    this._refs = props.vals.map(() => React.createRef());
  }

  updateBounds(e, index) {
    const newVals = [...this.state.vals];
    newVals[index] = Number(e.currentTarget.value);
    this.setState({ vals: newVals });
    this.updateVals(newVals);
  }

  componentDidUpdate() {
    const outputHeight = $(this.outRef.current).css('height');
    this._refs.forEach((ref, i) => {
      if (ref.current) ref.current.value = this.state.vals[i];
    });
    if (this.state.outputHeight !== outputHeight) this.setState({ outputHeight });
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
    };
    this.state.vals.forEach((val, i) => (rangeStyle['--v' + i] = val));
    return (
      <div style={{ '--oh': this.state.outputHeight }} className={'multi-range-container ' + this.className}>
        <div
          role='group'
          aria-labelledby='multi-lbl'
          className='multi-range'
          style={rangeStyle}>
          {
            this.state.vals.map((val, i) => {
              return (<React.Fragment key={i}>
                <label htmlFor={'v' + i} className="sr-only">Value {i}</label>
                <input
                  onChange={e => this.updateBounds(e, i)}
                  min={this.state.boundsMin}
                  defaultValue={val}
                  max={this.state.boundsMax}
                  ref={this._refs[i]}
                  type='range'
                  id={'v' + i} />
                <output ref={this.outRef} htmlFor={'v' + i} style={{ '--c': `var(--v${i})` }} />
              </React.Fragment>
              )
            })
          }
        </div>
      </div>
    );
  }
};
