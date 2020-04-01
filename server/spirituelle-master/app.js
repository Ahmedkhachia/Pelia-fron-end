
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


// const WS_PORT = process.env.WS_PORT || 5001;
// const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS server is listening at ws://localhost:${WS_PORT}`));
// let connectedClients = [];
// wsServer.on('connection', (ws, req) => {

//     connectedClients.push(ws);
//     // console.log(connectedClients)
//     // listen for messages from the streamer, the clients will not send anything so we don't need to filter
//     ws.on('message', data => {
//         console.log(data)
//         // send the base64 encoded frame to each connected ws
//         connectedClients.forEach((ws, i) => {
//             if (ws.readyState === ws.OPEN) { // check if it is still connected
//                 ws.send(data); // send
//             } else { // if it's not connected remove from the array of connected ws
//                 connectedClients.splice(i, 1);
//             }
//         });
//     });
// });

connection.sync()
          .then(result => {
              app.listen(5000, () => console.log('Server ON'))
          })
          .catch((err) => {
              console.log('error: ', err)
          })