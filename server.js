const Anthropic = require("@anthropic-ai/sdk");
const express = require("express");
const cors = require("cors");
const path = require("path");
const { exec } = require("child_process");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-4-8";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("WARNING: ANTHROPIC_API_KEY is not set. Set it in a .env file (see .env.example).");
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "unset" });

let tavilyPromise = null;
function getTavily() {
  if (!process.env.TAVILY_API_KEY) return Promise.resolve(null);
  if (!tavilyPromise) {
    tavilyPromise = import("tavily").then(({ tavily }) =>
      tavily({ apiKey: process.env.TAVILY_API_KEY })
    );
  }
  return tavilyPromise;
}

let memory = [];

const JARVIS_INSTRUCTIONS = `
You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the AI created by Tony Stark.

Personality:
- Impeccably polite, dry British wit, unflappable under any circumstance.
- Address the user as "sir" naturally, not in every single line.
- Precise, economical with words, but never cold - understated warmth beneath the formality.
- Quietly confident; you understate danger and overstate nothing.
- You may offer a subtle observation or gentle deadpan remark, but never rambling sarcasm.
- You assist with systems, research, planning, calculations, reminders, and general conversation.
- Never claim to have performed a physical action or controlled a device unless the system actually did it.
- Keep responses concise unless the user asks for detail.
`;

app.post("/ask", async (req, res) => {
  try {
    const userMessage = req.body.message || "Hello";
    memory.push({ role: "user", content: userMessage });

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: JARVIS_INSTRUCTIONS,
      messages: memory
    });

    const reply = response.content.find((b) => b.type === "text")?.text || "I heard you, sir.";
    memory.push({ role: "assistant", content: reply });
    memory = memory.slice(-18);

    res.json({ reply });

  } catch (error) {
    console.log(error);
    res.json({ reply: "My apologies, sir - something has gone wrong. Please check the server and API key." });
  }
});

app.post("/search", async (req, res) => {
  const query = req.body.query;

  if (!query) {
    return res.json({ reply: "I didn't catch what to search for, sir." });
  }

  const tavily = await getTavily();
  if (!tavily) {
    return res.json({ reply: "Web search isn't configured yet, sir. Add a TAVILY_API_KEY to enable it." });
  }

  try {
    const results = await tavily.search(query, { maxResults: 5 });
    const summarySource = results.results
      .map((r, i) => `${i + 1}. ${r.title}: ${r.content}`)
      .join("\n");

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: JARVIS_INSTRUCTIONS + "\nSummarize the following search results concisely for the user, in your own voice.",
      messages: [{ role: "user", content: `Query: ${query}\n\nSearch results:\n${summarySource}` }]
    });

    const reply = response.content.find((b) => b.type === "text")?.text || "I couldn't find anything on that, sir.";
    res.json({ reply });

  } catch (error) {
    console.log(error);
    res.json({ reply: "The search systems didn't respond, sir. Best check the connection." });
  }
});

const LAUNCH_TARGETS = {
  youtube: "https://youtube.com",
  google: "https://google.com",
  gmail: "https://mail.google.com",
  chatgpt: "https://chatgpt.com",
  discord: "https://discord.com/app",
  twitch: "https://twitch.tv",
  spotify: "https://open.spotify.com",
  netflix: "https://netflix.com",
  hulu: "https://hulu.com",
  amazon: "https://amazon.com"
};

function openCommandFor(url) {
  if (process.platform === "win32") return `start "" "${url}"`;
  if (process.platform === "darwin") return `open "${url}"`;
  return `xdg-open "${url}"`;
}

app.post("/launch", (req, res) => {
  const target = req.body.app;
  const url = LAUNCH_TARGETS[target];

  if (!url) {
    return res.json({ reply: "I don't have that launch target yet, sir." });
  }

  exec(openCommandFor(url), (error) => {
    if (error) {
      console.log(error);
      return res.json({ reply: `Couldn't launch ${target} from the server, sir. You may need to open it manually.` });
    }
    res.json({ reply: `${target}, launched, sir.` });
  });
});

app.post("/clear-memory", (req, res) => {
  memory = [];
  res.json({ reply: "Memory cleared. Starting fresh, sir." });
});

app.get("/health", (req, res) => {
  res.json({ status: "online", hasClaude: !!process.env.ANTHROPIC_API_KEY, hasSearch: !!process.env.TAVILY_API_KEY });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "jarvis.html"));
});

app.listen(PORT, () => {
  console.log(`J.A.R.V.I.S. ONLINE AT http://localhost:${PORT}`);
});
