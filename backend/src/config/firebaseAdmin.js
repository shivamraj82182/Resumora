const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");

const serviceAccount = require(
  path.join(__dirname, "../../firebase-service-account.json")
);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const firebaseAdmin = getAuth(app);

module.exports = firebaseAdmin;