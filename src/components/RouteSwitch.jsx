import React from 'react';
import { Switch } from 'react-router-dom';
import Route from './Route';
import Routes from './Routes';

export default class RouteSwitch extends React.Component {
  render() {
    return (
      <Switch>
        {
          Routes.map((route, i) => (
            <Route
              key={i}
              exact={route.path === '/'}
              path={route.path}
              component={route.component}
              routes={route.routes} />
          ))
        }
      </Switch>
    );
  }
};
