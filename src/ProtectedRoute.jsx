import React from "react";
import {
  Route,
  Redirect,
} from "react-router-dom";

import Authentification from './authentification'

export default function PrivateRoute({ children, ...rest }) {
    return (
      <Route
        {...rest}
        render={({ location }) =>
        Authentification.isAuthenticated ? (
            children
          ) : (
            <Redirect
              to={{
                pathname: "/admin/login",
                state: { from: location }
              }}
            />
          )
        }
      />
    );
  }