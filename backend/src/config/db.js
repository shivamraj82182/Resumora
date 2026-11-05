const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);

let lastConnectionError = null;
let lastLoggedError = null;

function redactSensitiveValues(value) {
  return String(value || "")
    .replace(/(mongodb(?:\+srv)?:\/\/)[^/@\s]+@/gi, "$1[redacted]@")
    .replace(/([?&](?:password|pwd|authMechanismProperties)=)[^&\s]+/gi, "$1[redacted]");
}

function describeMongoError(error) {
  const message = redactSensitiveValues(error?.message || "Unknown MongoDB error");
  const code = error?.code || error?.cause?.code || null;
  const syscall = error?.syscall || error?.cause?.syscall || null;
  const errorText = `${code || ""} ${syscall || ""} ${message}`.toLowerCase();

  let category = "mongodb";
  if (/authentication failed|authenticationfailure|bad auth|code 18/.test(errorText)) {
    category = "authentication";
  } else if (/querysrv|enotfound|eai_again|dns/.test(errorText)) {
    category = "dns";
  } else if (/etimedout|timed out|serverselectiontimedout/.test(errorText)) {
    category = "network-timeout";
  } else if (/econnreset|epipe/.test(errorText)) {
    category = "network-reset";
  } else if (/econnrefused/.test(errorText)) {
    category = "network-refused";
  } else if (error?.name === "MongoServerSelectionError") {
    category = "atlas-connectivity";
  }

  const details = {
    category,
    name: error?.name || "Error",
    code,
    syscall,
    message,
  };

  if (error?.cause && error.cause !== error) {
    details.cause = {
      name: error.cause.name || "Error",
      code: error.cause.code || null,
      syscall: error.cause.syscall || null,
      message: redactSensitiveValues(error.cause.message),
    };
  }

  const serverErrors = error?.reason?.servers;
  if (serverErrors) {
    details.serverErrors = Array.from(serverErrors.values())
      .filter((server) => server.error)
      .map((server) => ({
        name: server.error.name || "Error",
        code: server.error.code || null,
        message: redactSensitiveValues(server.error.message),
      }));
  }

  return details;
}

function logMongoError(label, error) {
  lastConnectionError = error;
  lastLoggedError = error;
  console.error(`${label}: ${JSON.stringify(describeMongoError(error))}`);
}

mongoose.connection.on("error", (error) => {
  logMongoError("MongoDB connection error", error);
});

mongoose.connection.on("disconnected", () => {
  setTimeout(() => {
    if (lastConnectionError) {
      console.warn(
        `MongoDB disconnected; last connection error: ${JSON.stringify(
          describeMongoError(lastConnectionError),
        )}`,
      );
      return;
    }

    console.warn(
      "MongoDB disconnected without a preceding driver error event; check Atlas availability and network connectivity.",
    );
  }, 50);
});

async function connectDB() {
  if (!env.mongoUri) {
    throw new Error("MongoDB URI is missing; configure MONGO_URI or MONGODB_URI");
  }

  let conn;
  try {
    conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10_000,
    });
  } catch (error) {
    if (lastLoggedError !== error) {
      logMongoError("MongoDB initial connection failed", error);
    }
    throw error;
  }

  console.log(
    `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
  );
  lastConnectionError = null;
  lastLoggedError = null;
}

module.exports = { connectDB };