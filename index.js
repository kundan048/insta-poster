/**
 * Fully free daily Instagram poster.
 * Flow: Claude API (caption + card text) -> SVG->PNG render (open-source, free)
 *       -> commit PNG to this repo (free image hosting via raw.githubusercontent.com)
 *       -> Instagram Graph API directly (free, no Metricool)
 *
 * Run manually: node index.js
 * Run on schedule: .github/workflows/daily-post.yml
 */

import Anthropic from "@anthropic-ai/sdk";
import { Resvg } from "@resvg/resvg-js";
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import { buildCardSVG } from "./lib/card-template.js";

const {
  ANTHROPIC_API_KEY,
  IG_USER_ID,        // Instagram Business Account ID
  IG_ACCESS_TOKEN,   // Long-lived Page/Instagram access token
  GITHUB_REPOSITORY, // auto-set by GitHub Actions, e.g. "yourname/ig-auto-poster-free"
  NICHE_PROMPT,
} = process.env;

for (const [key, val] of Object.entries({
  ANTHROPIC_API_KEY, IG_USER_ID, IG_ACCESS_TOKEN, GITHUB_REPOSITORY,
})) {
  if (!val) throw new Error(`Missing required env var: ${key}`);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const BRANCH = "main";

// ---- Step 1: Claude generates the caption + card text ----
async function generateContent() {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You write a daily Instagram "tip card" post about: ${NICHE_PROMPT || "general lifestyle inspiration"}.
Return ONLY valid JSON, no markdown fences, no preamble, in this exact shape:
{
  "tag": "a short 2-3 word category label, e.g. PRODUCTIVITY",
  "headline": "a punchy 3-6 word headline for the card image",
  "tip": "one clear, specific tip in under 25 words, shown on the card image",
  "caption": "the full instagram caption expanding on the tip, with relevant hashtags"
}`,
      },
    ],
  });

  const text = msg.content.find((b) => b.type === "text")?.text ?? "";
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// ---- Step 2: Render the card SVG to PNG (free, open-source, no API) ----
async function renderCard({ tag, headline, tip }) {
  const svg = buildCardSVG({ tag, headline, tip });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1080 } });
  const png = resvg.render().asPng();

  const dateStr = new Date().toISOString().slice(0, 10);
  const relativePath = `posts/${dateStr}.png`;
  await fs.writeFile(relativePath, png);
  return relativePath;
}

// ---- Step 3: Commit + push the PNG so it's publicly reachable ----
function commitAndPush(relativePath) {
  execSync(`git config user.name "ig-auto-poster-bot"`);
  execSync(`git config user.email "actions@users.noreply.github.com"`);
  execSync(`git add ${relativePath}`);
  execSync(`git commit -m "Add daily post image ${relativePath}"`);
  execSync(`git push origin ${BRANCH}`);

  const imageUrl = `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${BRANCH}/${relativePath}`;
  return imageUrl;
}

// ---- Step 4: Publish to Instagram via the Graph API directly ----
async function publishToInstagram({ imageUrl, caption }) {
  // Step 4a: create a media container
  const createRes = await fetch(
    `https://graph.facebook.com/v21.0/${IG_USER_ID}/media?` +
      new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: IG_ACCESS_TOKEN,
      })
  );
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(`Media container failed: ${JSON.stringify(createData)}`);

  // Step 4b: publish the container
  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${IG_USER_ID}/media_publish?` +
      new URLSearchParams({
        creation_id: createData.id,
        access_token: IG_ACCESS_TOKEN,
      }),
    { method: "POST" }
  );
  const publishData = await publishRes.json();
  if (!publishRes.ok) throw new Error(`Publish failed: ${JSON.stringify(publishData)}`);
  return publishData;
}

// ---- Orchestration ----
async function main() {
  console.log("Generating content with Claude...");
  const content = await generateContent();
  console.log(content);

  console.log("Rendering card image...");
  const relativePath = await renderCard(content);

  console.log("Committing image to repo for public hosting...");
  const imageUrl = commitAndPush(relativePath);
  console.log("Image URL:", imageUrl);

  console.log("Waiting for GitHub raw CDN to catch up...");
  await new Promise((r) => setTimeout(r, 15000));

  console.log("Publishing to Instagram...");
  const result = await publishToInstagram({ imageUrl, caption: content.caption });

  console.log("Done:", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
