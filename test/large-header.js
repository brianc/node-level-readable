var db = require('./db')()
var net = require('net')
var port = 5122
var readable = require('../')
var _ = require('lodash')

describe('large header', function() {
  it('works', function(done) {
    var server = net.createServer(function(con) {
      con.pipe(readable.server(db)).pipe(con)
    }).listen(port)

    var con = net.connect(port, function(err) {
      if(err) return done(err);
      var stream = readable.client(con, {
        somethingHuge: _.range(0, 10000).map(function() { return "HI!!!!!!!"})
      })
      stream.once('readable', function() {
        con.end(function() {
          server.close(done)
        })
      })
    })
  })
})
