import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { buildQuery } from './URI';

class Order extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      products: [],
      address: {},
      shippingMethod: '',
    };
  }

  componentDidMount() {
    const oid = this.props.location.pathname.split('/').pop();
    fetch('/api/order' + buildQuery({ oid }))
      .then(async res => {
        const json = await res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => {
        const { products, address, shippingMethod } = data;
        this.setState({ products, address, shippingMethod });
      }).catch(err => {
        console.error(err);
        this.props.history.goBack();
      });
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
        <div className='container mt-5 mb-4'>
          <div className='row'>
            <div className='col'>
              <h3>Order Summary</h3>
              <h5>
                <span
                  className='badge badge-info'
                  >{shippingMethod[0]?.toLocaleUpperCase() + shippingMethod?.substr(1, shippingMethod.length - 1).toLocaleLowerCase()} shipping</span>
              </h5>
              <table className='table table-light table-hover'>
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
                          <th scope='row'>
                            <Link to={'/product/' + buildQuery({ id })}>{name}</Link>
                          </th>
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
        </div>
      </main>
    );
  }
}

export default withRouter(Order);
