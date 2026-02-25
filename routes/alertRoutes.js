const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const multer = require("multer");
const path = require("path");

// storage config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST /api/alert
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    const attachment = req.file ? `/uploads/${req.file.filename}` : null;

    const newMessage = new Message({
      sender,
      receiver,
      message,
      attachment
    });

    const savedMessage = await newMessage.save();

    const onlineUsers = req.app.get("onlineUsers");

    if (onlineUsers[receiver]) {
      req.io.to(onlineUsers[receiver]).emit("receiveMessage", savedMessage);
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Alert failed" });
  }
});

module.exports = router;
