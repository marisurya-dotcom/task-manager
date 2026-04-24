require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/userModel");
const Task = require("./models/taskModel");

const app = express();

app.use(cors());
app.use(express.json());

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("DB Error:", err));

// ================= AUTH MIDDLEWARE =================
const authMiddleware = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// ================= HOME ROUTE =================
app.get("/", (req, res) => {
    res.send("Server is working 🚀");
});

// ================= SIGNUP =================
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role, organization } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            organization
        });

        await user.save();

        res.json({ message: "User created successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
    try {
        console.log("LOGIN BODY:", req.body);

        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "secretkey",
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ================= CREATE TASK =================
app.post("/task", authMiddleware, async (req, res) => {
    try {
        const { title, description } = req.body;

        const task = new Task({
            title,
            description,
            userId: req.user.id
        });

        await task.save();

        res.json({
            message: "Task created",
            task
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ================= GET TASKS =================
app.get("/task", authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id });

        res.json({
            message: "Tasks fetched",
            tasks
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ================= UPDATE TASK =================
app.put("/task/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const updatedTask = await Task.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            req.body,
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json({
            message: "Task updated",
            task: updatedTask
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ================= DELETE TASK =================
app.delete("/task/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const deletedTask = await Task.findOneAndDelete({
            _id: id,
            userId: req.user.id
        });

        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json({
            message: "Task deleted successfully"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ================= SERVER (STEP 4 DEPLOYMENT READY) =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});