import React from 'react'
import ReactDOM from 'react-dom'
import { Router, browserHistory } from 'react-router'

import configureStroe from './Redux/store/configureStore'
import { Provider } from 'react-redux'

import { ApplicationContext } from '../../source/'

import Test from './Test/test-route'

const ctx = new ApplicationContext({})
const routes = new Test(ctx).routes

const _onError = (err) => {
  ctx.emit('error', err)
}
const _onUpdate = () => {
  ctx.init = true
}

const store = configureStroe()

ReactDOM.render(
  <Provider store={ store }>
    <Router
      history={ browserHistory }
      onError={ _onError }
      routes={ routes }
      onUpdate={ _onUpdate } />
  </Provider>
  , document.getElementById('app'))
