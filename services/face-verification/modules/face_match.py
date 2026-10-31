import numpy as np
import cv2
from PIL import Image
import insightface
from insightface.app import FaceAnalysis
from .face_quality import decode_base64_image

# Global singleton for InsightFace app to avoid re-loading ONNX weights on each request
_face_app = None

def get_face_analyzer() -> FaceAnalysis:
    """
    Initializes and returns the InsightFace FaceAnalysis application using the buffalo_l model.
    Execution Provider: CPUExecutionProvider (ONNXRuntime).
    
    NOTE: On the first execution, InsightFace downloads the buffalo_l model archive (~300MB)
    and caches it locally at ~/.insightface/models/buffalo_l/.
    Internet access is required only for this initial download.
    """
    global _face_app
    if _face_app is None:
        _face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        _face_app.prepare(ctx_id=0, det_size=(640, 640))
    return _face_app

def pil_to_cv2_bgr(img: Image.Image) -> np.ndarray:
    """Converts a PIL RGB Image into a BGR OpenCV NumPy array."""
    rgb_arr = np.array(img.convert("RGB"))
    return cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)

def extract_insightface_embedding(cv2_bgr: np.ndarray) -> tuple[np.ndarray | None, str | None]:
    """
    Detects faces in the image and extracts the normalized 512-dimensional ArcFace embedding.
    Returns (embedding, error_message).
    """
    app = get_face_analyzer()
    faces = app.get(cv2_bgr)

    if not faces or len(faces) == 0:
        return None, "No face detected in the image."

    # If multiple faces detected, pick the most prominent face (largest bounding box area)
    primary_face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

    if not hasattr(primary_face, "normed_embedding") or primary_face.normed_embedding is None:
        return None, "Failed to compute normalized embedding for the detected face."

    embedding = np.array(primary_face.normed_embedding, dtype=np.float32)
    # Ensure L2 normalization
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm

    return embedding, None

def compare_faces(id_image_base64: str, live_image_base64: str) -> dict:
    """
    Compares the ID document portrait against the live camera capture using
    real InsightFace buffalo_l ArcFace 512-dimensional embeddings.
    
    Computes true cosine similarity and evaluates match decisions using
    established InsightFace / ArcFace biometric verification thresholds.
    """
    try:
        id_img = decode_base64_image(id_image_base64)
        live_img = decode_base64_image(live_image_base64)
    except Exception as e:
        return {
            "is_matched": False,
            "match_score": 0.0,
            "confidence": "LOW",
            "threshold": 0.65,
            "embedding_dimension": 512,
            "error": f"Failed to decode base64 face images: {str(e)}",
            "id_face_detected": False,
            "live_face_detected": False,
        }

    id_cv2 = pil_to_cv2_bgr(id_img)
    live_cv2 = pil_to_cv2_bgr(live_img)

    emb_id, err_id = extract_insightface_embedding(id_cv2)
    emb_live, err_live = extract_insightface_embedding(live_cv2)

    id_detected = emb_id is not None
    live_detected = emb_live is not None

    if not id_detected or not live_detected:
        errors = []
        if not id_detected:
            errors.append(f"ID document: {err_id}")
        if not live_detected:
            errors.append(f"Live capture: {err_live}")

        return {
            "is_matched": False,
            "match_score": 0.0,
            "confidence": "LOW",
            "threshold": 0.65,
            "embedding_dimension": 512,
            "error": "; ".join(errors),
            "id_face_detected": id_detected,
            "live_face_detected": live_detected,
        }

    # Cosine Similarity between L2-normalized 512-dim ArcFace vectors:
    # cos(u, v) = u · v
    cosine_sim = float(np.dot(emb_id, emb_live))
    # Bound into standard normalized score range [0.0, 1.0]
    match_score = round(float(np.clip(cosine_sim, 0.0, 1.0)), 4)

    # Standard ArcFace buffalo_l thresholding conventions:
    # - >= 0.65: High-confidence match (FAR < 1e-4)
    # - 0.58 to 0.65: Marginal match requiring manual compliance review
    # - < 0.58: Reject (different identity)
    MATCH_THRESHOLD = 0.65
    REVIEW_THRESHOLD = 0.58

    if match_score >= MATCH_THRESHOLD:
        confidence = "HIGH"
        is_matched = True
    elif match_score >= REVIEW_THRESHOLD:
        confidence = "MEDIUM"
        is_matched = True
    else:
        confidence = "LOW"
        is_matched = False

    return {
        "is_matched": is_matched,
        "match_score": match_score,
        "confidence": confidence,
        "threshold": MATCH_THRESHOLD,
        "embedding_dimension": 512,
        "id_face_detected": True,
        "live_face_detected": True,
    }
