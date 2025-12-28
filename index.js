const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dialogflow = require("@google-cloud/dialogflow");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// your Dialogflow project id and key file name
const PROJECT_ID = "samparkabot-uifr";
const KEYFILE = "samparka-key.json"; // JSON key you downloaded

const sessionClient = new dialogflow.SessionsClient({
  keyFilename: KEYFILE,
});

app.get("/",(req,res)=>{
  res.send("Samparka backend is running");
})

app.post("/chat", async (req, res) => {
  try {
    const userText = req.body.text || "";
    const sessionId = req.body.sessionId || "default-session";

    const sessionPath = sessionClient.projectAgentSessionPath(
      PROJECT_ID,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: userText,
          languageCode: "en",
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    const botReply =
      (result && result.fulfillmentText) ||
      "Sorry, I didn't understand that.";

    res.json({ reply: botReply });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ reply: "Server error, please try again later." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(" Samparka bot backend running on port", PORT)
);
