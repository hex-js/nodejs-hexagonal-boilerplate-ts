import app from './app'
import http from 'http'
import debugLib from 'debug'

const debug = debugLib('api-server')

/**
 * @description Get the start message default with the port.
 *
 * @memberof http
 * @param {number} port
 * @returns {string}
 */
const startMessageDefault = (port: number | string | false): string => {
  return `The magic is on port ${port}`
}

/**
 * Event listener for HTTP server "listening" event.
 *
 * @memberof http
 * @returns {undefined}
 */
const onListening = (): void => {
  const addr = server.address()
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port
  debug('Listening on ' + bind)
}

/**
 * @description Normalize a port into a number, string, or false.
 *
 * @memberof http
 * @param {string} value Port number as string type.
 */
const normalizePort = (value: string): string | number | false => {
  const port = parseInt(value, 10)
  return isNaN(port) ? value : port >= 0 ? port : false
}

/**
 * Get port from environment and store in Express.
 * @memberof http
 */
const port = normalizePort(process.env.PORT || '3000')
// eslint-disable-next-line functional/no-expression-statement
console.log(`${process.env.START_MESSAGE || startMessageDefault(port)}`)
// eslint-disable-next-line functional/no-expression-statement
app.set('port', port)

/**
 * Create HTTP server.
 * @memberof http
 */
const server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port)
server.on('listening', onListening)
