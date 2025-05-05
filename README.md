# SkribbleAI.io

A tool to predict Skribbl.io words from drawings using OpenAI's CLIP.

## Setup

1. **Clone the repository** and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the backend server**
   ```bash
   python main.py
   ```
   This will start a FastAPI server on `http://localhost:8000`.

## Usage

1. **Open Skribbl.io in your browser.**
2. **Copy the contents of `skribble_script.js`.**
3. **Paste it into your browser's developer console** (press F12 or right-click → Inspect → Console tab).
4. The script will create a floating window in the top-right corner and poll predictions from your local server every 2 seconds.


## Notes
- Requires a CUDA-capable GPU for best performance (CLIP runs on CUDA by default).
- Make sure the backend server is running before using the browser script. The script expects the backend to be running locally on port 8000.
- If you enable auto-submit on a very small interval, Skribble.io will kick you.
- You can add your own words to data/wordlist.txt if you want to be able to guess them.
