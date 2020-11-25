import React from 'react';
import $ from 'jquery';
import { Link } from 'react-router-dom';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.nav = React.createRef();
    this.state = { navHeight: 0 };
  }

  componentDidMount() { this.setState({ navHeight: $(this.nav.current).css('height') }); }

  render() {
    return (
      <header style={{paddingTop: this.state.navHeight}}>
        <nav className='navbar navbar-expand-md navbar-light bg-light fixed-top' ref={this.nav}>
          <button className='navbar-toggler' type='button' data-toggle='collapse' data-target='#navbarSearch' aria-controls='navbarSearch' aria-expanded='false' aria-label='Toggle navigation'>
            <span className='navbar-toggler-icon'></span>
          </button>
          <Link to='/' className='navbar navbar-brand mr-0 mr-md-2'>Brand</Link>
          <Link to='/cart' className='navbar navbar-brand order-md-last mr-0' title='Cart'>
            <img src='/bootstrap/cart.svg' alt='Cart' />
          </Link>
          <div className='collapse navbar-collapse' id='navbarSearch'>
            <ul className='navbar-nav mt-2 mt-lg-0'>
              <li>
                <form className='input-group'>
                  <input type='text' className='form-control' placeholder='Search' aria-label='Search' />
                  <div className='input-group-append'>
                    <button className='btn btn-outline-secondary' type='submit'>
                      <img src='/bootstrap/search.svg' alt='Search' />
                    </button>
                  </div>
                </form>
              </li>
            </ul>
          </div>
        </nav>
      </header>
    );
  }
};
