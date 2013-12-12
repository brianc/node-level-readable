var db = require('./db')()
var net = require('net')
var port = 5120
var readable = require('../')
var assert = require('assert')
var reader = require('stream-reader')

describe('slow reader', function() {

  before(function(done) {
    var self = this
    self.readableServer = readable.server(db)
    self.server = net.createServer(function(con) {
      con.pipe(self.readableServer).pipe(con)
    })
    self.server.listen(port, done)
  })

  after(function(done) {
    this.server.close(done)
  })

  it('works', function(done) {
    this.timeout(200000)
    var con = net.connect(port)
    var stream = readable.client(con, {
      start: '1'
    })
    reader(stream, function(item, cb) {
      process.stdout.write('.')
      cb()
    })
    stream.on('end', function() {
      done()
    })
  })

})
