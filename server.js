const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const NodeMediaServer = require('node-media-server');
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Set up basic authentication
passport.use(new BasicStrategy((username, password, done) => {
    if (username === 'admin' && password === 'turtle123') {
        return done(null, true);
    } else {
        return done(null, false);
    }
}));

app.use(passport.authenticate('basic', { session: false }));

// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Set up WebSocket connection for video stream
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
        // Broadcast the camera input to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Set up Node Media Server for camera streaming
const config = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        allow_origin: '*'
    }
};

const nms = new NodeMediaServer(config);
nms.run();
