const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let users = {};

app.get('/', (req, res) => {
  res.send('Hello World!')
  console.log("it is running")
})

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomID, name }) => {
    console.log("i ma in participants signal")
    if (!users[roomID]) users[roomID] = [];
    users[roomID].push({ id: socket.id, name });

    const otherUsers = users[roomID].filter(u => u.id !== socket.id);
    socket.join(roomID);

    socket.emit("all-users", otherUsers);

    socket.to(roomID).emit("user-joined", {
      id: socket.id,
      name,
    });

    socket.on("sending-signal", (payload) => {
      console.log("i ma in sending signal")
      io.to(payload.userToSignal).emit("user-signal", {
        signal: payload.signal,
        callerID: socket.id,
        name: payload.name,
      });
    });

    socket.on("returning-signal", (payload) => {
      console.log("i ma in retruning signal")
      io.to(payload.callerID).emit("receiving-returned-signal", {
        signal: payload.signal,
        id: socket.id,
      });
    });

    socket.on("disconnect", () => {
      users[roomID] = users[roomID]?.filter(user => user.id !== socket.id);
      socket.to(roomID).emit("user-left", socket.id);
    });
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));