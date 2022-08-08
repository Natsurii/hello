const DELAY_IN_MS = 2500;
const wordHighlight = document.querySelector('#highlight');
let wordList = ['create', 'build', 'design', 'explore', 'develop', 'assemble', 'compile', 'compose', 'fabricate', 'synthesize', 'jerry-build', 'start', 'make', 'plan', 'formulate', 'colab', 'coop', 'conspire', 'collude', 'brainstorm', 'analyze', 'fix', 'conceptualize']

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

(async()=>{
    for (let index = 0; index < Infinity; index++) {
     let randomWord = wordList[Math.floor(Math.random() * wordList.length)]
    await delay(DELAY_IN_MS);
    wordHighlight.textContent = randomWord;
    } 
  })()


