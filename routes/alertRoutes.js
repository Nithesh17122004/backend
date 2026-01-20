const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

/*
  This API is called by Python
  It sends alert to username: Nithesh
*/
router.post("/", async (req, res) => {
  try {
    const { message, attachment } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const alertMessage = new Message({
      sender: "SYSTEM",
      receiver: "Nithesh",
      message,
      attachment: attachment || null
    });

    const savedMessage = await alertMessage.save();

    const io = req.io;
    const onlineUsers = req.app.get("onlineUsers");

    if (onlineUsers["Nithesh"]) {
      io.to(onlineUsers["Nithesh"]).emit("receiveMessage", savedMessage);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Alert error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
