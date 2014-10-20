
// at the top to avoid console.log from connect
process.env.NODE_ENV = 'test'

var expect      = require('must')
  , connect     = require('connect')
  , contactYou  = require('./')
  , http        = require('http')
  , supertest   = require('supertest')
  , mailer      = require('nodemailer')

  , fake =  {
        name: 'fake'
      , version: '0.1.0'
      , nextIsSent: true
      , send: function(mail, callback) {
          var nextIsSent = this.nextIsSent
          this.lastMail = mail
          setImmediate(function() {
            if (nextIsSent)
              callback(null, true)
            else
              callback(new Error('unable to send'))
          })
        }
      , reset: function() {
          this.nextIsSent = true
          this.lastMail = null
        }
    }

describe('contact-you', function() {

  var instance
    , request

  beforeEach(function() {
    fake.reset()
    instance = contactYou({
        transport: mailer.createTransport(fake)
      , from: 'original@foo.com'
      , to: 'dest@collina.me'
    })
  })

  function buildTests(route) {
    if (!route)
      route = '/'

    it('should return a 200', function(done) {
      request
        .post(route)
        .send({ subject: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, done)
    })

    it('should return a 500 if something goes wrong', function(done) {
      fake.nextIsSent = false
      request
        .post(route)
        .send({ subject: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(500, done)
    })

    it('should actually send an email', function(done) {
      request
        .post(route)
        .send({ subject: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, function() {
          expect(fake.lastMail).to.exist()
          done()
        })
    })

    it('should send an email with the right subject', function(done) {
      request
        .post(route)
        .send({ subject: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, function() {
          expect(fake.lastMail.data.subject).to.eql('this is an email')
          done()
        })
    })

    it('should send an email with the right subject (bis)', function(done) {
      request
        .post(route)
        .send({ subject: 'another email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, function() {
          expect(fake.lastMail.data.subject).to.eql('another email')
          done()
        })
    })

    it('should send an email with the right text', function(done) {
      request
        .post(route)
        .send({ subject: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, function() {
          expect(fake.lastMail.data.text).to.eql('Email sent on behalf of: foo@foo.com\n\n\nwith some text')
          done()
        })
    })

    it('should send an email with the right text (bis)', function(done) {
      request
        .post(route)
        .send({ subject: 'this is an email', text: 'other text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, function() {
          expect(fake.lastMail.data.text).to.eql('Email sent on behalf of: foo@foo.com\n\n\nother text')
          done()
        })
    })

    it('should send an email from the from address specified in the constructor', function(done) {
      request
        .post(route)
        .send({ subject: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, function() {
          expect(fake.lastMail.data.from).to.eql('original@foo.com')
          done()
        })
    })

    it('should send an email to the to address specified in the constructor', function(done) {
      request
        .post(route)
        .send({ subject: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, function() {
          expect(fake.lastMail.data.to).to.eql('dest@collina.me')
          done()
        })
    })

    it('should include the from address in the payload as replyTo', function(done) {
      request
        .post(route)
        .send({ subject: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, function() {
          expect(fake.lastMail.data.replyTo).to.eql('foo@foo.com')
          done()
        })
    })

    it('should include the from address in the payload as CC', function(done) {
      request
        .post(route)
        .send({ subject: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, function() {
          expect(fake.lastMail.data.cc).to.eql('foo@foo.com')
          done()
        })
    })

    it('should validate the subject', function(done) {
      request
        .post(route)
        .send({ subject: '', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(422, done)
    })

    it('should validate the text', function(done) {
      request
        .post(route)
        .send({ subject: 'aaa', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(422, done)
    })

    it('should validate the email', function(done) {
      request
        .post(route)
        .send({ subject: 'aaa', text: 'bbb', from: 'foo' })
        .set('Accept', 'application/json')
        .expect(422, done)
    })
  }

  describe('in an HTTP server', function() {
    beforeEach(function() {
      request = supertest(http.createServer(instance))
    })

    buildTests()

    it('should send an email with customized text', function(done) {

      var request = supertest(http.createServer(contactYou({
          transport: mailer.createTransport(fake)
        , from: 'original@foo.com'
        , to: 'dest@collina.me'
        , text: function(data) {
            return "Email inviata per conto di: " + data.from + '\n\n\n' + data.text
          }
      })))

      request
        .post('/')
        .send({ subject: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
        .set('Accept', 'application/json')
        .expect(200, function(err) {
          expect(err).to.be.null();
          expect(fake.lastMail.data.text).to.eql('Email inviata per conto di: foo@foo.com\n\n\nwith some text')
          done()
        })
    })
  })

  describe('in a connect server', function() {
    var server

    beforeEach(function() {
      server = connect()
      server.use(instance)
      request = supertest(server)
    })

    buildTests()

    it('should call next to the following middleware if the method does not match', function(done) {
      server.use(function(req, res) {
        res.end('hello world')
      })

      request
        .get('/')
        .expect(200, 'hello world', done)
    })
  })

  describe('in a connect server with a prefix', function() {
    beforeEach(function() {
      var server = connect()
      server.use('/send', instance)
      request = supertest(server)
    })

    buildTests('/send')
  })
})

