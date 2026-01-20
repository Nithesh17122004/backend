const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const alertRoutes = require("./routes/alertRoutes");
const Message = require("./models/Message");

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ---------- API Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Root check
app.get("/", (req, res) => res.send("Backend is live ✅"));

// ---------- HTTP + Socket ----------
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ---------- Online Users Store ----------
const onlineUsers = {};
app.set("onlineUsers", onlineUsers);

// ---------- Socket Logic ----------
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
    for (const user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
        break;
      }
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// ---------- ALERT API (for Python) ----------
app.use("/api/alert", (req, res, next) => {
  req.io = io;
  next();
}, alertRoutes);

// ---------- MongoDB ----------
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

// ---------- Start Server ----------
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
