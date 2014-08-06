
var callbackStream = require('callback-stream')
  , assert         = require('assert')

function contactYou(opts) {

  assert(opts)
  assert(opts.transport)
  assert(opts.from)
  assert(opts.to)

  var transport = opts.transport

  function sentEmail(req, res) {
    req.pipe(callbackStream(function(end, chunks) {
      var data
      try {
        data = JSON.parse(Buffer.concat(chunks))
      } catch(err) {
        res.statusCode = 406 // not acceptable
        return res.end()
      }

      transport.sendMail({
          to: opts.to
        , title: data.title
        , from: opts.from
        , replyTo: data.from
        , cc: data.from
        , text: 'Email sent on behalf of: ' + data.from + '\n\n\n' + data.text
      }, function(err) {
        if (err)
          res.statusCode = 500
        else
          res.statusCode = 200
        res.end()
      })
    }))
  }

  return sentEmail
}

module.exports = contactYou
