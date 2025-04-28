# SkribbleAI.io

A tool to predict Skribbl.io words from drawings using OpenAI's CLIP.

## Setup

1. **Clone the repository** and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. **Download the word list**
   - The file `data/Skribbl-words.csv` should already be included. If not, add your own word list in the same format.

3. **Start the backend server**
   ```bash
   python main.py
   ```
   This will start a FastAPI server on `http://localhost:8000`.

## Usage

1. **Open Skribbl.io in your browser.**
2. **Copy the contents of `skribble_script.js`.**
3. **Paste it into your browser's developer console** (press F12 or right-click → Inspect → Console tab).
4. The script will create a floating window in the top-right corner and poll predictions from your local server every 2 seconds.

### Customizing the Script
- The script expects the backend to be running locally on port 8000.

## Notes
- Requires a CUDA-capable GPU for best performance (CLIP runs on CUDA by default).
- Make sure the backend server is running before using the browser script.
- For development or debugging, you can modify the polling interval or UI in `skribble_script.js`.
