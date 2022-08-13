import App from './app'
import * as http from 'http'
import 'dotenv/config'

const port = process.env.APP_PORT

App.set('port', port)
const server = http.createServer(App)
server.listen(port)

server.on('listening', function (): void {
    let addr = server.address()
    if (addr == null) {
        throw new Error('Its borked')
    }
    let bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`
    console.log(`Listening on ${bind}`)
})

module.exports = App
