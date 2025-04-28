import torch
import clip
import pandas as pd

class CLIPWordPredictor:
    def __init__(self):
        self.model, self.preprocess = clip.load("ViT-B/32", device="cuda")

        df = pd.read_csv("data/Skribbl-words.csv")

        self.labels = {}
        for _, row in df.iterrows():
            word = row["word"].strip().lower()
            if len(word) > 1:
                self.labels[word] = "Pixel drawing of " + word

    def predict_word(self, image, word_length, hints={}):
        labels_subset = {key: value for key, value in self.labels.items() if len(key.strip()) == word_length}

        for hint_index, hint_letter in hints.items():
            labels_subset = {key: value for key, value in labels_subset.items() if key[int(hint_index)] == hint_letter}

        image = self.preprocess(image).unsqueeze(0).cuda()
        text = clip.tokenize([label for label in labels_subset.values()]).cuda()
        
        with torch.no_grad():
            logits_per_image, logits_per_text = self.model(image, text)
            probs = sorted({key: value for key, value in zip(labels_subset.keys(), list(logits_per_image.softmax(dim=-1).cpu().numpy())[0])}.items(), key=lambda x: x[1], reverse=True)
        
        return dict(probs[:10])

