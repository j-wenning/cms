import React from 'react';
import ProductCard from './ProductCard';
import PriceScale from './PriceScale';
import { buildQuery } from './URI';

export default class ProductList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      offset: 0,
      limit: 0,
      totalResults: 0,
      products: [],
      range: [0, 0]
    };
  }

  setRange(range) { this.setState({ range }); }

  formQuery() {
    let [min, max] = this.state.range.map(val => parseInt(val) || 0);
    const { offset } = this.state;
    return buildQuery({ offset, min, max }, window.location.search);
  }

  handleSubmit(e) {
    e.preventDefault();
    window.location.replace(`/search` + this.formQuery());
  }

  componentDidMount() {
    (async () => {
      const query = !this.props.noQuery ? window.location.search : '';
      const res = await fetch('/api/products' + query);
      const data = await res.json();
      if (res.ok) {
        const { meta: { search, offset, limit, totalResults }, products } = data;
        this.setState({ search, offset, limit, totalResults, products });
      }
      else console.error(data);
    })();
  }

  render() {
    const offset = parseInt(this.state.offset);
    const offsetEnd = offset + this.state.products.length;
    const results = this.state.totalResults;
    const search = this.state.search;
    return (
      <div className='container-fluid'>
        <div className='row'>
          <div className='col-12 bg-light py-3'>
            <h3 className='m-0'>Displaying {offset} - {offsetEnd} of {results} results for <span className='text-primary'>"{search}"</span></h3>
          </div>
        </div>
        <div className='row'>
          <div className='d-lg-block col-12 col-lg-3 min-vh-lg-100 navbar navbar-expand-lg align-items-start navbar-dark bg-dark'>
            <h1 className='navbar-brand'>Filters</h1>
            <button
              className='navbar-toggler'
              type='button'
              data-toggle='collapse'
              data-target='#searchNav'
              aria-controls='searchNav'
              aria-expanded='false'
              aria-label='Toggle navigation'>
              <span className='navbar-toggler-icon'></span>
            </button>
            <div className='collapse navbar-collapse' id='searchNav'>
              <ul className='navbar-nav mr-auto'>
                <li className='nav-item form-group'>
                  <form onSubmit={e => this.handleSubmit(e)}>
                    <h4 className='navbar-text'>Price Scale</h4>
                    <PriceScale setRange={range => this.setRange(range)} />
                    <button className='btn btn-primary' type='submit'>Submit</button>
                  </form>
                </li>
              </ul>
            </div>
          </div>
          <div className='col-12 col-lg-9 mt-3 mt-lg-0'>
            <div className='container-fluid'>
              <div className='row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5'>
                {
                  this.state.products.map(product => (
                    <ProductCard
                      product={product}
                      hideDesc={false}
                      className='col'
                      imgClass='img-thumbnail-3 img-md-thumbnail-2 img-lg-thumbnail-3 img-xl-thumbnail-4'
                      descClass='description-h-5 description-lines-4'
                      key={product.id} />
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
