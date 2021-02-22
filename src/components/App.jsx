import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import RouteSwitch from './RouteSwitch';
import '../scss/App.scss';

export default class App extends React.Component {
  render() {
    return (
      <Router>
        <div className='h-100 d-flex flex-column'>
          <Header />
          <RouteSwitch />
          <Footer />
        </div>
      </Router>
    );
  }
};
