import React from 'react';

export default class PriceInput extends React.Component {
  handleChange(e) { this.props.onChange(e.target.value); }

  handleBlur() { this.props.onBlur(); }

  render() {
    return (
      <div className='input-group'>
        <div className='input-group-prepend'>
          <span className='input-group-text font-weight-bold'>$</span>
        </div>
        <input
          onChange={e => this.handleChange(e)}
          onBlur={() => this.handleBlur()}
          min={this.props.min}
          max={this.props.max}
          className='form-control'
          type='number'
          aria-label='Amount (to the nearest dollar)'
          id='upperPriceBound'
          value={this.props.val} />
      </div>
    );
  }

}
