import * as todo from './todo.controller'
import * as index from './index.controller'

const controllers = {
  index: {
    ping: index.ping
  },
  todo: {
    createTodo: todo.createTodo,
    deleteTodo: todo.deleteTodo,
    getTodo: todo.getTodo,
    updateTodo: todo.updateTodo
  }
}

export default controllers
