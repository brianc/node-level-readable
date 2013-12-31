var ok = require('okay')
var path = __dirname + '/.db'
var port = 5120
var rmdir = require('rmdir')
var fs = require('fs')
var net = require('net')
var level = require('levelup')

var assert = require('assert')
var readable = require('../')

var test = function(input) {
  describe('test input of length ' + input, function() {
    before(function(done) {
      if(!fs.existsSync(path)) {
        return done()
      }
      rmdir(path, done)
    })

    before(function(done) {
      var db = this.db = level(path,{
        keyEncoding: 'utf8',
        valueEncoding: 'utf8'
      })
      var batch = []
      for(var key in input) {
        batch.push({
          type: 'put',
          key: key,
          value: input[key]
        })
      }
      var self = this
      db.batch(batch, ok(function() {
        self.server = net.createServer(function(con) {
          con.pipe(readable.server(db)).pipe(con)
        })
        self.server.listen(port, done)
      }))
    })

    after(function(done) {
      var self = this
      this.server.close(function() {
        self.db.close(done)
      })
    })

    it('works', function(done) {
      var con = net.connect(port, function() {
        var stream = readable.client(con)
        var read = []
        var result = {}
        stream.on('readable', function() {
          var res = stream.read()
          result[res.key] = res.value
        })
        stream.on('end', function() {
          for(var key in input) {
            assert.equal(input[key], result[key])
          }
          done()
        })
      })
    })
  })
}

test({1:1})
test({1: 1, 2:2})
