const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { User } = require("../models");
require("dotenv").config();

// const { google } = require("googleapis");
// const { setOAuthToken } = require("../services/storage");

// User login route (unchanged)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || user.password !== password)
    return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: user.id, role: user.role }, "secret");
  res.json({ token });
});

// Setup Google OAuth2 client
// const oauth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   process.env.GOOGLE_REDIRECT_URI
// );

// // Step 1: Redirect to Google for Drive access
// router.get("/gdrive/auth", (req, res) => {
//   const authUrl = oauth2Client.generateAuthUrl({
//     access_type: "offline",
//     scope: ["https://www.googleapis.com/auth/drive.file"],
//     prompt: "consent",
//     redirect_uri: process.env.GOOGLE_REDIRECT_URI, // ✅ Force explicit redirect URI
//   });
//   res.redirect(authUrl);
// });

// // Step 2: Handle OAuth2 callback
// router.get("/gdrive/oauth2callback", async (req, res) => {
//   const { code } = req.query;
//   console.log("OAuth Redirect URI used:", process.env.GOOGLE_REDIRECT_URI);

//   try {
//     const tokenResponse = await oauth2Client.getToken(code);
//     const tokens = tokenResponse.tokens;

//     setOAuthToken(tokens); // ✅ save token
//     res.send("✅ Google Drive connected! You can now upload resumes.");
//   } catch (err) {
//     console.error("OAuth callback failed:", err);
//     res.status(500).send("Authentication with Google failed");
//   }
// });

module.exports = router;
