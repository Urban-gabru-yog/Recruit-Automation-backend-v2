// services/storage.js
const { ConfidentialClientApplication } = require("@azure/msal-node");
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");
require("dotenv").config();

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

// base64url (Graph /shares/u!{id} requires URL-safe)
const toBase64Url = (s) =>
  Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const uploadToOneDrive = async (buffer, filename, mimetype = "application/pdf") => {
  try {
    const accessToken = await getAccessToken();
    const client = Client.init({ authProvider: (done) => done(null, accessToken) });

    const shareLink = "https://globalbees1-my.sharepoint.com/:f:/g/personal/mayur_mundankar_urbangabru_in/Es8YVuxo41BKsg-9yvjN9tMBMDSogAE1128DrBkV1B3zNw?e=mT0sbu"
    if (!shareLink) throw new Error("MS_UPLOAD_FOLDER_LINK is not set");

    // Resolve SharePoint/OneDrive folder from a shared link
    const encoded = toBase64Url(shareLink);
    const folderMetadata = await client.api(`/shares/u!${encoded}?$expand=driveItem`).get();

    const driveId = folderMetadata.driveItem.parentReference.driveId;
    const folderId = folderMetadata.driveItem.id;

    // sanitize filename for SharePoint
    const safeName = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

    // Upload small file directly to the folder
    const uploadApi = `/drives/${driveId}/items/${folderId}:/${safeName}:/content`;
    const uploaded = await client.api(uploadApi).headers({ "Content-Type": mimetype }).put(buffer);

    // Try to create a share link; fall back to webUrl if policy blocks anonymous
    let webUrl;
    try {
      const scope = "anonymous"; // "anonymous" or "organization"
      const linkRes = await client.api(`/drives/${driveId}/items/${uploaded.id}/createLink`).post({
        type: "view",
        scope,
      });
      webUrl = linkRes?.link?.webUrl;
    } catch (e) {
      webUrl = uploaded?.webUrl; // at least org-visible URL
    }

    if (!webUrl) throw new Error("No webUrl returned from Graph");
    return webUrl;
  } catch (err) {
    console.error("OneDrive upload failed:", err?.message);
    console.error("Details:", JSON.stringify(err, null, 2));
    return null;
  }
};

module.exports = { uploadToOneDrive };



// const fs = require("fs");
// const path = require("path");
// require("dotenv").config();
// const { ConfidentialClientApplication } = require("@azure/msal-node");
// const { Client } = require("@microsoft/microsoft-graph-client");
// require("isomorphic-fetch");

// // MSAL config
// const msalConfig = {
//   auth: {
//     clientId: process.env.MS_CLIENT_ID,
//     authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`,
//     clientSecret: process.env.MS_CLIENT_SECRET,
//   },
// };

// const cca = new ConfidentialClientApplication(msalConfig);

// const getAccessToken = async () => {
//   const result = await cca.acquireTokenByClientCredential({
//     scopes: ["https://graph.microsoft.com/.default"],
//   });
//   return result.accessToken;
// };

// const uploadToOneDrive = async (buffer, filename, mimetype = "application/pdf") => {
//   try {
//     const accessToken = await getAccessToken();
//     const client = Client.init({
//       authProvider: (done) => done(null, accessToken),
//     });

//     // 1. Use your share link to get the real folder ID
//     const shareLink = 'https://globalbees1-my.sharepoint.com/:f:/g/personal/mayur_mundankar_urbangabru_in/Es8YVuxo41BKsg-9yvjN9tMBMDSogAE1128DrBkV1B3zNw?e=mT0sbu';
//     const encoded = Buffer.from(shareLink).toString('base64').replace(/=+$/, '');

//     const folderMetadata = await client
//       .api(`/shares/u!${encoded}`)
//       .expand('driveItem')
//       .get();

//     const driveId = folderMetadata.driveItem.parentReference.driveId;
//     const folderId = folderMetadata.driveItem.id;

//     // 2. Upload file to that folder
//     const uploadApi = `/drives/${driveId}/items/${folderId}/children/${filename}/content`;
//     const uploadResponse = await client
//       .api(uploadApi)
//       .put(buffer);

//     // 3. Create public link to the uploaded file
//     const shareFileLink = await client
//       .api(`/drives/${driveId}/items/${uploadResponse.id}/createLink`)
//       .post({
//         type: "view",
//         scope: "anonymous"
//       });

//     return shareFileLink.link.webUrl;
//   } catch (err) {
//     console.error("OneDrive upload failed:", err.message);
//     console.error("Details:", JSON.stringify(err, null, 2));
//     return null;
//   }
// };

// module.exports = {
//   uploadToOneDrive,
// };
