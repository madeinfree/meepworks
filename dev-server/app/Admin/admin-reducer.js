import { fromJS } from 'immutable'

import {
  ADD_USER
} from './admin-const'

const initialState = fromJS([
  {
    name: 'foo',
    gender: 'bar'
  }
])

const users = (state = initialState, action) => {
  switch (action.type) {
  case ADD_USER:
    return state.push(action.payload)
  default:
    return state
  }
}

export {
  users
}
