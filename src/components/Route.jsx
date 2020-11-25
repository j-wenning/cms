import React from 'react';
import { Route as RRoute } from 'react-router-dom';

export default class Route extends React.Component {
  render() {
    return (
      <RRoute path={this.props.path}>
        {
          this.props.component
          ? <this.props.component />
          : <div>Missing component.</div>
        }
        {
          this.props.routes?.map((route, i) => (
            <Route
              key={i}
              path={route.path}
              component={route.component}
              routes={route.routes} />
          ))
        }
      </RRoute>
    );
  }
};
