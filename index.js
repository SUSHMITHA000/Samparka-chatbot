const express = require("express");
const cors = require("cors");
const dialogflow = require("@google-cloud/dialogflow");

const app = express();

/**
 * ================================
 * MIDDLEWARE
 * ================================
 */
app.use(cors());
app.use(express.json()); // ✅ recommended instead of body-parser

/**
 * ================================
 * CONFIGURATION
 * ================================
 */

// Dialogflow project ID (MUST match the service account JSON)
const PROJECT_ID = "samparkabot-uifr";

// 🔐 Load Dialogflow credentials from ENV (Base64)
if (!process.env.GCP_KEY) {
  console.error("❌ GCP_KEY environment variable is missing");
  process.exit(1);
}

let credentials;
try {
  credentials = JSON.parse(
    Buffer.from(process.env.GCP_KEY, "base64").toString("utf8")
  );
  console.log("✅ Dialogflow credentials loaded from ENV");
} catch (e) {
  console.error("❌ Failed to parse GCP_KEY", e);
  process.exit(1);
}

// Create Dialogflow session client
const sessionClient = new dialogflow.SessionsClient({
  credentials: credentials,
});

/**
 * ================================
 * ROUTES
 * ================================
 */

app.get("/", (req, res) => {
  res.send("Samparka backend is running");
});

app.post("/chat", async (req, res) => {
  try {
    const { text, sessionId } = req.body;

    if (!text) {
      return res.json({ reply: "Please enter a message." });
    }

    const sessionPath = sessionClient.projectAgentSessionPath(
      PROJECT_ID,
      sessionId || "default-session"
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: "en",
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    const botReply =
      result?.fulfillmentText ||
      "Sorry, I didn't understand that.";

    res.json({ reply: botReply });

  } catch (err) {
    console.error("❌ Dialogflow Error:", err);
    res.status(500).json({
      reply: "Server error, please try again later.",
    });
  }
});

/**
 * ================================
 * SERVER START
 * ================================
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Samparka bot backend running on port", PORT);
});
