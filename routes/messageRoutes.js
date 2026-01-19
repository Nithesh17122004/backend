const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/authMiddleware");


router.get("/:receiver", auth, async (req, res) => {
  try {
    const sender = req.user.username;
    const receiver = req.params.receiver;

    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Get messages error:", err.message);
    res.status(500).json({ error: "Server error fetching messages" });
  }
});

module.exports = router;
