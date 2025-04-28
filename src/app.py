from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .clip_predictor import CLIPWordPredictor
from PIL import Image
import io
from pydantic import BaseModel
import base64

app = FastAPI()

# Add CORS middleware immediately after app creation
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to ["https://skribbl.io"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = CLIPWordPredictor()


class PredictionRequest(BaseModel):
    image_base64: str  
    word_length: int
    hints: dict[int, str] = {}


@app.post("/predict")
async def predict(
    request: PredictionRequest
):  
    image_bytes = base64.b64decode(request.image_base64)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    result = predictor.predict_word(image, request.word_length, request.hints)
    # Convert all numpy floats to Python floats
    result = {k: float(v) for k, v in result.items()}
    return result 