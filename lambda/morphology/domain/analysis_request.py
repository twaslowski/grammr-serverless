class AnalysisRequest:
    text: str

    def __init__(self, text):
        if not text or not isinstance(text, str) or text.strip() == "":
            raise ValueError("Text must be a non-empty string.")
        self.text = text.strip()
