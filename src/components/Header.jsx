import React from 'react';
import $ from 'jquery';
import { Link, withRouter } from 'react-router-dom';
import { buildQuery } from './URI';

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.nav = React.createRef();
    this.state = {
      navHeight: 0,
      searchQuery: '',
      cartQty: 0,
      uid: null,
    };
  }

  handleInput(e) { this.setState({ searchQuery: e.target.value }); }

  resetInput() { this.setState({ searchQuery: '' }); }

  handleSubmit(e) {
    e.preventDefault();
    const query = buildQuery({ s: this.state.searchQuery });
    this.props.history.push('/search' + query);
  }

  fetchCartQty() {
    fetch('/api/cart/qty')
      .then(async res => {
        const json = await res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => {
        const { qty: cartQty } = data;
        this.setState({ cartQty });
      }).catch(err => console.error(err));
  }

  fetchUser() {
    fetch('/api/user')
      .then(async res => {
        const json = await res.json();
        if (res.ok) return json;
        throw json;
      }).then(data => {
        const { uid } = data;
        this.setState({ uid });
      }).catch(err => console.error(err));
  }

  componentDidMount() {
    this.setState({
      navHeight: $(this.nav.current).css('height'),
      searchQuery: new URLSearchParams(this.props.location.search).get('s') || ''
    });
    this.fetchCartQty();
    this.fetchUser();
    this.locationKey = '';
    this.props.history.listen(location => {
      if (this.locationKey === location.key) return;
      this.fetchCartQty();
    });
    document.addEventListener('cartQtyUpdate', () => this.fetchCartQty());
    document.addEventListener('userUpdate', () => this.fetchUser());
  }

  render() {
    const { navHeight, searchQuery, cartQty, uid } = this.state;
    return (
      <header style={{paddingTop: navHeight}}>
        <nav className='navbar navbar-expand-md navbar-light bg-light fixed-top' ref={this.nav}>
          <button className='navbar-toggler' type='button' data-toggle='collapse' data-target='#navbarSearch' aria-controls='navbarSearch' aria-expanded='false' aria-label='Toggle navigation'>
            <span className='navbar-toggler-icon'></span>
          </button>
          <Link onClick={() => this.resetInput()} to='/' className='navbar-brand mr-0 mr-md-2'>Brand</Link>
          <Link onClick={() => this.resetInput()} to='/cart' className='btn btn-outline-secondary order-md-last mr-0' title='Cart'>
            <img src='/bootstrap/cart.svg' alt='Cart' />
            {
              cartQty > 0 &&
              <span className='ml-2 text-warning'>{cartQty}</span>
            }
          </Link>
          <div className='collapse navbar-collapse' id='navbarSearch'>
            <ul className='navbar-nav w-100 mt-2 mt-md-0 pb-2 pb-md-0'>
              <li className='w-md-px-400 justify-self-start mt-3 mt-md-0'>
                <form onSubmit={e => this.handleSubmit(e)} className='input-group'>
                  <input
                    onChange={e => this.handleInput(e)}
                    value={searchQuery}
                    className='form-control'
                    type='text'
                    placeholder='Search'
                    aria-label='Search' />
                  <div className='input-group-append'>
                    <button className='btn btn-outline-secondary' type='submit'>
                      <img src='/bootstrap/search.svg' alt='Search' />
                    </button>
                  </div>
                </form>
              </li>
              <li className='col' />
              <hr className='d-md-none dropdown-divider mt-3' />
              <li className='d-md-none mt-2'>User {uid}</li>
              <li className='d-md-none mt-2'>
                <Link
                  to='/orders'
                  data-toggle='collapse'
                  data-target='#navbarSearch'>Orders</Link>
              </li>
              <li className='d-md-none mt-2'>
                <Link
                  to='/users'
                  data-toggle='collapse'
                  data-target='#navbarSearch'>Switch User</Link>
              </li>
              <li className='d-none d-md-block mr-2'>
                <div className='btn-group'>
                  <button
                    className='btn btn-outline-secondary rounded'
                    data-toggle='dropdown'
                    aria-haspopup='true'
                    aria-expanded='false'
                    type='button'>
                    <img src='/bootstrap/person.svg' alt='Profile'/>
                  </button>
                  <div className='dropdown-menu dropdown-menu-right'>
                    <div className='d-flex justify-content-between dropdown-item-text'>
                      <span className='text-truncate mw-100'>User {uid}</span>
                      <img src='/bootstrap/person-fill.svg' alt='' className='ml-2'/>
                    </div>
                    <hr className='dropdown-divider' />
                    <Link
                      to='/orders'
                      className='dropdown-item'>Orders</Link>
                    <Link
                      to='/users'
                      className='dropdown-item'>Switch User</Link>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </nav>
      </header>
    );
  }
};

export default withRouter(Header);
