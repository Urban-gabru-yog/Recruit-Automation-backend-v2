const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { ConfidentialClientApplication } = require("@azure/msal-node");
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");

// MSAL config
const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`,
    clientSecret: process.env.MS_CLIENT_SECRET,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

const getAccessToken = async () => {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });
  return result.accessToken;
};

const uploadToOneDrive = async (buffer, filename, mimetype = "application/pdf") => {
  try {
    const accessToken = await getAccessToken();
    const client = Client.init({
      authProvider: (done) => done(null, accessToken),
    });

    // 1. Use your share link to get the real folder ID
    const shareLink = 'https://globalbees1-my.sharepoint.com/:f:/g/personal/mayur_mundankar_urbangabru_in/Es8YVuxo41BKsg-9yvjN9tMBMDSogAE1128DrBkV1B3zNw?e=mT0sbu';
    const encoded = Buffer.from(shareLink).toString('base64').replace(/=+$/, '');

    const folderMetadata = await client
      .api(`/shares/u!${encoded}`)
      .expand('driveItem')
      .get();

    const driveId = folderMetadata.driveItem.parentReference.driveId;
    const folderId = folderMetadata.driveItem.id;

    // 2. Upload file to that folder
    const uploadApi = `/drives/${driveId}/items/${folderId}/children/${filename}/content`;
    const uploadResponse = await client
      .api(uploadApi)
      .put(buffer);

    // 3. Create public link to the uploaded file
    const shareFileLink = await client
      .api(`/drives/${driveId}/items/${uploadResponse.id}/createLink`)
      .post({
        type: "view",
        scope: "anonymous"
      });

    return shareFileLink.link.webUrl;
  } catch (err) {
    console.error("OneDrive upload failed:", err.message);
    console.error("Details:", JSON.stringify(err, null, 2));
    return null;
  }
};

// const uploadToOneDrive = async (buffer, filename, mimetype = "application/pdf") => {
//   try {
//     const accessToken = await getAccessToken();
//     const client = Client.init({
//       authProvider: (done) => done(null, accessToken),
//     });

//     const driveResponse = await client.api('/drives').get();
//     const driveId = driveResponse.value[0].id;

//     // Ensure /resumes folder exists
//     await client.api(`/drives/${driveId}/root/children`).post({
//       name: "resumes",
//       folder: {},
//       "@microsoft.graph.conflictBehavior": "replace"
//     });

//     const uploadPath = `/resumes/${filename}`;

//     // Upload file
//     await client
//       .api(`/drives/${driveId}/root:${uploadPath}:/content`)
//       .put(buffer);

//     // Create public link to the file (NOT the folder)
//     const shareLink = await client
//       .api(`/drives/${driveId}/root:${uploadPath}:/createLink`)
//       .post({
//         type: "view",
//         scope: "anonymous"
//       });

//     return shareLink.link.webUrl; // ✅ Public direct file URL
//   } catch (err) {
//     console.error("OneDrive upload failed:", err.message);
//     console.error("Details:", JSON.stringify(err, null, 2));
//     return null;
//   }
// };


// const uploadToOneDrive = async (buffer, filename, mimetype = "application/pdf") => {
//   try {
//     const accessToken = await getAccessToken();
//     const client = Client.init({
//       authProvider: (done) => done(null, accessToken),
//     });

//     const driveResponse = await client.api('/drives').get();
//     const driveId = driveResponse.value[0].id;

//     // Create /resumes folder if it doesn't exist
//     await client.api(`/drives/${driveId}/root/children`).post({
//       name: "resumes",
//       folder: {},
//       "@microsoft.graph.conflictBehavior": "replace"
//     });

//     const uploadPath = `/resumes/${filename}`;

//     // Upload the file
//     const response = await client
//       .api(`/drives/${driveId}/root:${uploadPath}:/content`)
//       .put(buffer);

//     // Create a shareable public link
//     const sharingLinkResponse = await client
//       .api(`/drives/${driveId}/root:${uploadPath}:/createLink`)
//       .post({
//         type: "view",
//         scope: "anonymous",
//       });

//     return sharingLinkResponse.link.webUrl;
//   } catch (err) {
//     console.error("OneDrive upload or share failed:", err.message);
//     console.error("Details:", JSON.stringify(err, null, 2));
//     return null;
//   }
// };




// const uploadToOneDrive = async (
//   buffer,
//   filename,
//   mimetype = "application/pdf"
// ) => {
//   try {
//     const accessToken = await getAccessToken();
//     const client = Client.init({
//       authProvider: (done) => done(null, accessToken),
//     });

//     const uploadPath = `/resumes/${filename}`;

//     // Upload file to OneDrive
//     const response = await client
//       .api(`/me/drive/root:${uploadPath}:/content`)
//       .put(buffer);

//     // Make the uploaded file public by creating a sharing link
//     const sharingLinkResponse = await client
//       .api(`/me/drive/root:${uploadPath}:/createLink`)
//       .post({
//         type: "view",
//         scope: "anonymous",
//       });

//     return sharingLinkResponse.link.webUrl; // Public sharable URL
//   } catch (err) {
//     console.error("OneDrive upload or share failed:", err.message);
//     return null;
//   }
// };


module.exports = {
  uploadToOneDrive,
};
