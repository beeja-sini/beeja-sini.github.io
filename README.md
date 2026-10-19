# The Lost Temple of Beejasini

My playable portfolio. Run through an ancient temple, jump over chasms and roots, and collect relics that unlock each part of my story:

- 🗿 **Stone tablet**: About me, experience and education
- 💎 **Gems**: one per key skill
- 📜 **Ancient scrolls**: one per project
- 🔥 **Shrine**: contact details and CV download

There's also a **Skip the adventure** button for a classic portfolio view, a **Temple Guide** chatbot, day/night mode, sound toggle and a high score saved in the browser.

Built with plain HTML, CSS and JavaScript. No frameworks, no build step.

## Files

| File | What it does |
|---|---|
| `index.html` | Page structure |
| `style.css` | All styling (day and night themes) |
| `data.js` | **All my content.** Edit this to update the game, classic view and chatbot at once |
| `game.js` | The runner game (canvas) and sound effects |
| `chatbot.js` | The Temple Guide chatbot (answers from `data.js`, runs in the browser) |
| `main.js` | Connects everything: relic pop-ups, views, controls, preferences |
| `assets/` | Put `Beejasini-Futtinga-CV.pdf` (the version without your phone number) and any project screenshots here |

## Run it locally

Open `index.html` in a browser, or use the VS Code **Live Server** extension.

## Publish on GitHub Pages

1. Create a public repository named exactly `<your-username>.github.io`.
2. Upload or push all these files to the `main` branch (keep `index.html` at the top level).
3. Go to **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io`.

Direct link to the classic portfolio: `https://<your-username>.github.io/#classic`

## Customising

- **Add your CV**: save it as `assets/Beejasini-Futtinga-CV.pdf` (or change `resume` in `data.js`).
- **Add a GitHub link**: fill in `github` in `data.js`.
- **Project screenshots**: add `image: "assets/my-screenshot.png"` to a project in `data.js`.
- **Project links**: add `links: [{ label: "Live demo", url: "https://..." }]` to a project.
- **New skill gem**: add an entry to `gems` in `data.js`. The game makes room for it automatically.
- **Teach the chatbot**: add keywords and answers in `chatbot.js` (`SKILLS` and `INTENTS`).

## Visitor analytics (GoatCounter, free)

1. Sign up at [goatcounter.com](https://www.goatcounter.com) and pick a code, e.g. `beejasini`.
2. In `data.js`, set `analytics: { goatcounter: "https://beejasini.goatcounter.com/count" }`.
3. Push the change. Visits appear in your GoatCounter dashboard within a few minutes.

Besides page visits, the site records these events: `start-run`, `skip-adventure`, `finish-run`, `play-from-classic`, `open-chat`, `download-cv`, `click-email`, `click-linkedin` and `read-post-<slug>`. GoatCounter doesn't use tracking cookies.

## Writing a new blog post

Add an entry at the top of `blog` in `data.js` with a `slug`, `title`, `date`, `excerpt` and `body` (one string per paragraph). The direct link to the blog is `/#blog`.

## Controls

Space, ↑ or W (or tap) to jump; hold for a higher jump. Esc or P pauses.
