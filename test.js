
var expect      = require('must')
  , contactYou  = require('./')
  , http        = require('http')
  , supertest   = require('supertest')
  , mailer      = require('nodemailer')

describe('contact-you', function() {
  var fake =  {
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

    , instance
    , request

  beforeEach(function() {
    fake.reset()
    instance = contactYou({
        transport: mailer.createTransport(fake)
      , from: 'original@foo.com'
      , to: 'dest@collina.me'
    })
    request = supertest(http.createServer(instance))
  })

  it('should return a 200', function(done) {
    request
      .post('/')
      .send({ title: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(200, done)
  })

  it('should return a 500 if something goes wrong', function(done) {
    fake.nextIsSent = false
    request
      .post('/')
      .send({ title: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(500, done)
  })

  it('should actually send an email', function(done) {
    request
      .post('/')
      .send({ title: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(200, function() {
        expect(fake.lastMail).to.exist()
        done()
      })
  })

  it('should send an email with the right title', function(done) {
    request
      .post('/')
      .send({ title: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(200, function() {
        expect(fake.lastMail.data.title).to.eql('this is an email')
        done()
      })
  })

  it('should send an email with the right title (bis)', function(done) {
    request
      .post('/')
      .send({ title: 'another email', text: 'with some text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(200, function() {
        expect(fake.lastMail.data.title).to.eql('another email')
        done()
      })
  })

  it('should send an email with the right text', function(done) {
    request
      .post('/')
      .send({ title: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(200, function() {
        expect(fake.lastMail.data.text).to.eql('Email sent on behalf of: foo@foo.com\n\n\nwith some text')
        done()
      })
  })

  it('should send an email with the right text (bis)', function(done) {
    request
      .post('/')
      .send({ title: 'this is an email', text: 'other text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(200, function() {
        expect(fake.lastMail.data.text).to.eql('Email sent on behalf of: foo@foo.com\n\n\nother text')
        done()
      })
  })

  it('should send an email from the from address specified in the constructor', function(done) {
    request
      .post('/')
      .send({ title: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(200, function() {
        expect(fake.lastMail.data.from).to.eql('original@foo.com')
        done()
      })
  })

  it('should send an email to the to address specified in the constructor', function(done) {
    request
      .post('/')
      .send({ title: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(200, function() {
        expect(fake.lastMail.data.to).to.eql('dest@collina.me')
        done()
      })
  })

  it('should include the from address in the payload as replyTo', function(done) {
    request
      .post('/')
      .send({ title: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(200, function() {
        expect(fake.lastMail.data.replyTo).to.eql('foo@foo.com')
        done()
      })
  })

  it('should include the from address in the payload as CC', function(done) {
    request
      .post('/')
      .send({ title: 'this is an email', text: 'with some text', from: 'foo@foo.com' })
      .set('Accept', 'application/json')
      .expect(200, function() {
        expect(fake.lastMail.data.cc).to.eql('foo@foo.com')
        done()
      })
  })

})

