var stream = require('stream')
var Transform = require('stream').Transform
var Reader = require('./be-reader')

var send = function(readable, typeCode, buffer) {
  var header = Buffer(5)
  header[0] = typeCode
  header.writeUInt32BE(buffer.length, 1)
  readable.push(header)
  return readable.push(buffer)
}

var server = function(db, serverOptions) {
  //TODO instrument & test for back pressure
  var result = new stream.Duplex({
    highWaterMark: 100
  })
  var reading = false
  result._read = function(n) {
    if(!result.iterator) return null;
    if(reading) return null;
    reading = true
    result.iterator.next(function(err, key, val) {
      reading = false
      //TODO handle
      if(err) {
        throw err;
      }
      //reached end of stream
      if(!key) {
        return result.iterator.end(function(err) {
          if(err) throw err;
          result.push(null)
        })
      }
      send(result, 0, key)
      send(result, 0, val)
    })
  }

  var reader = new Reader()

  //receive from socket
  result._write = function(chunk, encoding, cb) {
    if(result._headerRead) throw new Error('TODO: unexpected bytes after header read');

    //read options header packet
    reader.addChunk(chunk)
    var res = reader.read()
    if(!res) return cb();

    var json = res.toString('utf8')
    var options = JSON.parse(json)
    result._headerRead = true

    var attach = function() {
      result.iterator = db.db.iterator(options)
      //kick the reader
      result._read()
    }
    if(db.isOpen()) {
      return attach()
    }
    db.on('ready', attach)
  }
  return result
}

var Record = function() {
  this.key = null
  this.value == null
}

var client = function(stream, options) {
  var optionsBuffer = Buffer(JSON.stringify(options||{}), 'utf8')
  var header = Buffer(5)
  header[0] = 0 //code
  header.writeUInt32BE(optionsBuffer.length, 1)
  stream.write(header)
  stream.write(optionsBuffer)
  var result = new Transform({
    objectMode: true,
    highWaterMark: 100
  })
  stream.pipe(result)

  var record = new Record()
  var reader = new Reader()
  result._transform = function(chunk, encoding, cb) {
    reader.addChunk(chunk)
    var res = reader.read()
    while(res) {
      var val = res.toString('utf8')
      if(!record.key) {
        record.key = val
      } else {
        record.value = val
        more = result.push(record)
        record = new Record()
      }
      res = reader.read()
    }
    return cb()
  }
  return result
}

module.exports = {
  server: server,
  client: client
}
