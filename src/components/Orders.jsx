import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { buildQuery } from './URI';

class Orders extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: [],
    };
  }

  goBack(e) {
    e.preventDefault();
    this.props.history.goBack();
  }

  componentDidMount() {
    fetch('/api/orders')
      .then(async res => {
        const json = await res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => this.setState({ orders: data }))
      .catch(err => console.error(err));
  }

  render() {
    const { orders } = this.state;
    return (
      <main>
        <div className='container mt-5'>
          <div className='row'>
            <div className='col'>
              <h1 className='mb-4'>Your Orders</h1>
              {
                orders.length === 0
                ? (
                  <div>
                    <p className='mb-4'>No orders are currently associated with your account.</p>
                    <Link
                      to={'/search' + buildQuery({ deals: 'true' })}
                      className='btn btn-primary'>Find deals</Link>
                  </div>
                )
                : (
                  <table className='table table-light table-bordered table-hover'>
                    <thead className='thead-light'>
                      <tr>
                        <th scope='col'>Submitted</th>
                        <th scope='col'>Total cost</th>
                        <th scope='col'></th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        orders.map(order => {
                          const { id, submitted, total } = order;
                          const date = new Date(submitted);
                          return (
                            <tr key={id}>
                              <td className='w-25'>{date.toLocaleString()}</td>
                              <td>${total.toFixed(2)}</td>
                              <td className='w-px-1'>
                                <Link
                                  to={'/orders/' + id}
                                  className='btn btn-primary'>View</Link>
                              </td>
                            </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                )
              }
            </div>
          </div>
        </div>
      </main>
    );
  }
}

export default withRouter(Orders);
