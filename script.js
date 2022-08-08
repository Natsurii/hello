const DELAY_IN_MS = 2500;
const wordHighlight = document.querySelector('#highlight');
let wordList = ['create', 'build', 'design', 'start', 'make', 'plan', 'colab', 'coop', 'fix']

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

(async()=>{
    for (let index = 0; index < Infinity; index++) {
     let randomWord = wordList[Math.floor(Math.random() * wordList.length)]
     wordHighlight.textContent = randomWord;
     await delay(DELAY_IN_MS);
    

    } 
  })()


