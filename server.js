const OpenAI = require("openai");
const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let memory = [];

app.post("/ask", async (req, res) => {
  try {
    const userMessage = req.body.message || "Hello";
    memory.push("Sir: " + userMessage);
    memory = memory.slice(-18);

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: `
You are Jarvis Prime, a friendly teenage-style AI assistant.

Personality:
- Chill, smart, funny, loyal, and helpful.
- Call the user "Sir" sometimes, but not every sentence.
- Sound like a cool tech friend, not an old robot.
- Be confident, upbeat, and natural.
- Keep replies short unless detail is needed.
- Use casual phrases lightly like "bet", "got you", "clean", "solid move".
- Do not overdo slang.
- You help with gaming, tech, YouTube, PS5 setup, ideas, and commands.
- Never claim to control something unless the code actually did it.
`,
      input: memory.join("\n") + "\nJarvis Prime:"
    });

    memory.push("Jarvis Prime: " + response.output_text);
    res.json({ reply: response.output_text });

  } catch (error) {
    console.log(error);
    res.json({ reply: "Something glitched, Sir. Check the server, API key, or quota." });
  }
});

app.post("/launch", (req, res) => {
  const target = req.body.app;

  const apps = {
    youtube: "start https://youtube.com",
    google: "start https://google.com",
    gmail: "start https://mail.google.com",
    chatgpt: "start https://chatgpt.com",
    discord: "start https://discord.com/app",
    twitch: "start https://twitch.tv",
    spotify: "start spotify:",
    psremote: "start psremoteplay:",
    netflix: "start https://netflix.com",
    hulu: "start https://hulu.com",
    amazon: "start https://amazon.com"
  };

  if (!apps[target]) {
    return res.json({ reply: "I don’t have that launch target yet, Sir." });
  }

  exec(apps[target], () => {
    res.json({ reply: target + " launched. Clean." });
  });
});

app.post("/clear-memory", (req, res) => {
  memory = [];
  res.json({ reply: "Memory cleared. Fresh start, Sir." });
});

app.listen(3000, () => {
  console.log("JARVIS PRIME ONLINE AT PORT 3000");
});