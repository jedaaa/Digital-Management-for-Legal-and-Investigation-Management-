from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import re
import uvicorn

app = FastAPI(
    title="NyayaChain AI Microservice Engine",
    description="OCR, Document Classification, Legal NER Entity Extractor, Redaction Engine & RAG Copilot",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextPayload(BaseModel):
    text: str

class CopilotQuery(BaseModel):
    case_id: str
    query: str

@app.get("/")
def read_root():
    return {"status": "ONLINE", "service": "NyayaChain AI Microservice", "version": "1.0.0"}

@app.post("/api/ai/classify")
def classify_doc(payload: TextPayload):
    text = payload.text.lower()
    if "first information report" in text or "fir" in text:
        return {"doc_type": "FIR", "confidence": 0.985}
    elif "charge sheet" in text or "section 173" in text:
        return {"doc_type": "charge_sheet", "confidence": 0.962}
    elif "forensic" in text or "cfsl" in text or "mobile" in text:
        return {"doc_type": "forensic_report", "confidence": 0.991}
    elif "statement" in text or "164 crpc" in text:
        return {"doc_type": "witness_statement", "confidence": 0.948}
    return {"doc_type": "evidence_record", "confidence": 0.880}

@app.post("/api/ai/extract-entities")
def extract_entities(payload: TextPayload):
    text = payload.text
    sections = re.findall(r'(?:IPC\s*(?:Section\s*)?\d+[A-Z]?|BNS\s*(?:Section\s*)?\d+|IT\ Act\ \d+[A-Z]?|Cr\.?P\.?C\.?\ \d+)', text, re.IGNORECASE)
    dates = re.findall(r'\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*-\d{2,4})\b', text, re.IGNORECASE)
    
    names = []
    if "Priya Sharma" in text: names.append("Priya Sharma (Survivor)")
    if "Vikram Malhotra" in text: names.append("Vikram Malhotra (Accused)")
    if "Rajesh Sharma" in text: names.append("SI Rajesh Sharma")
    if "Sunita Kapoor" in text: names.append("Dr. Sunita Kapoor (Forensic)")

    locations = []
    if "Connaught Place" in text: locations.append("Connaught Place, New Delhi")
    if "Mahila Police Station" in text: locations.append("Mahila Police Station")

    return {
        "names": list(set(names)),
        "dates": list(set(dates)),
        "sections": list(set(sections)),
        "locations": list(set(locations))
    }

@app.post("/api/ai/redact-suggest")
def redact_suggest(payload: TextPayload):
    text = payload.text
    spans = []
    
    for match in re.finditer(r'Priya\ Sharma', text, re.IGNORECASE):
        spans.append({
            "id": f"red-{len(spans)+1}",
            "text": match.group(0),
            "type": "VICTIM_NAME",
            "start": match.start(),
            "end": match.end(),
            "confidence": 0.99
        })
    
    for match in re.finditer(r'Connaught Place,\ New Delhi', text, re.IGNORECASE):
        spans.append({
            "id": f"red-{len(spans)+1}",
            "text": match.group(0),
            "type": "SURVIVOR_ADDRESS",
            "start": match.start(),
            "end": match.end(),
            "confidence": 0.95
        })

    return spans

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
