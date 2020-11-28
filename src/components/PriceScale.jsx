import React from 'react';
import RangeSlider from './RangeSlider';
import PriceInput from './PriceInput';

export default class PriceScale extends React.Component {
  constructor(props) {
    if (!props.getRange || typeof props.getRange !== typeof (() => {})) {
      throw new Error('Missing getRange callback');
    }
    super(props);
    this.state = {
      priceRange: [0, 0],
      priceBounds: [0, 0]
    };
    props.getRange(() => this.getRange());
  }

  getRange() { return this.state.priceRange; }

  sortPrices() {
    this.setState(state => {
      state.priceRange.sort((a, b) => a - b);
      return state;
    });
  }

  updatePriceRange(vals) { this.setState({ priceRange: vals }, () => this.sortPrices()); }

  updatePriceBound(val, index) {
    this.setState(state => {
      state.priceRange[index] = parseFloat(val);
      return state;
    });
  }

  componentDidMount() {
    (async () => {
      const res = await fetch('/api/products/prices');
      const data = await res.json();
      if (res.ok) {
        let { min, max } = data;
        const query = new URLSearchParams(window.location.search);
        let qMin = query.get('min');
        let qMax = query.get('max');
        if (qMin == null) qMin = min;
        if (qMax == null) qMax = max;
        this.setState({
          priceBounds: [min, max],
          priceRange: [qMin, qMax]
        });
      }
      else console.error(data);
    })();
  }

  render() {
    return (
      <>
        <div className='form-row'>
          <div className='col-12'>
            <RangeSlider
              vals={this.state.priceRange}
              min={this.state.priceBounds[0]}
              max={this.state.priceBounds[1]}
              updateVals={vals => this.updatePriceRange(vals)}
              className='w-100' />
          </div>
        </div>
        <div className='form-row'>
          <div className='form-group col-6'>
            <label
              htmlFor='lower-price-bound'
              className='navbar-text'>Min Price</label>
            <PriceInput
              onChange={val => this.updatePriceBound(val, 0)}
              onBlur={() => this.sortPrices()}
              val={this.state.priceRange[0]}
              min={this.state.priceBounds[0]}
              max={this.state.priceBounds[1]}
              id='lower-price-bound' />
          </div>
          <div className='form-group col-6'>
            <label
              htmlFor='upper-price-bound'
              className='navbar-text'>Max Price</label>
            <PriceInput
              onChange={val => this.updatePriceBound(val, 1)}
              onBlur={() => this.sortPrices()}
              val={this.state.priceRange[1]}
              min={this.state.priceBounds[0]}
              max={this.state.priceBounds[1]}
              id='upper-price-bound' />
          </div>
        </div>
      </>
    );
  }
};
