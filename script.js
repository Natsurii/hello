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
