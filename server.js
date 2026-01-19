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
app.use(cors());
app.use(express.json({ limit: "10mb" })); // IMPORTANT for attachments

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  /* ---------- LOGIN ---------- */
  socket.on("login", (username) => {
    onlineUsers[username] = socket.id;
    console.log(`${username} logged in`);
  });

  /* ---------- SEND MESSAGE ---------- */
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

      // send to receiver
      if (onlineUsers[receiver]) {
        io.to(onlineUsers[receiver]).emit("receiveMessage", savedMessage);
      }

      // OPTIONAL: confirm delivery to sender
      io.to(socket.id).emit("messageSent", savedMessage);

    } catch (err) {
      console.error("Send message error:", err.message);
    }
  });

  /* ---------- DISCONNECT ---------- */
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

/* ---------- DB ---------- */
mongoose.connect(
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/chatApp"
)
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("Mongo error:", err));

/* ---------- START ---------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
