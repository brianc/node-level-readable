var stream = require('stream')
var Transform = require('stream').Transform

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

  //receive from socket
  result._write = function(chunk, encoding, cb) {
    if(result._headerRead) throw new Error('TODO: unexpected bytes after header read');

    //read length of header
    var length = chunk.readUInt32BE(1)
    if(chunk.length < length + 5) {
      throw new Error('TODO: Cannot read all of header - chunked reading not supported yet')
    }
    var res = chunk.toString('utf8', 5, 5 + length)
    var options = JSON.parse(res)
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
  var lastChunk = false
  result._transform = function(chunk, encoding, cb) {
    if(lastChunk) {
      //console.log('last chunk length', lastChunk)
      chunk = Buffer.concat([lastChunk, chunk])
      lastChunk = false
    }

    //did not receive enough to read any data
    if(chunk.length < 5) {
      lastChunk = chunk
      return cb()
    }

    var offset = 0
    var length = chunk.readUInt32BE(1)
    var more = true

    while(offset + 5 < chunk.length) {
      //console.log('offset', offset, 'datum length', length, 'chunk length', chunk.length)

      //do not read past end
      //in the case where we received the length
      //but not the complete message
      if((offset + length + 5) > chunk.length) {
        break;
      }
      offset += 5
      var res = chunk.toString('utf8', offset, offset + length)
      offset += length
      if(!record.key) {
        record.key = res
      } else {
        record.value = res
        more = result.push(record)
        record = new Record()
      }
      //if offset and 5 more bytes is
      //more than we have left in the chunk
      //we cannot read any farther
      if(offset + 5 >= chunk.length) {
        break;
      }
      length = chunk.readUInt32BE(offset + 1)
    }
    //did not consume entire packet, save
    //unread slice for later
    if(offset < chunk.length) {
      lastChunk = chunk.slice(offset, chunk.length)
      //console.log('end position', offset, chunk.length)
    }
    cb()
  }
  return result
}

module.exports = {
  server: server,
  client: client
}
