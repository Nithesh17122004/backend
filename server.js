const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const alertRoutes = require("./routes/alertRoutes");
const Message = require("./models/Message");

const app = express();

// middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// health check
app.get("/", (req, res) => res.send("Backend running ✅"));

// create server + socket
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// store online users
const onlineUsers = {};
app.set("onlineUsers", onlineUsers);

// socket logic
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("login", (username) => {
    onlineUsers[username] = socket.id;
    console.log(username + " online");
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { sender, receiver, message, attachment } = data;

      const newMessage = new Message({
        sender,
        receiver,
        message,
        attachment
      });

      const savedMessage = await newMessage.save();

      if (onlineUsers[receiver]) {
        io.to(onlineUsers[receiver]).emit("receiveMessage", savedMessage);
      }

      io.to(socket.id).emit("messageSent", savedMessage);

    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {
    for (const user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }
  });
});

// alert route (Python system)
app.use("/api/alert", (req, res, next) => {
  req.io = io;
  next();
}, alertRoutes);

// mongodb
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("Server running on", PORT));
