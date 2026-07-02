# J.A.R.V.I.S.

A browser-based AI assistant inspired by Tony Stark's J.A.R.V.I.S. from Iron Man: a holographic voice interface backed by an Express server that talks to OpenAI (and optionally Tavily for live web search).

Fan project, not affiliated with Marvel/Disney.

## Features

- Animated cyan hologram UI (orb, rings, particles) with a boot sequence.
- Voice control via the Web Speech API (say "Jarvis" + your command) and text-to-speech replies.
- A visible text input as a fallback for browsers/environments without microphone access.
- Conversational AI replies in J.A.R.V.I.S.'s voice, with short-term memory of the conversation.
- Built-in voice commands: open sites (YouTube, Gmail, Spotify, etc.), YouTube/Google search, "search the web for ..." (via Tavily), time/date, fullscreen, memory reset.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your keys:
   ```
   cp .env.example .env
   ```
   - `OPENAI_API_KEY` is required for conversational replies.
   - `TAVILY_API_KEY` is optional; enables the "search the web for" command.
3. Start the server:
   ```
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge (required for voice recognition). Click **START** to enable the microphone, or use the text box at the bottom of the screen.

## Notes

- Voice recognition requires a Chromium-based browser (Chrome/Edge) with microphone permission.
- The `/launch` endpoint opens links on the machine running the server (via `start`/`open`/`xdg-open`), not the browser's machine - most useful when running locally on your own desktop.
