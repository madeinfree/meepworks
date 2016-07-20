import React from 'react'
import { Component } from '../../../source'

import { connect } from 'react-redux'

import {
  addUser
} from './admin-action'

import { fromJS } from 'immutable'

class AdminView extends Component {

  constructor() {
    super()
    this.onGetUser = () => this._onGetUser()
    this.onCreateUser = () => this._onCreateUser()
  }

  componentDidMount() {
    console.log('Admin component mounted !')
  }

  componentWillUnmount() {
    console.log('Admin component unmounted !')
  }

  _onGetUser() {
    console.log(this.props.users)
  }

  _onCreateUser() {
    this.props.addUser(fromJS({ name: 'whien', gender: 'boy' }))
  }

  render() {
    return (
      <div>
        <div>This is AdminViewer</div>
        <button
          onClick={ this.onGetUser }>Get Users</button>
        <button
          onClick={ this.onCreateUser }>Create Users</button>
      </div>
    )
  }
}

const mapStateToProps = (state) => (
  {
    users: state.users
  }
)

const mapActionToProps = {
  addUser
}

export default connect(
  mapStateToProps,
  mapActionToProps
)(AdminView)
