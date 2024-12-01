const http = require('http')
const hostName = '127.0.0.1';
const port = 3000

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plan')
        res.end("Hello ice tea")
    } else if(req.url === '/ice-tea') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plan')
        res.end("Thanks for ordering ice-tea")
    } else {
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/plan')
        res.end("NOT FOUND")
    }
})

server.listen(port, hostName, () => {
    console.log(`Server is listening on port ${port}`)
})