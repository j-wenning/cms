import React from 'react';
import { Link, withRouter } from 'react-router-dom';

class Receipt extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      products: [],
      address: {},
      shippingMethod: '',
    };
  }

  componentDidMount() {
    const {
      products = [],
      address = {},
      shippingMethod = '',
    } = this.props.location.state || {};
    if (products?.length === 0) this.props.history.replace('/');
    this.setState({ products, address, shippingMethod });
  }

  render() {
    const {
      products,
      address: {
        address1,
        address2,
        city,
        region,
        postalCode
      },
      shippingMethod,
    } = this.state;
    let subtotal = 0;
    return (
      <main>
        <div className='container'>
          <div className='row'>
            <div className='col'>
              <h3>Order Summary</h3>
              <h5>
                <span
                  className='badge badge-info'
                  >{shippingMethod[0]?.toLocaleUpperCase() + shippingMethod?.substr(1, shippingMethod.length - 1).toLocaleLowerCase()} shipping</span>
              </h5>
              <table className='table table-striped table-hover'>
                <thead className='thead-light'>
                  <tr>
                    <th scope='col'>Product</th>
                    <th scope='col'>Qty</th>
                    <th scope='col'>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    products.map(product => {
                      const { id, name, price, qty } = product;
                      subtotal += price;
                      return (
                        <tr key={id}>
                          <th scope='row'>{name}</th>
                          <td>{qty}</td>
                          <td>${price.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
              <h5 className='text-right'>Subtotal: ${subtotal.toFixed(2)}</h5>
            </div>
          </div>
          <div className='row mb-3'>
            <div className='col'>
              <h6>Address</h6>
              <p className='mb-1'>{address1}</p>
              <p className='mb-1'>{address2}</p>
              <p className='mb-1'>{city}, {region}</p>
              <p className='mb-1'>{postalCode}</p>
            </div>
          </div>
          <div className='row'>
            <div className='col'>
              <Link
                to='/'
                className='btn btn-primary'>Back to shopping</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }
}

export default withRouter(Receipt);
