const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: String,
    receiver: String,
    message: String,
    attachment: {
      name: String,
      data: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
