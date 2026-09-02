/**
 * Builds a branded SVG "tip card" from text content.
 * Keep this template simple and robust — it runs unattended every day with no human review.
 */
export function buildCardSVG({ headline, tip, tag }) {
  // Simple word-wrap so long tip text doesn't overflow the card.
  function wrap(text, maxCharsPerLine) {
    const words = text.split(" ");
    const lines = [];
    let current = "";
    for (const w of words) {
      if ((current + " " + w).trim().length > maxCharsPerLine) {
        lines.push(current.trim());
        current = w;
      } else {
        current += " " + w;
      }
    }
    if (current.trim()) lines.push(current.trim());
    return lines;
  }

  const tipLines = wrap(tip, 34);
  const tipTspans = tipLines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 48}">${escapeXML(line)}</tspan>`)
    .join("");

  return `
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#4338ca"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <text x="80" y="140" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#a5b4fc" letter-spacing="2">${escapeXML((tag || "DAILY TIP").toUpperCase())}</text>
  <text x="80" y="260" font-family="Arial, sans-serif" font-size="64" font-weight="800" fill="#ffffff">${escapeXML(headline)}</text>
  <line x1="80" y1="300" x2="220" y2="300" stroke="#a5b4fc" stroke-width="6"/>
  <text x="80" y="420" font-family="Arial, sans-serif" font-size="40" font-weight="400" fill="#e0e7ff">${tipTspans}</text>
  <text x="80" y="1000" font-family="Arial, sans-serif" font-size="26" fill="#a5b4fc">Follow for daily tips</text>
</svg>`.trim();
}

function escapeXML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
