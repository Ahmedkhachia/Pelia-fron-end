
const express = require('express');
const connection = require('./database')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
// var cookieParser = require('cookie-parser')

// const WebSocket = require('ws');


// var csrf = require('csurf')
const bodyParser = require('body-parser');
const users = require('./routes');

// var csrfProtection = csrf({})

const app = express();
app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })) 
app.use(cookieParser());
app.use(session({
    secret: "application_secret",
    resave: false,
    saveUninitialized: false
}))
app.use(users)

connection.sync()
          .then(result => {
              app.listen(4300, () => console.log('Server ON'))
          })
          .catch((err) => {
              console.log('error: ', err)
          })