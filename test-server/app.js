import React from 'react';
import RouterStore from '../source/stores/router-store';
//import {TimeStore} from './modules';

const App = React.createClass({
  render() {
    let Content = RouterStore.getInstance().getChildComponent(App);

    console.log('###', Content);
    if(!Content) {
      Content = Home;
    }

    return <div>
      <a href="/">Home</a><br />
      <a href="/modules">Modules</a><br />
      <Content />
    </div>;
  }
});

const Home = React.createClass({
  render() {
    return <div>Welcome to Meepworks!</div>;
  }
});
export default {
  component: App,
  //stores: [
  //  TimeStore
  //],
  routes: {
    '/': {
      name: 'Home',
      title: 'Meepworks'
    },
    '/modules': {
      name: 'Modules',
      app: './modules',
      title: 'Modules'
    }
  }
};

