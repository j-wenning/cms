import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer';
import RouteSwitch from './components/RouteSwitch'
import './App.scss';

export default class App extends React.Component {
  render() {
    return (
      <Router>
        <Header />
        <RouteSwitch />
        <Footer />
      </Router>
    );
  }
}
