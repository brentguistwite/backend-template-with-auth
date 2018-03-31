require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const mongoose = require('mongoose');
const { router: usersRouter, } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy, } = require('./auth');

const { PORT, CLIENT_ORIGIN, DATABASE_URL, } = require('./config');
mongoose.Promise = global.Promise;
const app = express();
app.use(
  bodyParser.json()
);

app.use(
  morgan('common') // eslint-disable-line
);

app.use(
  cors({ origin: CLIENT_ORIGIN, })
);

app.use('/users', usersRouter);
app.use('/auth', authRouter);

passport.use(localStrategy);
passport.use(jwtStrategy);


// Referenced by both runServer and closeServer. closeServer
// Assumes runServer has run and set `server` to a server object
let server;

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, (err) => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', (err) => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer, };
