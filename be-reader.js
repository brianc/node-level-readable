var Reader = module.exports = function() {
  this.offset = 0
  this.lastChunk = false
  this.chunk = null
}

Reader.prototype.addChunk = function(chunk) {
  this.offset = 0
  this.chunk = chunk
  if(this.lastChunk) {
    this.chunk = Buffer.concat([this.lastChunk, this.chunk])
    this.lastChunk = false
  }
}

Reader.prototype._save = function() {
  //save any unread chunks for next read
  if(this.offset < this.chunk.length) {
    this.lastChunk = this.chunk.slice(this.offset)
  }
  return false
}

Reader.prototype.read = function() {
  if(this.chunk.length < (5 + this.offset)) {
    return this._save()
  }

  //TODO - ignored for now
  var code = this.chunk[this.offset]

  //read length of next item
  var length = this.chunk.readUInt32BE(this.offset + 1)

  //next item spans more chunks than we have
  var remaining = this.chunk.length - (this.offset + 5)
  if(length > remaining) {
    return this._save()
  }

  this.offset += 5
  var result = this.chunk.slice(this.offset, this.offset + length)
  this.offset += length
  return result
}

