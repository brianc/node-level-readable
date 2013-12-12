var assert = require('assert')
var Reader = require('../be-reader')
describe('be-reader', function() {
  beforeEach(function() {
    this.reader = new Reader()
  })

  it('reads perfect 1 length buffer', function() {
    this.reader.addChunk(Buffer([0, 0, 0, 0, 1, 1]))
    var result = this.reader.read()
    assert.equal(result.length, 1)
    assert.equal(result[0], 1)
    assert.strictEqual(false, this.reader.read())
  })

  it('reads perfect longer buffer', function() {
    this.reader.addChunk(Buffer([0, 0, 0, 0, 4, 1, 2, 3, 4]))
    var result = this.reader.read()
    assert.equal(result.length, 4)
    assert.strictEqual(false, this.reader.read())
  })

  it('reads two parts', function() {
    this.reader.addChunk(Buffer([0, 0, 0, 0, 1]))
    var result = this.reader.read()
    assert.strictEqual(false, result)
    this.reader.addChunk(Buffer([2]))
    var result = this.reader.read()
    assert.equal(result.length, 1, 'should return 1 length buffer')
    assert.equal(result[0], 2)
    assert.strictEqual(this.reader.read(), false)
  })

  it('reads multi-part', function() {
    this.reader.addChunk(Buffer([0, 0, 0, 0, 16]))
    assert.equal(false, this.reader.read())
    this.reader.addChunk(Buffer([1, 2, 3, 4, 5, 6, 7, 8]))
    assert.equal(false, this.reader.read())
    this.reader.addChunk(Buffer([9, 10, 11, 12, 13, 14, 15, 16]))
    var result = this.reader.read()
    assert.equal(result.length, 16)
  })

  it('reads multiple messages from single chunk', function() {
    this.reader.addChunk(Buffer([0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 2, 1, 2]))
    var result = this.reader.read()
    assert.equal(result.length, 1, 'should have 1 length buffer')
    assert.equal(result[0], 1)
    var result = this.reader.read()
    assert.equal(result.length, 2, 'should have 2 length buffer but was ' + result.length)
    assert.equal(result[0], 1)
    assert.equal(result[1], 2)
    assert.strictEqual(false, this.reader.read())
  })

  it('reads 1 and a split', function() {
    this.reader.addChunk(Buffer([0, 0, 0, 0, 1, 1, 0, 0]))//, 0, 0, 2, 1, 2]))
    var result = this.reader.read()
    assert.equal(result.length, 1, 'should have 1 length buffer')
    assert.equal(result[0], 1)
    var result = this.reader.read()
    assert.strictEqual(result, false)

    this.reader.addChunk(Buffer([0, 0, 2, 1, 2]))
    var result = this.reader.read()
    assert.equal(result.length, 2, 'should have 2 length buffer but was ' + result.length)
    assert.equal(result[0], 1)
    assert.equal(result[1], 2)
    assert.strictEqual(false, this.reader.read())
  })
})
