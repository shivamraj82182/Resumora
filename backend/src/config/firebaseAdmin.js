// const { initializeApp, cert } = require("firebase-admin/app");
// const { getAuth } = require("firebase-admin/auth");
// const path = require("path");

// const serviceAccount = require(
//   path.join(__dirname, "../../firebase-service-account.json")
// );

// const app = initializeApp({
//   credential: cert(serviceAccount),
// });

// const firebaseAdmin = getAuth(app);

// module.exports = firebaseAdmin;


const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const fs = require("fs");
const path = require("path");

// Local development and Render secret file path
const localPath = path.join(
  __dirname,
  "../../firebase-service-account.json"
);

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || localPath;

// Check whether Firebase credentials exist
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `Firebase service account file not found: ${serviceAccountPath}`
  );
}

// Read Firebase credentials securely
const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

// Initialize Firebase only once
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
    });

const firebaseAdmin = getAuth(app);

module.exports = firebaseAdmin;
