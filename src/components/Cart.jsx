import React from 'react';
import { Link } from 'react-router-dom';
import { buildQuery } from './URI';

export default class Cart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { products: [] };
  }

  removeProduct(id) {
    fetch('/api/cart/product', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).then(async res => {
      const json = await res.json();
      if (res.ok) return json;
      throw json;
    }).then(data => {
      const { id } = data;
      const products = this.state.products.filter(product => product.id !== id);
      this.setState({ products });
    }).catch(err => console.error(err));
  }

  updateQuantity(index, val) {
    const qty = val + this.state.products[index].qty;
    this.setQuantity(index, qty);
  }

  setQuantity(index, val) {
    const { products } = this.state;
    const setQty = (index, qty) => {
      if (qty !== val) {
        if (qty === 0 && val > 0) alert('Product no longer available');
        else if (qty < val) alert('Maximum available product reached');
      }
      this.setState(state => {
        const product = state.products[index];
        product.qty = qty;
        return state;
      })
    };
    if (!val) return setQty(index, val);
    val = Math.min(Math.max(val, 0), 25);
    fetch('/api/cart/product/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: products[index].id, qty: val })
    }).then(res => {
      const json = res.json();
      if (res.ok) return json;
      throw json;
    }).then(data => {
      const { qty } = data;
      setQty(index, qty);
    }).catch(err => console.error(err));
  }

  componentDidMount() {
    fetch('/api/cart')
      .then(async res => {
        const json = await res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => this.setState({ products: data }))
      .catch(err => console.error(err));
  }

  render() {
    const { products } = this.state;
    const subtotal = products.reduce((a, product) => a + product.qty * product.price, 0);
    return (
      <main>
        <div className='container mt-5 mb-4'>
          <h1 className='mb-4'>Review Your Cart</h1>
          {
            products.length === 0
              ? <p>Your cart is empty.</p>
              : products.map((product, index) => {
              const { id, img, name, price, qty } = product;
              const { url = null, alt = null } = img || {};
              return (
                <div className='card mb-3' key={id}>
                  <div className='row no-gutters'>
                    <Link to={'/product' + buildQuery({ id })} className='col-12 col-md-2 d-flex justify-content-center'>
                      <img src={'/images/' + url} className='card-img product-thumbnail mt-3' alt={alt} />
                    </Link>
                    <div className='col-12 col-md-10'>
                      <div className='card-body'>
                        <div className='row'>
                          <div className='col-12 col-md-8 mb-3 mb-md-0'>
                            <Link to={'/product' + buildQuery({ id })}>
                              <h5 className='card-title text-truncate'>{name}</h5>
                            </Link>
                            <p className='card-text mb-0'>${price.toFixed(2)}</p>
                            <p className='card-text'><small className='text-muted'>(${(qty * price).toFixed(2)} total)</small></p>
                          </div>
                          <div className='col-12 col-md-4 text-right text-md-left'>
                            <button
                              onClick={() => this.removeProduct(id)}
                              className='btn btn-danger mb-3'
                              type='button'>Remove</button>
                            <div className='input-group mb-3 justify-content-end justify-content-md-start'>
                              <div className='input-group-prepend'>
                                <button
                                  onClick={() => this.updateQuantity(index, -1)}
                                  className='btn btn-outline-secondary'
                                  type='button'>-</button>
                              </div>
                              <input
                                value={qty}
                                onChange={e => this.setQuantity(index, e.currentTarget.value)}
                                type='number'
                                className='form-control product-qty-input'
                                aria-label='Quantity' />
                              <div className='input-group-append'>
                                <button
                                  onClick={() => this.updateQuantity(index, 1)}
                                  className='btn btn-outline-secondary'
                                  type='button'>+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          }
          {
            products.length > 0 &&
            <div className='row mb-4'>
              <div className='col-12 text-right'>
                <h4>Subtotal: ${subtotal.toFixed(2)}</h4>
              </div>
            </div>
          }
          <div className='row'>
            <div className={'col-12 d-sm-flex justify-content-sm-between ' + (products.length > 0 ? 'text-center' : 'text-left')}>
              <Link
                to='/'
                className={'btn ' + (products.length > 0 ? 'btn-secondary' : 'btn-primary')}
                >Back to shopping</Link>
              <br className='d-sm-none' />
              {
                products.length > 0 &&
                <Link to='/checkout' className='btn btn-primary mt-3 mt-sm-0'>Proceed to checkout</Link>
              }
            </div>
          </div>
        </div>
      </main>
    );
  }
}
