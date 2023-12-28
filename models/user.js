const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  Id: String,
  amount: Number,
  screen_shot: String
});

const User = mongoose.model("User", userSchema);

module.exports = User;
