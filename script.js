// Copyright (c) 2024 Natsurii
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// Function to remove ANSI escape codes from text
function removeAnsiCodes(text) {
  const ansiRegex = /\x1b\[[0-9;]*m/g; // Regular expression to match ANSI escape codes
  return text.replace(ansiRegex, ''); // Remove them from the string
}

// Function to type text in batches, ensuring it's compatible with CSP
function typeTextInBatches(text, element, delay, batchSize, callback) {
  let index = 0;
  const typingInterval = function () {
      // Get the next batch of characters to add
      let batch = text.slice(index, index + batchSize);
      element.text(element.text() + batch); // Append the batch to the element
      index += batchSize;

      // Stop typing when the entire text is typed
      if (index >= text.length) {
          clearInterval(typingIntervalId);
          // Optional: After typing is done, trigger the cursor blink effect
          element.css("opacity", 1); // Ensure text is visible after typing is complete

          // Call the callback function (i.e., add the hyperlink)
          if (callback) callback();
      }
  };

  const typingIntervalId = setInterval(typingInterval, delay); // Use a variable to track the interval
}

// Function to fetch ASCII file and type it into a tag
function asciiToHTML(ascii, tag, delay = 50, batchsize = 50, callback) {
  // Fetch the file (UTF-8 encoded)
  fetch(ascii)
      .then(response => response.text()) // Fetch as text (UTF-8)
      .then(text => {
          // Clean the text by removing ANSI escape sequences
          const cleanedText = removeAnsiCodes(text);

          // Initialize the #ascii-art div with initial empty text
          $(tag).text(''); // Clear the content

          // Start typing the cleaned text in batches of 10 characters, with a delay of 200ms per batch
          typeTextInBatches(cleanedText, $(tag), delay, batchsize, callback); // Pass callback here
      })
      .catch(error => {
          console.error('Error loading ASCII art:', error);
          $(tag).text('Error: Could not load ASCII art.');
      });
}

// Function to add a hyperlink to the element's content
function addHyperlinkToText(elementSelector, textToFind, linkURL) {
  // Get the element's content
  const element = $(elementSelector);
  const content = element.html(); // Use .html() to allow HTML rendering

  // Escape angle brackets
  const escapedText = textToFind.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Replace the target text with a hyperlink
  const newContent = content.replace(escapedText, `<a href="${linkURL}">${escapedText}</a>`);

  // Update the element's content with the new HTML
  element.empty().append(newContent);
}

// Function to fit ASCII line elements to their container width.
// Used for blog dividers and retro image box caps.
function fitAsciiLines() {
  const ratio = 0.56; // approximate IBM VGA glyph width / font-size

  // Blog post dividers: fill with '-' characters
  $('.blog-post-divider').each(function () {
    const $el = $(this);
    const containerWidth = $el.parent().width() || $el.width();
    const fontSize = parseFloat($el.css('font-size')) || 14;
    const charWidth = fontSize * ratio;
    const count = Math.max(12, Math.floor(containerWidth / charWidth));
    $el.text('-'.repeat(count));
  });

  // Retro image box caps: scale to the image inner width
  $('.retro-img-wrapper').each(function () {
    const $wrapper = $(this);
    const $inner = $wrapper.find('.retro-img-inner').first();
    const $caps = $wrapper.find('.ascii-box-line');
    if ($caps.length < 2) return;

    const innerWidth = $inner.outerWidth() || $wrapper.width();
    const fontSize = parseFloat($caps.first().css('font-size')) || 8;
    const charWidth = fontSize * ratio;
    const innerCount = Math.max(6, Math.floor(innerWidth / charWidth) - 2);
    const dashes = '═'.repeat(innerCount);

    $caps.first().text('╔' + dashes + '╗');
    $caps.last().text('╚' + dashes + '╝');
  });
}

// Simple Vanilla JS Markdown Parser
function parseMarkdown(markdown) {
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks ```lang ... ```
  html = html.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre class="language-$1"><code class="language-$1">$2</code></pre>');

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Blockquotes > text
  html = html.replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>');

  // Bold **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(match, alt, url) {
    let filename = url.split('/').pop();
    return `
      <div class="retro-img-wrapper">
        <div class="retro-img-caption">&gt; file: ${filename} (${alt})</div>
        <img src="${url}" alt="${alt}" class="retro-blog-img">
      </div>
    `;
  });

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered Lists - item or * item
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered Lists 1. item
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, function(match) {
    if (!match.includes('<ul>')) {
      return '<ol>' + match + '</ol>';
    }
    return match;
  });

  // Paragraphs
  let lines = html.split(/\n\n+/);
  html = lines.map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h1|h2|h3|pre|blockquote|ul|ol|li|img)/i.test(block)) {
      return block;
    }
    return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
  }).join('\n');

  return html;
}

// Animated favicon: draws glyphs (IBM VGA, white on black) onto a canvas and
// hot-swaps the <link rel="icon"> each frame. Works in browsers that don't
// animate GIF favicons.
//
// Technique: each frame removes the old <link> and inserts a brand-new one with a
// unique, cache-busting URL. Mutating an existing link's href often gets cached
// by the browser and never re-renders, so we always replace it.
//
// Timeline (repeats forever, ~12s per loop):
//   Phase A - N / blank / full block, repeated 3x:
//     N    : 1.0s
//     blank: 0.5s
//     block: 1.0s
//     blank: 0.5s
//   Phase B - spinner (- \ | /), each 20ms, for 3.0s
function initAnimatedFavicon() {
  var SIZE = 16;

  function drawFavicon(text) {
    var canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#fff';
    ctx.font = "16px 'IBM VGA', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, SIZE / 2, SIZE / 2 + 1);

    // Remove the previous favicon link (if any) so the browser re-reads the icon.
    var prev = document.querySelector('link[rel="icon"]');
    if (prev) prev.parentNode.removeChild(prev);

    // Insert a fresh link with a unique URL so the browser doesn't cache it.
    var link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = canvas.toDataURL('image/png', '') + '#' + Date.now();
    (document.head || document.documentElement).appendChild(link);
  }

  var sleep = function (ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  };

  var start = function () {
    var spinner = ['-', '\\', '|', '/'];
    (async function loop() {
      for (;;) {
        for (var cycle = 0; cycle < 3; cycle++) {
          drawFavicon('N');
          await sleep(1000);
          drawFavicon('');
          await sleep(500);
          drawFavicon('\u2588');
          await sleep(1000);
          drawFavicon('');
          await sleep(500);
        }
        var end = Date.now() + 3000;
        var i = 0;
        while (Date.now() < end) {
          drawFavicon(spinner[i % spinner.length]);
          i++;
          await sleep(20);
        }
      }
    })();
  };

  // Preload the IBM VGA webfont, but start animating immediately in case it
  // never resolves (e.g. blocked or not yet loaded). Later frames will use the
  // correct glyph once the font is available.
  if (document.fonts && document.fonts.load) {
    try { document.fonts.load("16px 'IBM VGA'").then(start, start); } catch (e) { start(); }
  } else {
    start();
  }
}

// CRT filter: inject a slowly drifting scan bar overlay (pure CSS handles the
// scanlines, vignette, and flicker via body::before / body::after). This element
// is created here so the CRT effect applies across every page without per-page markup.
function initCrtScanbar() {
  // Only add if it isn't already present.
  if (document.querySelector('.crt-scanbar')) return;
  var bar = document.createElement('div');
  bar.className = 'crt-scanbar';
  document.body.appendChild(bar);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCrtScanbar);
} else {
  // initCrtScanbar();
}

initAnimatedFavicon();
