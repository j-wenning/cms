import React from 'react';
import $ from 'jquery';

export default class RangeSlider extends React.Component {
  constructor(props) {
    super(props);
    this.state = { outputHeight: 0 };
    this.outRef = React.createRef();
  }

  updateBounds(e, index) {
    this.props.vals[index] = e.currentTarget.value;
    this.props.updateVals?.(this.props.vals);
  }

  componentDidMount() { this.setState({ outputHeight: $(this.outRef.current).css('height') }) }

  render() {
    return (
      <div
        style={{ '--oh': this.state.outputHeight }}
        className={'multi-range-container ' + this.props.className}>
        <div
          role='group'
          aria-labelledby='multi-lbl'
          className='multi-range'
          style={{
            '--min': this.props.min,
            '--max': this.props.max,
            '--fill': this.props.vals.map(val => `
              linear-gradient(
                90deg,
                red calc(var(--r) + (${val} - var(--min)) / var(--dif) * var(--uw)),
                transparent 0
              )
            `).join(',').replace(/\s+/, ' ')
          }}>
          {
            this.props.vals.map((val, i) => {
              return (
                <React.Fragment key={i}>
                  <label htmlFor={'v' + i} className="sr-only">Value {i}</label>
                  <input
                    onChange={e => this.updateBounds(e, i)}
                    min={this.props.min}
                    value={val}
                    max={this.props.max}
                    type='range'
                    id={'v' + i} />
                  <output ref={this.outRef} htmlFor={'v' + i} style={{ '--c': val }} />
                </React.Fragment>
              );
            })
          }
        </div>
      </div>
    );
  }
};
