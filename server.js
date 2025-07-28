const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// POST route to handle contact form
app.post('/contact', (req, res) => {
  const newMessage = req.body;
  console.log("Received form data:", newMessage);

  const filePath = path.join(__dirname, 'messages.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    let messages = [];

    if (!err && data) {
      try {
        messages = JSON.parse(data);
      } catch (parseErr) {
        console.error("Error parsing JSON:", parseErr);
        return res.status(500).json({ error: "Server error reading messages." });
      }
    }

    messages.push(newMessage);

    fs.writeFile(filePath, JSON.stringify(messages, null, 2), err => {
      if (err) {
        console.error("Error writing file:", err);
        return res.status(500).json({ error: "Error saving message." });
      }
      console.log("✅ Message saved!");
      res.json({ message: "Message saved successfully!" });
    });
  });
});

// 🔥 Fallback for all GET requests (important!)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
