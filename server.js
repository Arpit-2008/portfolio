const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());

// Use dynamic port for Render / default 5000 for local testing
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server);

// Basic test route
app.get("/", (req, res) => {
    res.send("Cloud Server is running!");
});

// Optional Socket.IO connection
io.on("connection", (socket) => {
    console.log("Client connected");

    // You can add real-time events here if needed
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});