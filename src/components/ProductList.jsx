import React from 'react';
import ProductCard from './ProductCard';
import PriceScale from './PriceScale';
import { buildQuery } from './URI';

export default class ProductList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { products: [] };
    this.getRangeCB = () => {};
    this.query = !props.noQuery;
  }

  componentDidMount() {
    this.query = this.query
      ? document.location.search
      : '';
    (async () => {
      const res = await fetch('/api/products' + this.query);
      const data = await res.json();
      if (res.ok) this.setState({ products: data });
      else console.error(data);
    })();
  }

  getRange(cb) { this.getRangeCB = cb; }

  handleSubmit(e) {
    e.preventDefault();
    const [min, max] = this.getRangeCB();
    const query = buildQuery({ min, max }, window.location.search);
    window.location.replace(`/search` + query);
  }

  render() {
    return (
      <div className='container-fluid'>
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
                    <PriceScale getRange={cb => this.getRange(cb)} />
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
