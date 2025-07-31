const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
require("dotenv").config();

const tokenPath = path.join(__dirname, "../token.json");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ✅ Load saved token from token.json (if it exists)
let oauthToken = null;
if (fs.existsSync(tokenPath)) {
  oauthToken = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  oauth2Client.setCredentials(oauthToken);
}

const setOAuthToken = (token) => {
  oauthToken = token;
  oauth2Client.setCredentials(token);
  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2)); // ✅ Save token to disk
};

const uploadToGoogleDrive = async (
  buffer,
  filename,
  mimetype = "application/pdf"
) => {
  if (!oauthToken) {
    console.error("Google OAuth token is not set. Call /auth first.");
    return null;
  }

  try {
    // ✅ Ensure uploads folder exists
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const tmpPath = path.join(uploadDir, `${Date.now()}-${filename}`);
    fs.writeFileSync(tmpPath, buffer);

    // const fileMetadata = { name: filename };
    const fileMetadata = {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // ✅ Target folder
    };

    const media = {
      mimeType: mimetype,
      body: fs.createReadStream(tmpPath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    fs.unlinkSync(tmpPath); // cleanup temp file

    return response.data.webViewLink;
  } catch (error) {
    console.error("Google Drive upload failed:", error);
    return null;
  }
};

module.exports = { uploadToGoogleDrive, setOAuthToken };
