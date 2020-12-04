import React from 'react';
import $ from 'jquery';
import { Link } from 'react-router-dom';
import { buildQuery } from './URI';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.nav = React.createRef();
    this.state = {
      navHeight: 0,
      searchQuery: ''
    };
  }

  handleInput(e) { this.setState({ searchQuery: e.target.value }); }

  resetInput() { this.setState({ searchQuery: '' }); }

  handleSubmit(e) {
    e.preventDefault();
    const query = buildQuery({ s: this.state.searchQuery });
    window.location.assign(`/search` + query);
  }

  componentDidMount() {
    this.setState({
      navHeight: $(this.nav.current).css('height'),
      searchQuery: new URLSearchParams(window.location.search).get('s') || ''
    });
  }

  render() {
    return (
      <header style={{paddingTop: this.state.navHeight}}>
        <nav className='navbar navbar-expand-md navbar-light bg-light fixed-top' ref={this.nav}>
          <button className='navbar-toggler' type='button' data-toggle='collapse' data-target='#navbarSearch' aria-controls='navbarSearch' aria-expanded='false' aria-label='Toggle navigation'>
            <span className='navbar-toggler-icon'></span>
          </button>
          <Link onClick={() => this.resetInput()} to='/' className='navbar navbar-brand mr-0 mr-md-2'>Brand</Link>
          <Link onClick={() => this.resetInput()} to='/cart' className='navbar navbar-brand order-md-last mr-0' title='Cart'>
            <img src='/bootstrap/cart.svg' alt='Cart' />
          </Link>
          <div className='collapse navbar-collapse' id='navbarSearch'>
            <ul className='w-md-px-400 navbar-nav mt-2 mt-lg-0'>
              <li className='w-md-px-400'>
                <form onSubmit={e => this.handleSubmit(e)} className='input-group'>
                  <input
                    onChange={e => this.handleInput(e)}
                    value={this.state.searchQuery}
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
            </ul>
          </div>
        </nav>
      </header>
    );
  }
};
