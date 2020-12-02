import React from 'react';
import ProductCard from './ProductCard';
import PriceScale from './PriceScale';
import { buildQuery } from './URI';
import { getAdjVals } from './AdjacentValues';

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

  applyQuery() { window.location.assign(`/search` + this.formQuery()); }

  queryOffset(offset) { this.setState({ offset }, () => this.applyQuery()); }

  handleSubmit(e) {
    e.preventDefault();
    this.applyQuery();
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
    const limit = this.state.limit;
    const currentPage = offset / limit + 1;
    const totalPages = Math.ceil(results / limit);
    const pagesArr = getAdjVals(currentPage, 2, 1, totalPages);
    return (
      <div className='container-fluid'>
        <div className='row'>
          <div className='col-12 bg-light py-3'>
            <h4 className='m-0'>Displaying {offset + 1} - {offsetEnd} of {results} results for <span className='text-primary'>"{search}"</span></h4>
          </div>
        </div>
        <div className='row'>
          <div className='d-lg-block col-12 col-lg-3 navbar navbar-expand-lg align-items-start navbar-dark bg-dark'>
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
              <ul className='navbar-nav w-100 mr-auto'>
                <li className='nav-item w-100 form-group'>
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
              {
                results > this.state.limit &&
                <div className='row my-5'>
                  <div className='col-6 col-md-4 mt-3 mt-md-0'>
                    <button
                      onClick={() => this.queryOffset(offset - limit)}
                      className='btn btn-outline-primary'
                      disabled={offset <= 0}
                      type='button'>
                      <img
                        className='mr-3 d-none d-md-inline-block'
                        src='/bootstrap/chevron-left.svg'
                        alt=''/>
                      <span>Previous</span>
                    </button>
                  </div>
                  <div className='col-12 col-md-4 order-first order-md-0 d-flex justify-content-between'>
                    {
                      pagesArr.map(page => {
                        const isCurrentPage = page === currentPage;
                        return (
                          <button
                            onClick={() => this.queryOffset(limit * (page - 1))}
                            disabled={isCurrentPage}
                            className={`btn ${isCurrentPage ? 'btn-primary' : 'btn-outline-primary'} border-0`}
                            key={page}
                            type='button'>{page}</button>
                        )
                      })
                    }
                  </div>
                  <div className='col-6 col-md-4 mt-3 mt-md-0 text-right'>
                    <button
                      onClick={() => this.queryOffset(offset + limit)}
                      disabled={offsetEnd >= results}
                      className='btn btn-outline-primary'
                      type='button'>
                      <span>Next</span>
                      <img
                        className='ml-3 d-none d-md-inline-block'
                        src='/bootstrap/chevron-right.svg'
                        alt=''/>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
};
