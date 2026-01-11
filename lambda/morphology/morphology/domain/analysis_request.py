from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    phrase: str
