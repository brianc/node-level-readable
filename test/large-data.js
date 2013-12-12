var db = require('./db')()
var net = require('net')
var port = 5120
var readable = require('../')
var assert = require('assert')
var reader = require('stream-reader')

describe('loaded database', function() {

  before(function(done) {
    var self = this
    self.server = net.createServer(function(con) {
      self.readableServer = readable.server(db, {instrument: true})
      con.pipe(self.readableServer).pipe(con)
    })
    self.server.listen(port, done)
  })

  after(function(done) {
    this.server.close(done)
  })

  it('works', function(done) {
    this.timeout(2000)
    var con = net.connect(port)
    var stream = readable.client(con, {
      start: '999990',
      end: '999999'
    })
    var result = []
    stream.on('readable', function() {
      var record = stream.read()
      JSON.parse(record.value)
      result.push(record)
    })
    stream.on('end', function() {
      assert.equal(result[0].key, '999990')
      assert.equal(result[1].key, '999991')
      assert.equal(result[8].key, '999998')
      done()
    })
  })

})
