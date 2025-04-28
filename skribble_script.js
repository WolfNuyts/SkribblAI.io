    const imageBase64 = "";
    const wordLength = 3;
    const hints = {"1": "m"};

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
                    html += `<li>${key} (${(value * 100).toFixed(1)}%)</li>`;
                }
                html += '</ul>';
                resultWindow.innerHTML = html;
            } else {
                resultWindow.innerHTML = `<b>Prediction result:</b><br>${data}`;
            }
        })
        .catch(error => {
            resultWindow.innerHTML = `<b>Error:</b> ${error}`;
        });
    }

    // Send every 2 second
    setInterval(sendRequest, 2000);
