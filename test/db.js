var level = require('levelup')
var create = module.exports = function(options) {
  var db = level(__dirname + '/.test-db', options)
  return db
}

if(!module.parent) {
  var NotFoundError = require('levelup/lib/errors').NotFoundError
  var async = require('async')
  //see if database has items, if it does
  //we're done here
  var db = create({
    valueEncoding: 'json'
  })
  db.get(1, function(err, res) {
    if(err) {
      if(err instanceof NotFoundError == false) {
        throw err;
      }
    }
    if(res) return process.exit(0);
    console.log('loading 999999 bottles of beer')
    async.times(999999, function(i, cb) {
      if(i % 1000 == 0) process.stdout.write('.')
      db.put(i, {bottles: i}, cb)
    }, function(err, done) {
      if(err) throw err;
      console.log('loaded 999999 bottles of beer on to the wall')
      process.exit(0);
    })
  })
}
