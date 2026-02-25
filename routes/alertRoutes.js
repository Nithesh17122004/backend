const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

module.exports = (io) => {

  router.post("/", async (req, res) => {
    try {
      const { message, attachment } = req.body;

      const msg = {
        sender: "SYSTEM",
        receiver: "Nithesh",
        message,
        attachment,
        timestamp: new Date()
      };

      // ✅ send realtime
      io.to("Nithesh").emit("receiveMessage", msg);

      // ✅ save to database (prevents disappearing on refresh)
      await Message.create(msg);

      res.json({ success: true });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Alert failed" });
    }
  });

  return router;
};
