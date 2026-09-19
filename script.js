// Copyright (c) 2024 Natsurii
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// Function to remove ANSI escape codes from text
function removeAnsiCodes(text) {
  const ansiRegex = /\x1b\[[0-9;]*m/g; // Regular expression to match ANSI escape codes
  return text.replace(ansiRegex, ''); // Remove them from the string
}

// Users who prefer reduced motion get the art instantly, no typing.
var REDUCED_MOTION = false;
try {
  REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch (e) {}

// Function to type text in batches, ensuring it's compatible with CSP
function typeTextInBatches(text, element, delay, batchSize, callback) {
  if (REDUCED_MOTION) {
    element.text(text);
    element.css("opacity", 1);
    if (callback) callback();
    return;
  }
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

          // Remember the full text so the art can be refit on resize
          $(tag).data('ascii-text', cleanedText);

          // Scale the art to its container instead of clipping it
          fitArtFontSize($(tag), cleanedText);

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

  // Replace the target text with a hyperlink.
  // tabindex="-1": the art container is aria-hidden, so its links must stay
  // out of the tab order; keyboard users use <nav class="sr-nav"> instead.
  const newContent = content.replace(escapedText, `<a href="${linkURL}" tabindex="-1">${escapedText}</a>`);

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

// Scale a pre art container so its longest line fits the viewport: the art is
// shrunk to fit instead of clipped, and never upscaled past the CSS size.
// (parent().width() is circular here — fit-content parents shrink to their
// own art — so the viewport is the stable bound.)
function fitArtFontSize($el, text) {
  var maxLen = 0;
  var lines = text.split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].length > maxLen) maxLen = lines[i].length;
  }
  if (!maxLen) return;

  // Read the CSS-driven size by briefly clearing any inline override.
  var prevStyle = $el.attr('style');
  $el.css('font-size', '');
  var cssSize = parseFloat($el.css('font-size')) || 16;
  if (prevStyle === undefined) $el.removeAttr('style');
  else $el.attr('style', prevStyle);

  var ratio = 0.56; // approximate IBM VGA glyph width / font-size
  var fitSize = window.innerWidth / (maxLen * ratio);
  $el.css('font-size', Math.min(cssSize, fitSize) + 'px');
}

// Refit ASCII dividers, image box caps, and pre art when the layout changes
// (window resize, device rotation, browser zoom). Coalesced via rAF.
function initFitObserver() {
  var pending = false;
  var run = function () {
    fitAsciiLines();
    $('.ascii-container').each(function () {
      var text = $(this).data('ascii-text');
      if (text != null) fitArtFontSize($(this), text);
    });
  };
  var schedule = function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      run();
    });
  };
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(schedule).observe(document.body);
  }
  window.addEventListener('resize', schedule);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFitObserver);
} else {
  initFitObserver();
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

  // Blockquotes > text (literal ">" was escaped to "&gt;" up front)
  html = html.replace(/^&gt; (.*$)/gm, '<blockquote>$1</blockquote>');

  // Bold **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Images ![alt](url), optional "WxH" title supplies intrinsic size (prevents CLS)
  html = html.replace(/!\[([^\]]*)\]\((\S+)(?:\s+"([^"]*)")?\)/g, function(match, alt, url, dims) {
    let filename = url.split('/').pop();
    let sizeAttrs = '';
    if (dims) {
      const size = dims.match(/^(\d{1,4})x(\d{1,4})$/i);
      if (size) sizeAttrs = ' width="' + size[1] + '" height="' + size[2] + '"';
    }
    return `
      <div class="retro-img-wrapper">
        <div class="retro-img-caption">&gt; file: ${filename} (${alt})</div>
        <img src="${url}" alt="${alt}" class="retro-blog-img" loading="lazy"${sizeAttrs}>
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
//   Phase B - spinner (- \ | /), each 100ms, for 3.0s
//
// The loop pauses while the tab is hidden (visibilitychange) and is skipped
// entirely under prefers-reduced-motion (the static favicon stays).
function initAnimatedFavicon() {
  var SIZE = 16;

  if (REDUCED_MOTION) return;

  var hidden = false;
  var waiters = [];
  function onVisibility() {
    hidden = document.visibilityState === 'hidden';
    if (!hidden) {
      var w = waiters;
      waiters = [];
      for (var i = 0; i < w.length; i++) w[i]();
    }
  }
  document.addEventListener('visibilitychange', onVisibility);

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
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (hidden) waiters.push(resolve);
        else resolve();
      }, ms);
    });
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
          await sleep(100);
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
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCrtScanbar);
} else {
  initCrtScanbar();
}

initAnimatedFavicon();

// ============ Light / Dark theme engine ============
// Default is dark (the CRT look). Choice persists in localStorage. The
// anti-flash inline <head> snippet already sets [data-theme] before paint;
// here we sync the Prism stylesheet swap and mount the floating switch.
var THEME_KEY = 'natsurii-theme';

function getTheme() {
  var t = 'dark';
  try { t = localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) {}
  return t === 'light' ? 'light' : 'dark';
}

function syncSwitch(theme) {
  var sw = document.querySelector('.theme-switch');
  if (!sw) return;
  sw.setAttribute('data-state', theme);
  sw.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}

  // Keep the browser UI chrome (url bar) in sync with the page background.
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    (document.head || document.documentElement).appendChild(meta);
  }
  var bg = '#181818';
  try {
    bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || bg;
  } catch (e) {}
  meta.setAttribute('content', bg);

  // Swap the Prism syntax theme (present only on code-bearing pages).
  var darkLink = document.getElementById('prism-dark');
  var lightLink = document.getElementById('prism-light');
  if (darkLink) darkLink.disabled = (theme === 'light');
  if (lightLink) lightLink.disabled = (theme !== 'light');

  syncSwitch(theme);
}

function mountThemeSwitch() {
  if (document.querySelector('.theme-switch')) return;
  // Screenshot/embed capture (?embed=1): keep the chrome out of the card.
  try {
    if (new URLSearchParams(window.location.search).get('embed') === '1') return;
  } catch (e) {}
  var theme = getTheme();
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-switch';
  btn.setAttribute('data-state', theme);
  btn.setAttribute('role', 'switch');
  btn.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
  btn.setAttribute('aria-label', 'Toggle light or dark theme');
  btn.title = 'Toggle light / dark';
  btn.innerHTML =
    '<span class="sw-opt sw-moon"><span class="crescent"></span></span>' +
    '<span class="sw-opt sw-sun">\u263C</span>' +
    '<span class="sw-thumb"></span>';
  btn.addEventListener('click', function () {
    applyTheme(getTheme() === 'light' ? 'dark' : 'light');
  });
  document.body.appendChild(btn);
}

function initTheme() {
  applyTheme(getTheme());
  mountThemeSwitch();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
