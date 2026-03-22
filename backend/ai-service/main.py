from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(
    title="NeuroTrack AI Engine",
    description="Intelligent Classification & Behavioral Modeling API",
    version="1.0.0"
)

# Mocked memory for TF-IDF
productive_corpus = [
    "github repository pull request coding software",
    "stackoverflow programming error bug fix",
    "notion workspace documentation kanban",
    "linear agile sprint planning tasks",
    "figma design wireframe ui ux",
    "aws cloud infrastructure deployment",
    "google docs write plan strategy"
]
unproductive_corpus = [
    "netflix movies watch series",
    "youtube entertainment shorts viral",
    "twitter feed scrolling timeline drama",
    "reddit forum discussion memes",
    "instagram stories reels social",
    "facebook feed news",
    "tiktok short videos swipe"
]

vectorizer = TfidfVectorizer().fit(productive_corpus + unproductive_corpus)
prod_vectors = vectorizer.transform(productive_corpus)
unprod_vectors = vectorizer.transform(unproductive_corpus)

class URLData(BaseModel):
    url: str
    title: str
    content: str = ""

@app.get("/")
def read_root():
    return {"status": "OK", "service": "AI/ML Classification Service"}

@app.post("/api/ai/classify")
def classify_url(data: URLData):
    text_to_analyze = f"{data.url} {data.title} {data.content}".lower()
    
    # Simple rule-based initial check
    if any(site in text_to_analyze for site in ['github', 'stackoverflow', 'notion', 'figma', 'linear', 'aws', 'jira']):
        return {"url": data.url, "classification": "productive", "confidence": 0.95}
    if any(site in text_to_analyze for site in ['netflix', 'youtube', 'twitter', 'reddit', 'instagram', 'tiktok', 'facebook']):
        return {"url": data.url, "classification": "unproductive", "confidence": 0.90}
    
    # TF-IDF Cosine Similarity Fallback
    input_vec = vectorizer.transform([text_to_analyze])
    prod_sim = np.max(cosine_similarity(input_vec, prod_vectors))
    unprod_sim = np.max(cosine_similarity(input_vec, unprod_vectors))
    
    classification = "productive" if prod_sim > unprod_sim else ("unproductive" if unprod_sim > 0.1 else "neutral")
    confidence = float(max(prod_sim, unprod_sim))
    
    return {
        "url": data.url,
        "classification": classification,
        "confidence": round(confidence, 2) if confidence > 0 else 0.5
    }

class SessionData(BaseModel):
    tab_switches_per_min: float
    idle_time_percentage: float
    session_length_mins: float

@app.post("/api/ai/cognitive-load")
def estimate_cognitive_load(data: SessionData):
    """
    Predicts cognitive load & burnout risk based on behavior
    """
    # High tab switching and long sessions usually equal high cognitive load
    load_score = (data.tab_switches_per_min * 0.4) + (data.session_length_mins * 0.05) - (data.idle_time_percentage * 0.2)
    
    # Normalize
    load_score = min(max(load_score, 0), 10)
    
    distraction_prob = min((data.tab_switches_per_min * 0.1) + (data.idle_time_percentage * 0.5), 1.0)
    
    return {
        "cognitive_load_score": round(load_score, 2),
        "burnout_risk": "High" if load_score > 7 else "Medium" if load_score > 4 else "Low",
        "next_distraction_prob": round(distraction_prob, 2),
        "recommendation": "Take a 5-minute break immediately." if load_score > 7 else "Keep focusing, you are in the zone."
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
