import uuid
import time
from fastapi import FastAPI, Header, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, Any

from config import INTERNAL_SECRET, active_sessions, verification_results, PORT, HOST
from modules.face_quality import assess_face_quality
from modules.liveness import create_liveness_challenge, verify_liveness
from modules.face_match import compare_faces
from modules.ocr_engine import extract_document_ocr, extract_business_trade_license_ocr

app = FastAPI(
    title="Central Account AI Verification Microservice",
    description="Face quality, active/passive liveness, face matching, and document OCR service.",
    version="2.0.0",
)

def verify_internal_auth(x_internal_secret: Optional[str] = Header(None)):
    """Validates that incoming requests carry the shared internal secret header."""
    if not x_internal_secret or x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing internal service secret."
        )

# Request Models
class SessionRequest(BaseModel):
    userId: str
    tenantId: Optional[str] = None

class QualityRequest(BaseModel):
    imageBase64: str

class LivenessRequest(BaseModel):
    sessionId: str
    challengeType: str
    frameBase64: str
    clientResponse: Optional[dict] = None

class MatchRequest(BaseModel):
    idImageBase64: str
    liveImageBase64: str

class DocumentOcrRequest(BaseModel):
    imageBase64: str
    documentType: str = "PASSPORT"
    countryCode: str = "BD"

class BusinessOcrRequest(BaseModel):
    imageBase64: str
    countryCode: str = "BD"

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "face-verification",
        "version": "2.0.0",
        "timestamp": time.time(),
    }

@app.post("/face/session", dependencies=[Depends(verify_internal_auth)])
def create_session(req: SessionRequest):
    challenge = create_liveness_challenge()
    session_id = str(uuid.uuid4())
    session_data = {
        "session_id": session_id,
        "user_id": req.userId,
        "challenge": challenge,
        "created_at": time.time(),
        "status": "INITIALIZED",
    }
    active_sessions[session_id] = session_data
    return {
        "sessionId": session_id,
        "challengeType": challenge["challenge_type"],
        "instructions": challenge["instructions"],
        "expiresInSeconds": challenge["expires_in_seconds"],
    }

@app.post("/face/quality", dependencies=[Depends(verify_internal_auth)])
def check_quality(req: QualityRequest):
    return assess_face_quality(req.imageBase64)

@app.post("/face/liveness", dependencies=[Depends(verify_internal_auth)])
def check_liveness(req: LivenessRequest):
    result = verify_liveness(
        challenge_type=req.challengeType,
        frame_base64=req.frameBase64,
        client_response=req.clientResponse,
    )
    if req.sessionId in active_sessions:
        active_sessions[req.sessionId]["liveness_result"] = result
        active_sessions[req.sessionId]["status"] = "LIVENESS_CHECKED"
    verification_results[req.sessionId] = result
    return result

@app.post("/face/match", dependencies=[Depends(verify_internal_auth)])
def match_faces(req: MatchRequest):
    return compare_faces(req.idImageBase64, req.liveImageBase64)

@app.post("/document/ocr", dependencies=[Depends(verify_internal_auth)])
def document_ocr(req: DocumentOcrRequest):
    return extract_document_ocr(
        image_base64=req.imageBase64,
        document_type=req.documentType,
        country_code=req.countryCode,
    )

@app.post("/business/ocr", dependencies=[Depends(verify_internal_auth)])
def business_ocr(req: BusinessOcrRequest):
    return extract_business_trade_license_ocr(
        image_base64=req.imageBase64,
        country_code=req.countryCode,
    )

@app.get("/face/result/{session_id}", dependencies=[Depends(verify_internal_auth)])
def get_result(session_id: str):
    if session_id in verification_results:
        return verification_results[session_id]
    if session_id in active_sessions:
        return active_sessions[session_id]
    raise HTTPException(status_code=404, detail="Verification session result not found.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
