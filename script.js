const DELAY_IN_MS = 2500;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

(async()=>{
  const wordHighlight = document.querySelector('#highlight');
  let wordList = ['create', 'build', 'design', 'start', 'make', 'plan', 'colab', 'coop', 'fix']
  
    for (let index = 0; index < Infinity; index++) {
     let randomWord = wordList[Math.floor(Math.random() * wordList.length)]
     wordHighlight.textContent = randomWord;
     await delay(DELAY_IN_MS);
    

    } 
  })()


