// backend/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fileUpload = require('express-fileupload');

const app = express();
app.use(cors({ origin: "*" }));
app.use(fileUpload());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e8 // Set payload capacity up to 100MB safely
});

// Root Health Check Route
app.get('/', (req, res) => {
  res.send('PrintQ Multi-Node WebSocket Server Engine is running.');
});

// File Upload Stream Endpoint
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('Transmission dropped: Missing payload.');
  }

  const file = req.files.file;
  const roomId = req.body.roomId;

  // Convert binary data directly to base64 buffer safe for browser consumption
  const fileDataBase64 = `data:${file.mimetype};base64,${file.data.toString('base64')}`;

  // Emit data packet to specific room instantly
  io.to(roomId).emit('receive_file', {
    fileName: file.name,
    fileType: file.mimetype,
    fileData: fileDataBase64
  });

  res.status(200).send({ status: "success", info: "Packet piped successfully." });
});

// Socket Client Room Control Connection Handlers
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`[Handshake Successful] Client assigned to Node Room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('[System Signal] Client dropped channel pipeline.');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 PrintQ Core Server Engine humming on port ${PORT}`);
});