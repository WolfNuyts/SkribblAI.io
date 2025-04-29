const canvas = document.querySelector('canvas');
const imageBase64 = canvas ? canvas.toDataURL('image/png').split(',')[1] : "";
const hintElems = Array.from(document.querySelectorAll('.hints .hint'));
const wordLength = hintElems.length;

let hints = {};
hintElems.forEach((elem, idx) => {
    const letter = elem.textContent;
    if (letter && letter !== '_' && letter !== '') {
        hints[idx] = letter;
    }
});

const payload = {
    image_base64: imageBase64,
    word_length: wordLength,
    hints: hints
};

// Create a floating window for results
document.getElementById('skribble-predictor-window')?.remove(); // Remove if already exists
const resultWindow = document.createElement('div');
resultWindow.id = 'skribble-predictor-window';
resultWindow.style.position = 'fixed';
resultWindow.style.top = '10px';
resultWindow.style.right = '10px';
resultWindow.style.background = 'rgba(0,0,0,0.85)';
resultWindow.style.color = '#fff';
resultWindow.style.padding = '16px';
resultWindow.style.borderRadius = '8px';
resultWindow.style.zIndex = '99999';
resultWindow.style.fontFamily = 'monospace';
resultWindow.style.fontSize = '14px';
resultWindow.style.maxWidth = '350px';
resultWindow.style.maxHeight = '300px';
resultWindow.style.overflowY = 'auto';
resultWindow.innerText = 'Waiting for predictions...';
document.body.appendChild(resultWindow);

function sendRequest() {
    // Recompute these values every time
    const canvas = document.querySelector('canvas');
    const imageBase64 = canvas ? canvas.toDataURL('image/png').split(',')[1] : "";
    const hintElems = Array.from(document.querySelectorAll('.hints .hint'));
    const wordLength = hintElems.length;

    let hints = {};
    hintElems.forEach((elem, idx) => {
        const letter = elem.textContent;
        if (letter && letter !== '_' && letter !== '') {
            hints[idx] = letter;
        }
    });

    const payload = {
        image_base64: imageBase64,
        word_length: wordLength,
        hints: hints
    };

    // Log word count and hints to the console
    console.log(`[SkribbleAI] Sending to backend: word length = ${wordLength}, hints =`, hints);

    fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (typeof data === 'object' && data !== null) {
            let html = '<b>Prediction result:</b><br>';
            html += '<ul style="padding-left: 18px;">';
            for (const [key, value] of Object.entries(data)) {
                html += `<li style="cursor:pointer;color:#8cf;" class="skribble-predict-word" data-word="${key}">${key} (${(value * 100).toFixed(1)}%)</li>`;
            }
            html += '</ul>';
            resultWindow.innerHTML = html;

            // Add click event listeners to each word
            document.querySelectorAll('.skribble-predict-word').forEach(elem => {
                elem.addEventListener('click', function() {
                    const word = this.getAttribute('data-word');
                    const inputElem = document.querySelector('#game-chat input[data-translate="placeholder"]');
                    const formElem = document.querySelector('#game-chat form');
                    if (inputElem && formElem) {
                        inputElem.value = word;
                        inputElem.focus();
                        // Dispatch a submit event on the form
                        formElem.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    }
                });
            });
        } else {
            resultWindow.innerHTML = `<b>Prediction result:</b><br>${data}`;
        }
    })
    .catch(error => {
        resultWindow.innerHTML = `<b>Error:</b> ${error}`;
    });
}

// Send every 2 seconds
setInterval(sendRequest, 2000);
