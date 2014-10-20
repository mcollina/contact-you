contact-you&nbsp;&nbsp;[![Build Status](https://travis-ci.org/mcollina/contact-you.png)](https://travis-ci.org/mcollina/contact-you)
===========

HTTP API for contacting you via e-mail as a node.js module!

Install
-------

```bash
npm install contact-you --save
```

Usage
-----

```js
var mailer = require('nodemailer')
  , contact = require('contact-you')
  , http  = require('http')
  , transport = mailer.createTransport({
      // configure your nodemailer transport
    })
  , server = http.createServer(contact({
        transport: transport
      , from: 'auto@matteocollina.com'
      , to: 'hello@matteocollina.com'
      , text: null
        // or you can pass a function that accepts the data object
        // and returns a string
    }))
  , port = 3000

server.listen(port, function() {
  console.log('http server listening on port', port)
})
```

To test, configure the [nodemailer](http://npm.im/nodemailer) transport
and then start it and send a POST request:

```bash
curl -X POST -d '{ "subject": "a subject", "text": "hello world", "from": "aaa@matteocollina.com" }' http://localhost:3000
```

Usage with Express/Connect
------------------

contact-you supports express/connect, just use it a standard connect
middleware:

```js
var app = express()

app.use('/send', require('contact-you')({ ... })
```

License
-------

MIT
