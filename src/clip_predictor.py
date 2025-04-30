import torch
import clip


class CLIPWordPredictor:
    def __init__(self):
        self.model, self.preprocess = clip.load("ViT-B/32", device="cuda")

        with open("data/wordlist.txt", "r") as f:
            words = [line.strip().lower() for line in f.readlines()]

        self.labels = {}
        for word in words:
            if len(word) > 1:
                self.labels[word] = "Pixel drawing of " + word

    def predict_word(self, image, word_length, hints={}, excluded_words=[]):

        excluded_words = set([word.strip().lower() for word in excluded_words])
        
        def is_valid_word(word, hints, excluded_words):
            if len(word) != word_length:
                return False

            if word in excluded_words:
                return False

            for idx, char in enumerate(word):
                # If a space is present, it must be hinted
                if char == ' ':
                    if idx not in hints or hints[idx] != ' ':
                        return False
                
                # If a hint is present for this index, it must match
                if idx in hints and hints[idx] != char:
                    return False
            
            return True
        
        labels_subset = {key: value for key, value in self.labels.items() if is_valid_word(key, hints, excluded_words)}

        image = self.preprocess(image).unsqueeze(0).cuda()
        text = clip.tokenize([label for label in labels_subset.values()]).cuda()
        
        with torch.no_grad():
            logits_per_image, _ = self.model(image, text)
            probs = sorted({key: value for key, value in zip(labels_subset.keys(), list(logits_per_image.softmax(dim=-1).cpu().numpy())[0])}.items(), key=lambda x: x[1], reverse=True)
        
        return dict(probs[:10])

