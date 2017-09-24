const http = require('http');
const socketio = require('socket.io');
const xxh = require('xxhashjs');

const fs = require('fs');

const walkImage = fs.readFileSync(`${__dirname}/../client/walk.png`);

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const handler = (req, res) => {
  if(req.url === '/walk.png') {
    res.writeHead(200, {'Content-Type': 'image/png'});
    res.end(walkImage);
  }
  else {
    fs.readFile(`${__dirname}/../client/index.html`, (err, data) => {
      // if err, throw it for now
      if (err) {
        throw err;
      }
      res.writeHead(200);
      res.end(data);
    });
  }
};

const app = http.createServer(handler);
const io = socketio(app);

app.listen(PORT);

io.on('connection', (sock) => {
  const socket = sock;
  socket.join('room1');
  
  socket.square = {
    hash: xxh.h32(`${socket.id}${Date.now()}`, 0xCAFEBABE).toString(16),
    lastUpdate: new Date().getTime(),
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    destX: 0,
    destY: 0,
    alpha: 0,
    height: 100,
    width: 100
  };
  
  socket.emit('joined', socket.square);

  socket.on('movementUpdate', (data) => {
    socket.square = data;
    socket.square.lastUpdate = Date.now();
    
    socket.broadcast.to('room1').emit('updatedMovement', socket.square);
    //io.sockets.in('room1').emit('updatedMovement', socket.square);
  });

  socket.on('disconnect', () => {
    io.sockets.in('room1').emit('left', socket.square.hash);
  
    socket.leave('room1');
  });
});

console.log(`listening on port ${PORT}`);
