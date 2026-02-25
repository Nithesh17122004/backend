const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

router.post("/", async (req, res) => {
  try {
    const { message, attachment } = req.body;
    const io = req.io;
    const onlineUsers = req.onlineUsers;

    const msg = {
      sender: "SYSTEM",
      receiver: "Nithesh",
      message,
      attachment: attachment || null,
      timestamp: new Date()
    };

    // ✅ save to DB (prevents disappearing)
    const savedMessage = await Message.create(msg);

    // ✅ send realtime if user online
    if (onlineUsers["Nithesh"]) {
      io.to(onlineUsers["Nithesh"]).emit("receiveMessage", savedMessage);
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Alert error:", err);
    res.status(500).json({ error: "Alert failed" });
  }
});

module.exports = router;
