
var mailer = require('nodemailer')
  , contact = require('./')
  , http  = require('http')
  , transport = mailer.createTransport({
        host: 'mail.gandi.net'
     ,  port: 587
     ,  auth: {
            user: process.env.SMTP_USER
          , pass: process.env.SMTP_PASS
        }
     ,  maxConnections: 5
     ,  maxMessages: 10
    })
  , server = http.createServer(contact({
        transport: transport
      , from: 'auto@matteocollina.com'
      , to: 'hello@matteocollina.com'
    }))
  , port = 3000

server.listen(port, function() {
  console.log('http server listening on port', port)
})
