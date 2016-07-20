import {
  ADD_USER
} from './admin-const'

export const addUser = (user) => (
  {
    type: ADD_USER,
    payload: user
  }
)
