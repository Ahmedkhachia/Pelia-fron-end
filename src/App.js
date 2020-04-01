import React, { Component } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import Admin from './layouts/admin'
import Public from './layouts/public'

import ProtectedRoute from './ProtectedRoute'

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import { withRouter } from "react-router";
import NotFound from './layouts/notFound';
import VideoCall from './components/videochat/app'


class ScrollToTop extends React.Component {
  componentDidUpdate(prevProps) {
    if (
      this.props.location.pathname !== prevProps.location.pathname
    ) {
      window.scrollTo(0, 0);
    }
  }

  render() {
    return null;
  }
}

const ScrollToTopWithRouter = withRouter(ScrollToTop);


class App extends Component {

  componentDidMount() {

  }

    render(props){
      
  return (
    <Router>
      <ScrollToTopWithRouter />
        <Switch>
            <ProtectedRoute path="/admin/pelia">
              <Admin {...props} />
            </ProtectedRoute>
            <Route exact path={["/video-call", "/video-call/:name"]} render={props => <VideoCall {...props} />} />
            <Route path="/not-found" render={props => <NotFound {...props} />} />
            <Route path="/" render={props => <Public {...props} />} />
        </Switch>
    </Router>
  )
    }
}

export default App;
