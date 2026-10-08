const BOX_WIDTH = 72;
const ANSI_RESET = "\u001b[0m";
const TITLE_COLORS = [33, 32, 36, 35, 34, 93, 92];

function colorForPort(port) {
  if (port == null || Number.isNaN(port)) return "";
  const code = TITLE_COLORS[Math.abs(port) % TITLE_COLORS.length];
  return `\u001b[${code}m`;
}

function visibleLength(str) {
  return str.replace(/\u001b\[[0-9;]*m/g, "").length;
}

function wrapText(text, maxInner) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxInner) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word.length > maxInner ? word.slice(0, maxInner) : word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function padLine(content, innerWidth) {
  const pad = Math.max(0, innerWidth - visibleLength(content));
  return `${content}${" ".repeat(pad)}`;
}

/**
 * @param {string} title - plain title (color applied to top border segment)
 * @param {string[]} bodyLines
 * @param {{ port?: number, colorTitle?: boolean }} opts
 * @returns {string[]}
 */
function wrapInBox(title, bodyLines, opts = {}) {
  const innerWidth = BOX_WIDTH - 4;
  const color = opts.colorTitle !== false ? colorForPort(opts.port) : "";
  const titlePlain = title || "lab";
  const topTitle = ` ${titlePlain} `;
  const topFillLen = Math.max(0, BOX_WIDTH - 2 - topTitle.length);
  const topBorder = `┌${topTitle}${"─".repeat(topFillLen)}┐`;
  const coloredTop = color
    ? `${color}┌${ANSI_RESET}${color}${topTitle}${ANSI_RESET}${color}${"─".repeat(topFillLen)}┐${ANSI_RESET}`
    : topBorder;

  const out = [coloredTop];
  for (const raw of bodyLines) {
    for (const segment of wrapText(String(raw), innerWidth)) {
      out.push(`│ ${padLine(segment, innerWidth)} │`);
    }
  }
  out.push(`└${"─".repeat(BOX_WIDTH - 2)}┘`);
  return out;
}

module.exports = {
  wrapInBox,
  colorForPort,
  BOX_WIDTH,
};
