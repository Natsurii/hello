// Copyright (c) 2024 Natsurii
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

//
function removeAnsiCodes(text) {
    const ansiRegex = /\x1b\[[0-9;]*m/g; // Regular expression to match ANSI escape codes
    return text.replace(ansiRegex, ''); // Remove them from the string
}

function typeTextInBatches(text, element, delay, batchSize) {
    let index = 0;
    const typingInterval = setInterval(function () {
        // Get the next batch of characters to add
        let batch = text.slice(index, index + batchSize);
        element.text(element.text() + batch); // Append the batch to the element
        index += batchSize;

        // Stop typing when the entire text is typed
        if (index >= text.length) {
        clearInterval(typingInterval);
        // Optional: After typing is done, trigger the cursor blink effect
        element.css("opacity", 1); // Ensure text is visible after typing is complete
        }
    }, delay);
}

function asciiToHTML(ascii, tag){
    // Fetch the file (UTF-8 encoded)
  fetch(ascii)
  .then(response => response.text()) // Fetch as text (UTF-8)
  .then(text => {
    // Clean the text by removing ANSI escape sequences
    const cleanedText = removeAnsiCodes(text);

    // Initialize the #ascii-art div with initial empty text
    $(tag).text('');

    // Start typing the cleaned text in batches of 10 characters, with a delay of 200ms per batch
    typeTextInBatches(cleanedText, $(tag), 50, 50);
  })
  .catch(error => {
    console.error('Error loading ASCII art:', error);
    $(tag).text('Error: Could not load ASCII art.');
  });
}

