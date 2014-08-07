
var callbackStream = require('callback-stream')
  , assert         = require('assert')
  , Joi            = require('joi')

function contactYou(opts) {

  assert(opts)
  assert(opts.transport)
  assert(opts.from)
  assert(opts.to)

  var transport = opts.transport
    , schema = Joi.object().keys({
          subject: Joi.string().required()
        , text: Joi.string().required()
        , from: Joi.string().email()
      })

  function sentEmail(req, res, next) {
    if (req.method != 'POST') {
      if (next)
        return next()

      res.statusCode = 404
      res.end()
    }

    if (!next)
      next = function(err) {
        res.statusCode = err.status || 500
        res.end()
      }

    req.pipe(callbackStream(function(err, chunks) {

      var data
      try {
        data = JSON.parse(Buffer.concat(chunks))
      } catch(err) {
        err.status = 406 // not acceptable
        return next(err)
      }

      Joi.validate(data, schema, function(err, data) {
        if (err) {
          err.status = 422 // unprocessable entity
          return next(err)
        }

        transport.sendMail({
            to: opts.to
          , subject: data.subject
          , from: opts.from
          , replyTo: data.from
          , cc: data.from
          , text: 'Email sent on behalf of: ' + data.from + '\n\n\n' + data.text
        }, function(err) {
          if (err)
            return next(err)

          res.statusCode = 200
          res.end()
        })
      })
    }))
  }

  return sentEmail
}

module.exports = contactYou
