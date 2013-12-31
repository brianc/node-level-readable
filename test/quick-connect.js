var db = require('./db')()
var net = require('net')
var port = 5120
var readable = require('../')

describe('quick connect', function() {
  it('works', function(done) {
    var server = net.createServer(function(con) {
      console.log('client')
      con.pipe(readable.server(db)).pipe(con)
    }).listen(port)

    var con = net.connect(port, function(err) {
      if(err) return done(err);
      var stream = readable.client(con)
      stream.once('readable', function() {
        console.log('readlabe')
        con.end(function() {
          server.close(done)
        })
      })
    })
  })
})
