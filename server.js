const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

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
  const { name, email, subject, message } = req.body;
  console.log("Received form data:", req.body);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MY_EMAIL,         // your Gmail address
      pass: process.env.MY_EMAIL_PASS,    // your Gmail app password
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.MY_EMAIL,
    subject: `Portfolio Message: ${subject}`,
    text: `
You received a message from your portfolio contact form:

Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Error sending email:", error);
      return res.status(500).json({ message: "Failed to send message." });
    } else {
      console.log("✅ Email sent:", info.response);
      return res.json({ message: "Message sent successfully via email!" });
    }
  });
});

// Fallback route for SPA (frontend)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
