const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    status: { type: String, default: "pending" },
    userId: String
});

module.exports = mongoose.model("Task", taskSchema);