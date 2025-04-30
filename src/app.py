from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .clip_predictor import CLIPWordPredictor
from PIL import Image
import io
from pydantic import BaseModel
import base64
from functools import lru_cache


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = CLIPWordPredictor()


class PredictionRequest(BaseModel):
    image_base64: str  
    word_length: int
    hints: dict[int, str] = {}
    excluded_words: list[str] = []

@lru_cache(maxsize=128)
def cached_predict(image_base64: str, word_length: int, hints_tuple: tuple, excluded_words: list[str]):
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    hints = dict(hints_tuple)
    result = predictor.predict_word(image, word_length, hints, excluded_words)
    return tuple(sorted(((k, float(v)) for k, v in result.items()), key=lambda x: x[1], reverse=True))

@app.post("/predict")
async def predict(request: PredictionRequest):
    hints_tuple = tuple(sorted(request.hints.items()))
    result = cached_predict(request.image_base64, request.word_length, hints_tuple, tuple(request.excluded_words))
    return dict(result) 