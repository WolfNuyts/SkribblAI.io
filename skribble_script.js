// Get the canvas element and extract its image as a base64 string
const canvas = document.querySelector('canvas');
const imageBase64 = canvas ? canvas.toDataURL('image/png').split(',')[1] : "";
// Get all hint elements (each letter/underscore in the word)
const hintElems = Array.from(document.querySelectorAll('.hints .hint'));
// The length of the word to guess
const wordLength = hintElems.length;

let hints = {}; // Stores revealed letters by their position
let prevWordLength = null; // Track previous word length for debugging
let prevHintCount = null; // Track previous hint count for debugging
// Populate the hints object with revealed letters
hintElems.forEach((elem, idx) => {
    const letter = elem.textContent;
    if (letter && letter !== '_' && letter !== '') {
        hints[idx] = letter;
    }
});

// Create a floating window for results
// Remove the window if it already exists to avoid duplicates
document.getElementById('skribble-predictor-window')?.remove();
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
resultWindow.style.maxHeight = '450px';
resultWindow.style.overflowY = 'auto';

// --- Add a dedicated predictions container ---
const predictionsDiv = document.createElement('div');
predictionsDiv.id = 'skribble-predictions';
predictionsDiv.innerHTML = '<b>Waiting for predictions...</b>';
// --- End predictions container ---

// --- Add a title for the settings ---
const settingsTitle = document.createElement('div');
settingsTitle.innerText = 'Settings';
settingsTitle.style.fontWeight = 'bold';
settingsTitle.style.fontSize = '16px';
settingsTitle.style.marginTop = '16px';
settingsTitle.style.marginBottom = '6px';
settingsTitle.style.letterSpacing = '1px';
settingsTitle.style.textAlign = 'left';
// --- End settings title ---

// --- Add polling interval setting ---
let pollingIntervalSeconds = 2;
let pollingIntervalId = null;

const pollingIntervalRow = document.createElement('div');
pollingIntervalRow.style.display = 'flex';
pollingIntervalRow.style.alignItems = 'center';
pollingIntervalRow.style.marginBottom = '8px';

const pollingIntervalLabel = document.createElement('label');
pollingIntervalLabel.innerText = 'Polling interval:';
pollingIntervalLabel.style.fontSize = '13px';
pollingIntervalLabel.style.marginRight = '6px';
pollingIntervalLabel.style.color = '#8cf';

const pollingIntervalInput = document.createElement('input');
pollingIntervalInput.type = 'number';
pollingIntervalInput.min = '1';
pollingIntervalInput.max = '60';
pollingIntervalInput.value = pollingIntervalSeconds;
pollingIntervalInput.style.width = '48px';
pollingIntervalInput.style.margin = '0 4px';
pollingIntervalInput.style.background = '#222';
pollingIntervalInput.style.color = '#8cf';
pollingIntervalInput.style.border = '1px solid #8cf';
pollingIntervalInput.style.borderRadius = '3px';
pollingIntervalInput.style.fontSize = '13px';
pollingIntervalInput.style.textAlign = 'center';

const pollingIntervalUnit = document.createElement('span');
pollingIntervalUnit.innerText = 'sec';
pollingIntervalUnit.style.fontSize = '13px';
pollingIntervalUnit.style.marginLeft = '2px';

pollingIntervalRow.appendChild(pollingIntervalLabel);
pollingIntervalRow.appendChild(pollingIntervalInput);
pollingIntervalRow.appendChild(pollingIntervalUnit);

// Insert polling interval row after the settings title, before the auto-submit checkboxes
resultWindow.appendChild(settingsTitle);
resultWindow.appendChild(pollingIntervalRow);

// Add the auto-submit checkbox
const autoSubmitDiv = document.createElement('div');
autoSubmitDiv.style.marginTop = '10px';
autoSubmitDiv.style.display = 'flex';
autoSubmitDiv.style.alignItems = 'center';
autoSubmitDiv.style.flexDirection = 'column';
autoSubmitDiv.style.width = '100%';

// Container for the checkboxes
const autoSubmitCheckboxContainer = document.createElement('div');
autoSubmitCheckboxContainer.style.display = 'flex';
autoSubmitCheckboxContainer.style.alignItems = 'center';
autoSubmitCheckboxContainer.style.marginBottom = '6px';
autoSubmitCheckboxContainer.style.width = '100%';

const autoSubmitAllCheckboxContainer = document.createElement('div');
autoSubmitAllCheckboxContainer.style.display = 'flex';
autoSubmitAllCheckboxContainer.style.flexDirection = 'column';
autoSubmitAllCheckboxContainer.style.width = '100%';

// Custom checkbox for top prediction
const autoSubmitCheckbox = document.createElement('span');
autoSubmitCheckbox.id = 'skribble-auto-submit';
autoSubmitCheckbox.style.display = 'inline-block';
autoSubmitCheckbox.style.width = '18px';
autoSubmitCheckbox.style.height = '18px';
autoSubmitCheckbox.style.border = '2px solid #8cf';
autoSubmitCheckbox.style.borderRadius = '4px';
autoSubmitCheckbox.style.background = 'rgba(0,0,0,0.2)';
autoSubmitCheckbox.style.cursor = 'pointer';
autoSubmitCheckbox.style.position = 'relative';
autoSubmitCheckbox.style.userSelect = 'none';

let autoSubmitChecked = false;

function updateAutoSubmitCheckbox() {
    autoSubmitCheckbox.innerHTML = autoSubmitChecked ? '<span style="color:#8cf;position:absolute;left:2px;top:-2px;font-size:20px;line-height:16px;">×</span>' : '';
    autoSubmitCheckbox.style.background = autoSubmitChecked ? 'rgba(140,255,255,0.15)' : 'rgba(0,0,0,0.2)';
}

updateAutoSubmitCheckbox();

autoSubmitCheckbox.addEventListener('click', function() {
    autoSubmitChecked = !autoSubmitChecked;
    updateAutoSubmitCheckbox();
});

const autoSubmitLabel = document.createElement('label');
autoSubmitLabel.htmlFor = 'skribble-auto-submit';
autoSubmitLabel.style.marginLeft = '6px';
autoSubmitLabel.innerText = 'Auto-submit top prediction';

autoSubmitCheckboxContainer.appendChild(autoSubmitCheckbox);
autoSubmitCheckboxContainer.appendChild(autoSubmitLabel);

// Custom checkbox for all >50%
const autoSubmitAllCheckbox = document.createElement('span');
autoSubmitAllCheckbox.id = 'skribble-auto-submit-all';
autoSubmitAllCheckbox.style.display = 'inline-block';
autoSubmitAllCheckbox.style.width = '18px';
autoSubmitAllCheckbox.style.height = '18px';
autoSubmitAllCheckbox.style.border = '2px solid #8cf';
autoSubmitAllCheckbox.style.borderRadius = '4px';
autoSubmitAllCheckbox.style.background = 'rgba(0,0,0,0.2)';
autoSubmitAllCheckbox.style.cursor = 'pointer';
autoSubmitAllCheckbox.style.position = 'relative';
autoSubmitAllCheckbox.style.userSelect = 'none';

let autoSubmitAllChecked = false;
let autoSubmitAllThreshold = 30;

function updateAutoSubmitAllCheckbox() {
    autoSubmitAllCheckbox.innerHTML = autoSubmitAllChecked ? '<span style="color:#8cf;position:absolute;left:2px;top:-2px;font-size:20px;line-height:16px;">×</span>' : '';
    autoSubmitAllCheckbox.style.background = autoSubmitAllChecked ? 'rgba(140,255,255,0.15)' : 'rgba(0,0,0,0.2)';
}

updateAutoSubmitAllCheckbox();

autoSubmitAllCheckbox.addEventListener('click', function() {
    autoSubmitAllChecked = !autoSubmitAllChecked;
    updateAutoSubmitAllCheckbox();
});

// Create the threshold input
const autoSubmitAllLabel = document.createElement('label');
autoSubmitAllLabel.htmlFor = 'skribble-auto-submit-all';
autoSubmitAllLabel.style.marginLeft = '6px';
autoSubmitAllLabel.style.display = 'flex';
autoSubmitAllLabel.style.alignItems = 'center';
autoSubmitAllLabel.style.gap = '4px';
autoSubmitAllLabel.innerText = 'Auto-submit all >';

const autoSubmitAllInput = document.createElement('input');
autoSubmitAllInput.type = 'text';
autoSubmitAllInput.value = autoSubmitAllThreshold;
autoSubmitAllInput.style.width = '48px';
autoSubmitAllInput.style.margin = '0 4px';
autoSubmitAllInput.style.background = '#222';
autoSubmitAllInput.style.color = '#8cf';
autoSubmitAllInput.style.border = '1px solid #8cf';
autoSubmitAllInput.style.borderRadius = '3px';
autoSubmitAllInput.style.fontSize = '13px';
autoSubmitAllInput.style.textAlign = 'center';

// Warning message
const autoSubmitAllWarning = document.createElement('div');
autoSubmitAllWarning.style.color = 'red';
autoSubmitAllWarning.style.fontSize = '12px';
autoSubmitAllWarning.style.marginTop = '2px';
autoSubmitAllWarning.style.display = 'none';
autoSubmitAllWarning.innerText = 'Enter a number between 1 and 100';

autoSubmitAllInput.addEventListener('input', function() {
    const val = this.value.trim();
    const num = Number(val);
    if (!val || isNaN(num) || num < 1 || num > 100 || !Number.isInteger(num)) {
        autoSubmitAllWarning.style.display = 'block';
    } else {
        autoSubmitAllWarning.style.display = 'none';
        autoSubmitAllThreshold = num;
    }
});

const percentSpan = document.createElement('span');
percentSpan.innerText = '%';

// --- New: Row for checkbox and label ---
const autoSubmitAllRow = document.createElement('div');
autoSubmitAllRow.style.display = 'flex';
autoSubmitAllRow.style.alignItems = 'center';
autoSubmitAllRow.style.width = '100%';
// --- End new row ---

autoSubmitAllLabel.appendChild(autoSubmitAllInput);
autoSubmitAllLabel.appendChild(percentSpan);

autoSubmitAllRow.appendChild(autoSubmitAllCheckbox);
autoSubmitAllRow.appendChild(autoSubmitAllLabel);

autoSubmitAllCheckboxContainer.appendChild(autoSubmitAllRow);
autoSubmitAllCheckboxContainer.appendChild(autoSubmitAllWarning);

// Add both containers to the main div
autoSubmitDiv.appendChild(autoSubmitCheckboxContainer);
autoSubmitDiv.appendChild(autoSubmitAllCheckboxContainer);

// --- Add a title for the predictions ---
const predictionsTitle = document.createElement('div');
predictionsTitle.innerText = 'Predictions';
predictionsTitle.style.fontWeight = 'bold';
predictionsTitle.style.fontSize = '16px';
predictionsTitle.style.marginTop = '24px'; // More whitespace before predictions
predictionsTitle.style.marginBottom = '6px';
predictionsTitle.style.letterSpacing = '1px';
predictionsTitle.style.textAlign = 'left';
// --- End predictions title ---

// --- Append settings first, then predictions ---
resultWindow.appendChild(settingsTitle);
resultWindow.appendChild(pollingIntervalRow);
resultWindow.appendChild(autoSubmitDiv);
resultWindow.appendChild(predictionsTitle); // Insert predictions title here
resultWindow.appendChild(predictionsDiv);
document.body.appendChild(resultWindow);

function sendRequest() {
    // Recompute these values every time in case the game state changes
    const canvas = document.querySelector('canvas');
    const imageBase64 = canvas ? canvas.toDataURL('image/png').split(',')[1] : "";
    const hintElems = Array.from(document.querySelectorAll('.hints .hint'));
    const wordLength = hintElems.length;
    // Count how many hints (revealed letters) are present
    const hintCount = hintElems.filter(elem => {
        const letter = elem.textContent;
        return letter && letter !== '_' && letter !== '';
    }).length;

    // Track word length and hint changes for debugging
    if (prevWordLength !== null && (
        wordLength !== prevWordLength ||
        hintCount < prevHintCount
    )) {
        console.log('[SkribbleAI] New round detected - word length or hints changed');
    }
    prevWordLength = wordLength;
    prevHintCount = hintCount;

    let hints = {};
    // Update hints with current revealed letters
    hintElems.forEach((elem, idx) => {
        const letter = elem.textContent;
        if (letter && letter !== '_' && letter !== '') {
            hints[idx] = letter;
        }
    });

    // Function to extract chat guesses from current round
    function getChatGuesses() {
        const chatContent = document.querySelector('.chat-content');
        if (!chatContent) {
            console.log('[SkribbleAI] Chat content not found');
            return [];
        }

        const chatMessages = chatContent.querySelectorAll('p');
        let lastWordWasIndex = -1;
        
        // Find the last "The word was" message to identify start of current round
        chatMessages.forEach((msg, index) => {
            const text = msg.textContent || '';
            if (text.includes('The word was')) {
                lastWordWasIndex = index;
            }
        });

        const guesses = [];
        
        // Process messages after the last "The word was" message
        for (let i = lastWordWasIndex + 1; i < chatMessages.length; i++) {
            const messageText = chatMessages[i].textContent || '';
            
            // Check if this is a guess (contains ':' indicating 'username: guess' format)
            if (messageText.includes(':')) {
                const colonIndex = messageText.indexOf(':');
                if (colonIndex > 0 && colonIndex < messageText.length - 1) {
                    // Extract the guess part (everything after the colon and space)
                    const guessText = messageText.substring(colonIndex + 1).trim();
                    if (guessText.length > 0) {
                        // Clean the guess and treat it as a single unit
                        const cleanedGuess = guessText
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, ' ') // Replace punctuation with spaces, keep hyphens
                            .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
                            .trim();
                        
                        if (cleanedGuess.length > 1 && cleanedGuess.length <= 50) {
                            guesses.push(cleanedGuess);
                        }
                    }
                }
            }
        }

        return [...new Set(guesses)]; // Remove duplicates
    }

    // Get chat guesses from current round
    const chatGuesses = getChatGuesses();

    // Prepare the payload for the backend
    const payload = {
        image_base64: imageBase64,
        word_length: wordLength,
        hints: hints,
        excluded_words: chatGuesses  // Only use chat-based guesses
    };

    // Log the current state for debugging
    console.log(`[SkribbleAI] Sending to backend: word length = ${wordLength}, hints =`, hints, ', chatGuesses =', chatGuesses);

    // Send the request to the backend for predictions
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
            // Build the result HTML with clickable predictions
            let html = '<ul style="padding-left: 18px;">';
            for (const [key, value] of Object.entries(data)) {
                html += `<li style="cursor:pointer;color:#8cf;" class="skribble-predict-word" data-word="${key}">${key} (${(value * 100).toFixed(1)}%)</li>`;
            }
            html += '</ul>';
            // --- Only update the predictionsDiv ---
            predictionsDiv.innerHTML = html;

            // Add click event listeners to each prediction word
            predictionsDiv.querySelectorAll('.skribble-predict-word').forEach(elem => {
                elem.addEventListener('click', function() {
                    const word = this.getAttribute('data-word');
                    // Autofill the chat input and submit the guess
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

            // Auto-submit logic for all >50%
            if (autoSubmitAllChecked) {
                for (const [word, value] of Object.entries(data)) {
                    if (
                        typeof autoSubmitAllThreshold === 'number' &&
                        autoSubmitAllThreshold >= 1 &&
                        autoSubmitAllThreshold <= 100 &&
                        Number.isInteger(autoSubmitAllThreshold) &&
                        value * 100 > autoSubmitAllThreshold
                    ) {
                        const inputElem = document.querySelector('#game-chat input[data-translate="placeholder"]');
                        const formElem = document.querySelector('#game-chat form');
                        if (inputElem && formElem) {
                            inputElem.value = word;
                            inputElem.focus();
                            formElem.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                        }
                    }
                }
            } else if (autoSubmitChecked) {
                // Find the top prediction (first entry)
                const topEntry = Object.entries(data)[0];
                if (topEntry) {
                    const [word] = topEntry;
                    const inputElem = document.querySelector('#game-chat input[data-translate="placeholder"]');
                    const formElem = document.querySelector('#game-chat form');
                    if (inputElem && formElem) {
                        inputElem.value = word;
                        inputElem.focus();
                        formElem.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    }
                }
            }
        } else {
            // If backend returns a string or error
            predictionsDiv.innerHTML = `${data}`;
        }
        updateAutoSubmitCheckbox();
        updateAutoSubmitAllCheckbox();
    })
    .catch(error => {
        // Show error in the floating window
        predictionsDiv.innerHTML = `<b>Error:</b> ${error}`;
    });
}

// --- Replace setInterval with dynamic interval logic ---
function startPollingInterval() {
    if (pollingIntervalId !== null) {
        clearInterval(pollingIntervalId);
    }
    pollingIntervalId = setInterval(sendRequest, pollingIntervalSeconds * 1000);
}

pollingIntervalInput.addEventListener('input', function() {
    let val = Number(this.value);
    if (isNaN(val) || val < 1 || val > 60) {
        this.style.borderColor = 'red';
        return;
    } else {
        this.style.borderColor = '#8cf';
    }
    pollingIntervalSeconds = val;
    startPollingInterval();
});

startPollingInterval();
