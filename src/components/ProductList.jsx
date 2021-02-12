import React from 'react';
import { withRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import PriceScale from './PriceScale';
import { parseQuery, buildQuery } from './URI';
import { getAdjVals } from './AdjacentValues';
import { isEqual } from './Object';

class ProductList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      offset: 0,
      limit: 0,
      totalResults: 0,
      products: [],
      range: [0, 0],
      deals: false,
      shippingMethods: [],
      selectedShipping: [],
    };
  }

  setRange(range) { this.setState({ range }); }

  setShippingMethod(method, selected) {
    if (selected) this.setState({ selectedShipping: [...new Set([...this.state.selectedShipping, method])] });
    else this.setState({ selectedShipping: this.state.selectedShipping.filter(m => m !== method) });
  }

  formQuery() {
    let [min, max] = this.state.range.map(val => parseInt(val) || 0);
    const { offset, deals, selectedShipping: shippingMethods } = this.state;
    return buildQuery({ offset, min, max, deals, shippingMethods }, this.props.location.search);
  }

  applyQuery() { this.props.history.push(`/search` + this.formQuery()); }

  queryOffset(offset) { this.setState({ offset }, () => this.applyQuery()); }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ offset: 0 }, () => this.applyQuery());
  }

  doFetch() {
    const query = !this.props.noQuery ? this.props.location.search : '';
    fetch('/api/products' + query)
      .then(async res => {
        const json = await res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => {
        const { meta: { search, offset, limit, totalResults }, products } = data;
        this.setState({ search, offset, limit, totalResults, products });
      }).catch(err => console.error(err));
  }

  componentDidUpdate(prevProps) { if (!isEqual(prevProps, this.props)) this.doFetch(); }

  componentDidMount() {
    let { deals, shippingMethods: selectedShipping } = parseQuery(this.props.location.search);
    this.doFetch();
    selectedShipping = selectedShipping?.split(',')
      .map(method => {
        const parsed = parseInt(method);
        return !isNaN(parsed) && `${parsed}`.length === method.length
          ? parsed
          : null;
      }).filter(method => method !== null) || [];
    this.setState({ deals, selectedShipping });
    fetch('/api/products/shippingmethods')
      .then(async res => {
        const json = await res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => this.setState({ shippingMethods: data }))
      .catch(err => console.error(err));
  }

  render() {
    let {
      totalResults: results,
      search,
      limit,
      products,
      offset,
      deals,
      shippingMethods,
      selectedShipping,
    } = this.state;
    offset = parseInt(offset);
    const offsetEnd = offset + products.length;
    const currentPage = offset / limit + 1;
    const totalPages = Math.ceil(results / limit);
    const pagesArr = getAdjVals(currentPage, 2, 1, totalPages);

    return (
      <div className='container-fluid'>
        <div className='row'>
          <div className='col-12 bg-light py-3'>
            <h4 className='m-0'>Displaying {offset + 1} - {offsetEnd} of {results} results for <span className='text-primary'>&ldquo;{search}&rdquo;</span></h4>
          </div>
        </div>
        <div className='row'>
          <div className='d-lg-block col-12 col-lg-3 col-xl-2 navbar navbar-expand-lg align-items-start navbar-dark bg-dark'>
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
                    <div className='form-row'>
                      <div className='form-check navbar-text'>
                        <input
                          checked={deals}
                          onChange={() => this.setState({ deals: !deals })}
                          id='products-filter-deals'
                          className='form-check-input'
                          type='checkbox' />
                        <label htmlFor='products-filter-deals' className='form-check-label'>Deals</label>
                      </div>
                    </div>
                    {
                      shippingMethods.map(method => {
                        const { id, name } = method;
                        const checked = selectedShipping.includes(id);
                        return (
                          <div className='form-row' key={id}>
                            <div className='form-check navbar-text'>
                              <input
                                checked={checked}
                                onChange={() => this.setShippingMethod(id, !checked)}
                                id={'products-filter-shipping-method-' + id}
                                className='form-check-input'
                                type='checkbox' />
                              <label htmlFor={'products-filter-shipping-method-' + id} className='form-check-label'>
                                <span className='text-capitalize'>{name.toLocaleLowerCase()}</span> shipping
                              </label>
                            </div>
                          </div>
                        );
                      })
                    }
                    <div className='form-row mt-4'>
                      <button className='btn btn-primary' type='submit'>Submit</button>
                    </div>
                  </form>
                </li>
              </ul>
            </div>
          </div>
          <div className='col-12 col-lg-9 col-xl-10 mt-3 mt-lg-0'>
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
              <nav aria-label='test' className='my-5'>
                <ul className='pagination justify-content-center'>
                  <li className='page-item'>
                    <button
                      onClick={() => this.queryOffset(offset - limit)}
                      disabled={offset <= 0}
                      className={'page-link'}
                      type='button'>Previous</button>
                  </li>
                  {
                    pagesArr.map(page => {
                      const isCurrentPage = page === currentPage;
                      return (
                        <li key={page} className='page-item'>
                          <button
                            onClick={() => this.queryOffset(limit * (page - 1))}
                            disabled={isCurrentPage}
                            className={'page-link' + (isCurrentPage ? ' bg-primary text-light' : '')}
                            type='button'>{page}</button>
                        </li>
                      )
                    })
                  }
                  <li className='page-item'>
                    <button
                      onClick={() => this.queryOffset(offset + limit)}
                      disabled={offsetEnd >= results}
                      className='page-link'
                      type='button'>Next</button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default withRouter(ProductList);
