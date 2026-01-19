const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const Message = require("./models/Message");

const app = express();

// Middleware
app.use(cors()); // you can limit origin to your frontend later
app.use(express.json({ limit: "10mb" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Root route to confirm backend is live
app.get("/", (req, res) => res.send("Backend is live ✅"));

// HTTP + Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("login", (username) => {
    onlineUsers[username] = socket.id;
    console.log(`${username} logged in`);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { sender, receiver, message, attachment } = data;

      const newMessage = new Message({
        sender,
        receiver,
        message: message || "",
        attachment: attachment || null
      });

      const savedMessage = await newMessage.save();

      if (onlineUsers[receiver]) {
        io.to(onlineUsers[receiver]).emit("receiveMessage", savedMessage);
      }

      io.to(socket.id).emit("messageSent", savedMessage);
    } catch (err) {
      console.error("Send message error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    for (const username in onlineUsers) {
      if (onlineUsers[username] === socket.id) {
        delete onlineUsers[username];
        break;
      }
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("Mongo error:", err));

// Use Render dynamic PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
