var db = require('./db')()
var net = require('net')
var port = 5120
var readable = require('../')
var assert = require('assert')
var reader = require('stream-reader')

describe('loaded database', function() {

  before(function(done) {
    this.timeout(10000)
    var self = this
    self.server = net.createServer(function(con) {
      self.readableServer = readable.server(db)
      con.pipe(self.readableServer).pipe(con)
    })
    self.server.listen(port, function(err) {
      if(err) return done(err);
      var vals = []
      var batch = db.batch()
      for(var i = 0; i < 1000; i++) {
        var item = []
        for(var j = 0; j < i * Math.random(); j++) {
          item.push({
            name: 'My name is ' + i + ' ' + j,
            message: 'Hellooooooo there! '
          })
        }
        batch.put('BIG ' + i, JSON.stringify(item))
      }
      batch.write(done)
    })
  })

  after(function(done) {
    this.server.close(done)
  })

  it('works', function(done) {
    this.timeout(10000)
    var con = net.connect(port)
    var stream = readable.client(con, {
      start: 'BIG',
    })
    var result = []
    stream.on('readable', function() {
      var record = stream.read()
      var val = JSON.parse(record.value)
      result.push(record)
    })
    stream.on('end', function() {
      console.log(result.length)
      assert.equal(result.length, 1000)
      done()
    })
  })

})
