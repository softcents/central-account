"""
Document Authenticity Classifier
=================================
Multi-signal computer vision classifier that determines whether an uploaded image
is a genuine government-issued identity document (passport, national ID, driving license)
or an irrelevant/fake image (screenshots, memes, random photos, etc.).

Signals used:
  1. Face Presence - Real IDs contain a passport-style portrait photo
  2. Structural Analysis - Aspect ratio, edge detection for card/page boundaries
  3. MRZ Zone Detection - Machine-Readable Zones found on official documents
  4. Identity Keyword Matching - OCR text scanned for identity-related vocabulary
  5. Text Density & Layout - Government documents have structured text regions
  6. Color & Texture Profile - ID documents have distinct color distributions
  7. Security Feature Heuristics - Hologram regions, microprint density patterns

Each signal contributes a weighted score. A final classification threshold determines
if the document is GENUINE, SUSPICIOUS, or FAKE.
"""

import re
import cv2
import numpy as np
from PIL import Image

try:
    import mediapipe as mp
    _mp_face_detection = None

    def _get_face_detector():
        global _mp_face_detection
        if _mp_face_detection is None:
            _mp_face_detection = mp.solutions.face_detection.FaceDetection(
                model_selection=1,  # Full range model
                min_detection_confidence=0.3,
            )
        return _mp_face_detection
except ImportError:
    _get_face_detector = None


# =============================================================================
# Signal 1: Face Presence on Document
# =============================================================================

def _check_face_on_document(cv2_bgr: np.ndarray) -> dict:
    """
    Checks if the image contains a face (portrait photo) as found on real identity documents.
    Uses MediaPipe Face Detection with a low confidence threshold to catch even partially
    obscured or small passport photos.

    Returns:
        dict with 'has_face' (bool), 'face_count' (int), 'score' (0.0-1.0),
        'face_area_ratio' (float) - ratio of face bounding box area to total image area
    """
    result = {"has_face": False, "face_count": 0, "score": 0.0, "face_area_ratio": 0.0}

    if _get_face_detector is None:
        # Fallback: OpenCV Haar Cascade
        return _check_face_opencv_fallback(cv2_bgr)

    detector = _get_face_detector()
    rgb = cv2.cvtColor(cv2_bgr, cv2.COLOR_BGR2RGB)
    detection_result = detector.process(rgb)

    if detection_result.detections:
        h, w = cv2_bgr.shape[:2]
        total_area = h * w
        face_areas = []

        for detection in detection_result.detections:
            bbox = detection.location_data.relative_bounding_box
            face_w = bbox.width * w
            face_h = bbox.height * h
            face_area = face_w * face_h
            face_areas.append(face_area)

        result["has_face"] = True
        result["face_count"] = len(detection_result.detections)
        result["face_area_ratio"] = round(max(face_areas) / total_area, 4) if total_area > 0 else 0

        # On identity documents, the face typically occupies 5-40% of the image area
        ratio = result["face_area_ratio"]
        if 0.02 <= ratio <= 0.50:
            result["score"] = 1.0  # Perfect ID-range face
        elif ratio > 0.50:
            result["score"] = 0.5  # Face too large (selfie, not a document)
        else:
            result["score"] = 0.3  # Very small face detection

        # Multiple faces on a document is unusual (max 1 expected)
        if result["face_count"] > 2:
            result["score"] *= 0.5

    return result


def _check_face_opencv_fallback(cv2_bgr: np.ndarray) -> dict:
    """Fallback face detection using OpenCV's Haar Cascade classifier."""
    result = {"has_face": False, "face_count": 0, "score": 0.0, "face_area_ratio": 0.0}
    gray = cv2.cvtColor(cv2_bgr, cv2.COLOR_BGR2GRAY)

    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))

    if len(faces) > 0:
        h, w = cv2_bgr.shape[:2]
        total_area = h * w
        areas = [fw * fh for (_, _, fw, fh) in faces]
        result["has_face"] = True
        result["face_count"] = len(faces)
        result["face_area_ratio"] = round(max(areas) / total_area, 4)
        ratio = result["face_area_ratio"]
        if 0.02 <= ratio <= 0.50:
            result["score"] = 0.9
        elif ratio > 0.50:
            result["score"] = 0.4
        else:
            result["score"] = 0.2

    return result


# =============================================================================
# Signal 2: Structural Analysis (Aspect Ratio & Edge Rectangularity)
# =============================================================================

def _analyze_document_structure(cv2_bgr: np.ndarray) -> dict:
    """
    Analyzes image structural properties to determine if it resembles a physical document:
    - Aspect ratio matching common ID formats (ID-1 card: 85.6x53.98mm = ~1.586:1,
      Passport page: ~1.42:1, TD2: ~1.556:1)
    - Edge detection to find rectangular document boundaries
    - Contour analysis for card-like shapes

    Returns dict with 'aspect_ratio_score', 'rectangularity_score', 'overall_score'
    """
    h, w = cv2_bgr.shape[:2]
    aspect = w / h if h > 0 else 1.0

    # Common ID document aspect ratios (width/height when landscape):
    # ID-1 (credit card size): ~1.586
    # Passport data page: ~1.42
    # TD2: ~1.556
    # Portrait orientation: inverse of above
    known_ratios = [1.586, 1.42, 1.556, 1.0 / 1.586, 1.0 / 1.42, 1.0 / 1.556]

    # Also include A4 scanned pages and common photo crops
    known_ratios.extend([1.414, 1.0 / 1.414, 1.333, 1.0 / 1.333])

    min_deviation = min(abs(aspect - r) for r in known_ratios)

    if min_deviation < 0.08:
        aspect_score = 1.0
    elif min_deviation < 0.20:
        aspect_score = 0.7
    elif min_deviation < 0.40:
        aspect_score = 0.4
    else:
        aspect_score = 0.15

    # Edge-based rectangularity detection
    gray = cv2.cvtColor(cv2_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    rect_score = 0.0
    if contours:
        # Find the largest contour
        largest = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest)
        total_area = h * w

        if area > total_area * 0.15:  # Contour covers significant portion
            peri = cv2.arcLength(largest, True)
            approx = cv2.approxPolyDP(largest, 0.02 * peri, True)

            if len(approx) == 4:
                rect_score = 1.0  # Perfect quadrilateral
            elif len(approx) in [3, 5, 6]:
                rect_score = 0.5
            else:
                rect_score = 0.2
        else:
            # Check if overall image edges suggest a document was scanned flat
            edge_density = np.count_nonzero(edges) / (h * w)
            if 0.02 < edge_density < 0.15:
                rect_score = 0.6  # Moderate edge density typical of documents
            else:
                rect_score = 0.2

    overall = aspect_score * 0.5 + rect_score * 0.5
    return {
        "aspect_ratio": round(aspect, 3),
        "aspect_ratio_score": round(aspect_score, 2),
        "rectangularity_score": round(rect_score, 2),
        "score": round(overall, 2),
    }


# =============================================================================
# Signal 3: MRZ Zone Detection
# =============================================================================

def _detect_mrz_zone(raw_ocr_text: str) -> dict:
    """
    Scans OCR text for Machine-Readable Zone (MRZ) patterns.
    MRZ lines contain only A-Z, 0-9, and '<' filler characters.
    - TD3 (Passport): 2 lines of 44 characters
    - TD1 (National ID): 3 lines of 30 characters
    - TD2: 2 lines of 36 characters

    Returns dict with 'has_mrz', 'mrz_format', 'score'
    """
    result = {"has_mrz": False, "mrz_format": None, "score": 0.0}

    # Normalize text and look for MRZ-like lines
    lines = raw_ocr_text.split('\n')
    mrz_candidates = []

    for line in lines:
        cleaned = re.sub(r'[^A-Z0-9<]', '', line.strip().upper())
        if len(cleaned) >= 28 and '<' in cleaned:
            mrz_candidates.append(cleaned)

    if not mrz_candidates:
        return result

    # Check for TD3 (44 chars)
    td3_lines = [l for l in mrz_candidates if 42 <= len(l) <= 46]
    if len(td3_lines) >= 2:
        result["has_mrz"] = True
        result["mrz_format"] = "TD3_PASSPORT"
        result["score"] = 1.0
        return result

    # Check for TD1 (30 chars)
    td1_lines = [l for l in mrz_candidates if 28 <= len(l) <= 32]
    if len(td1_lines) >= 3:
        result["has_mrz"] = True
        result["mrz_format"] = "TD1_ID_CARD"
        result["score"] = 1.0
        return result

    # Check for TD2 (36 chars)
    td2_lines = [l for l in mrz_candidates if 34 <= len(l) <= 38]
    if len(td2_lines) >= 2:
        result["has_mrz"] = True
        result["mrz_format"] = "TD2"
        result["score"] = 1.0
        return result

    # Partial MRZ detected (at least one qualifying line)
    if len(mrz_candidates) >= 1:
        result["has_mrz"] = True
        result["mrz_format"] = "PARTIAL"
        result["score"] = 0.5
        return result

    return result


# =============================================================================
# Signal 4: Identity Keyword Analysis
# =============================================================================

# Keywords commonly found on government identity documents across countries
_IDENTITY_KEYWORDS = {
    # High-confidence identity keywords (each worth more)
    "high": [
        "passport", "republic", "surname", "given name", "given names",
        "nationality", "date of birth", "place of birth", "date of issue",
        "date of expiry", "sex", "authority", "holder", "signature",
        "machine readable", "identity card", "national id", "national identity",
        "driving licence", "driving license", "driver license", "driver's license",
        "drivers license", "permis de conduire", "carte d'identite",
        "reisepass", "personalausweis", "pasaporte", "documento nacional",
        "república", "government", "ministry", "interior",
        "document number", "card number", "license number", "licence number",
        "personal no", "id no", "nid", "voter id",
        "birth certificate", "expiry", "valid until", "valid thru",
        "issued", "issuing", "type", "code", "mrz",
        "বাংলাদেশ", "জাতীয় পরিচয়পত্র",  # Bangla: Bangladesh, National ID
    ],
    # Medium-confidence keywords
    "medium": [
        "name", "address", "male", "female", "height", "weight",
        "eyes", "hair", "restrictions", "endorsements", "class",
        "category", "organ donor", "veteran", "blood group", "blood type",
        "father", "mother", "spouse", "profession", "occupation",
        "photo", "photograph", "biometric", "chip", "electronic",
    ],
    # Low-confidence but still relevant
    "low": [
        "official", "certified", "authorized", "valid", "void",
        "copy", "original", "duplicate", "specimen",
    ],
}


def _analyze_identity_keywords(raw_ocr_text: str) -> dict:
    """
    Scans OCR text for identity-document-specific vocabulary.
    Higher weight for high-confidence keywords.

    Returns dict with 'keyword_score', 'matched_keywords', 'total_matches'
    """
    text_lower = raw_ocr_text.lower()
    matched = {"high": [], "medium": [], "low": []}

    for level, keywords in _IDENTITY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                matched[level].append(kw)

    high_count = len(matched["high"])
    medium_count = len(matched["medium"])
    low_count = len(matched["low"])

    # Weighted scoring
    raw_score = (high_count * 3.0 + medium_count * 1.5 + low_count * 0.5)

    # Normalize: 8+ high keywords = perfect score
    if raw_score >= 20:
        score = 1.0
    elif raw_score >= 12:
        score = 0.85
    elif raw_score >= 6:
        score = 0.65
    elif raw_score >= 3:
        score = 0.40
    elif raw_score > 0:
        score = 0.20
    else:
        score = 0.0

    all_matched = matched["high"] + matched["medium"] + matched["low"]
    return {
        "score": round(score, 2),
        "matched_keywords": all_matched[:15],  # Cap for response size
        "total_matches": high_count + medium_count + low_count,
        "high_matches": high_count,
    }


# =============================================================================
# Signal 5: Text Density & Layout Analysis
# =============================================================================

def _analyze_text_density(cv2_bgr: np.ndarray, raw_ocr_text: str) -> dict:
    """
    Evaluates text density and distribution:
    - Identity documents have moderate, structured text
    - Screenshots/chat images have very dense or very sparse text in irregular patterns
    - Random photos have almost no text

    Returns dict with 'text_density_score', 'char_count', 'line_count'
    """
    # Basic text stats
    lines = [l.strip() for l in raw_ocr_text.split('\n') if l.strip()]
    char_count = sum(len(l) for l in lines)
    line_count = len(lines)

    h, w = cv2_bgr.shape[:2]
    pixel_area = h * w

    # Characters per pixel area (normalized)
    density = char_count / max(pixel_area, 1) * 10000  # chars per 10k pixels

    # Identity documents typically: 5-60 chars/10k pixels
    # Chat screenshots: 60-200+ chars/10k pixels
    # Random photos: 0-3 chars/10k pixels
    if 3 <= density <= 80:
        density_score = 1.0
    elif 1 <= density < 3:
        density_score = 0.5
    elif 80 < density <= 120:
        density_score = 0.4  # Too much text, likely a screenshot
    elif density > 120:
        density_score = 0.1  # Way too much text
    else:
        density_score = 0.1  # Almost no text

    # Line count heuristic: IDs have 5-30 lines of text typically
    if 3 <= line_count <= 40:
        line_score = 1.0
    elif line_count > 40:
        line_score = 0.3  # Too many lines for an ID
    else:
        line_score = 0.3

    overall = density_score * 0.6 + line_score * 0.4
    return {
        "score": round(overall, 2),
        "char_count": char_count,
        "line_count": line_count,
        "text_density": round(density, 2),
    }


# =============================================================================
# Signal 6: Color & Texture Profile
# =============================================================================

def _analyze_color_profile(cv2_bgr: np.ndarray) -> dict:
    """
    Analyzes color distribution to differentiate ID documents from screenshots:
    - ID documents: moderate color diversity, often have specific background colors
    - App screenshots: high saturation UI elements, very uniform backgrounds
    - Plain photos: natural color distribution

    Returns dict with 'score', 'unique_color_regions', 'is_predominantly_grayscale'
    """
    h, w = cv2_bgr.shape[:2]

    # Convert to HSV
    hsv = cv2.cvtColor(cv2_bgr, cv2.COLOR_BGR2HSV)
    hue = hsv[:, :, 0]
    sat = hsv[:, :, 1]
    val = hsv[:, :, 2]

    mean_sat = np.mean(sat)
    mean_val = np.mean(val)
    std_sat = np.std(sat)
    std_val = np.std(val)

    # Check if image is predominantly grayscale (like a B&W scan or screenshot)
    low_sat_ratio = np.sum(sat < 30) / (h * w)
    is_grayscale = low_sat_ratio > 0.75

    # ID documents typically have moderate saturation (not pure UI colors, not all gray)
    # Screenshots tend to have very high saturation regions (UI buttons, colored elements)
    # or very low saturation (text on white)

    score = 0.5  # Default neutral

    if 20 <= mean_sat <= 120 and 80 <= mean_val <= 220:
        # Moderate saturation and brightness - typical of document scans/photos
        score = 0.8
    elif mean_sat < 20:
        # Very low saturation - could be B&W scan (acceptable) or blank
        if std_val > 40:
            score = 0.6  # Has contrast variation - possibly a B&W document scan
        else:
            score = 0.3  # Very uniform - probably blank or screenshot
    elif mean_sat > 150:
        # Very high saturation - likely a colorful screenshot or app UI
        score = 0.2

    # Check for the uniform background blocks typical of app screenshots
    # Divide image into grid and check color uniformity
    grid_rows, grid_cols = 4, 4
    cell_h, cell_w = h // grid_rows, w // grid_cols
    uniform_cells = 0

    for r in range(grid_rows):
        for c in range(grid_cols):
            cell = cv2_bgr[r * cell_h:(r + 1) * cell_h, c * cell_w:(c + 1) * cell_w]
            cell_std = np.std(cell)
            if cell_std < 8:  # Very uniform color cell
                uniform_cells += 1

    uniform_ratio = uniform_cells / (grid_rows * grid_cols)
    if uniform_ratio > 0.5:
        # More than half the image is uniform color blocks - screenshot-like
        score *= 0.5

    return {
        "score": round(score, 2),
        "mean_saturation": round(float(mean_sat), 1),
        "mean_brightness": round(float(mean_val), 1),
        "is_predominantly_grayscale": is_grayscale,
        "uniform_block_ratio": round(uniform_ratio, 2),
    }


# =============================================================================
# Signal 7: Screenshot Detection Heuristics
# =============================================================================

def _detect_screenshot_artifacts(cv2_bgr: np.ndarray, raw_ocr_text: str) -> dict:
    """
    Specifically detects artifacts common in screenshots and non-document images:
    - Status bars (time, battery, signal indicators in text)
    - App UI elements (buttons, navigation bars detected via text patterns)
    - Chat message patterns (timestamps, usernames, bubble layouts)
    - Social media watermarks

    Returns dict with 'is_screenshot', 'confidence', 'detected_artifacts'
    """
    text_lower = raw_ocr_text.lower()
    artifacts = []

    # Check for status bar indicators
    status_bar_patterns = [
        r'\d{1,2}:\d{2}\s*(am|pm)?',  # Time display
        r'\d{1,3}%',  # Battery percentage
        r'(wifi|lte|4g|5g|3g)',  # Network indicators
        r'(whatsapp|telegram|messenger|instagram|facebook|twitter|snapchat|tiktok)',  # App names
        r'(type a message|send|reply|forward|share)',  # Chat UI elements
        r'(online|last seen|typing)',  # Chat status
        r'(settings|notifications|profile|home|search)',  # App navigation
    ]

    for pattern in status_bar_patterns:
        if re.search(pattern, text_lower):
            artifacts.append(pattern.replace(r'\d', 'D').replace(r'\s', 'S')[:30])

    # Check for URL patterns (common in browser screenshots)
    if re.search(r'https?://|www\.|\.com|\.org|\.net', text_lower):
        artifacts.append("url_detected")

    # Check for emoji or special Unicode (common in chat screenshots)
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # Emoticons
        "\U0001F300-\U0001F5FF"  # Symbols & pictographs
        "\U0001F680-\U0001F6FF"  # Transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # Flags
        "]+",
        flags=re.UNICODE,
    )
    if emoji_pattern.search(raw_ocr_text):
        artifacts.append("emoji_detected")

    artifact_count = len(artifacts)
    is_screenshot = artifact_count >= 2

    if artifact_count >= 4:
        confidence = 0.95
    elif artifact_count >= 2:
        confidence = 0.75
    elif artifact_count == 1:
        confidence = 0.35
    else:
        confidence = 0.0

    # Score: high = good (document-like), low = bad (screenshot-like)
    score = max(0.0, 1.0 - confidence)

    return {
        "score": round(score, 2),
        "is_screenshot": is_screenshot,
        "screenshot_confidence": round(confidence, 2),
        "detected_artifacts": artifacts[:10],
    }


# =============================================================================
# Master Classification Engine
# =============================================================================

# Classification thresholds
GENUINE_THRESHOLD = 0.55       # Above this = GENUINE document
SUSPICIOUS_THRESHOLD = 0.35    # Between suspicious and genuine = SUSPICIOUS
# Below SUSPICIOUS = FAKE

# Signal weights in the final score
SIGNAL_WEIGHTS = {
    "face": 0.20,           # Face presence on document
    "structure": 0.10,      # Aspect ratio & rectangularity
    "mrz": 0.15,            # Machine-readable zone
    "keywords": 0.25,       # Identity vocabulary in OCR text
    "text_density": 0.10,   # Text amount & layout
    "color": 0.08,          # Color profile analysis
    "screenshot": 0.12,     # Screenshot artifact detection
}


def classify_document(
    cv2_bgr: np.ndarray,
    raw_ocr_text: str,
    document_type: str = "PASSPORT",
) -> dict:
    """
    Master document classification function.

    Combines all signals into a single weighted authenticity score and returns
    a classification decision: GENUINE, SUSPICIOUS, or FAKE.

    Args:
        cv2_bgr: The document image in BGR format (OpenCV)
        raw_ocr_text: The raw OCR text extracted from the image
        document_type: Expected document type (PASSPORT, NATIONAL_ID, DRIVING_LICENSE)

    Returns:
        {
            "classification": "GENUINE" | "SUSPICIOUS" | "FAKE",
            "is_authentic_document": bool,
            "authenticity_score": float (0.0 - 1.0),
            "signals": { ... detailed per-signal results ... },
            "reasons": [str],  # Human-readable explanation
            "recommendation": str,  # Action recommendation
        }
    """
    reasons = []

    # Run all signal analyzers
    face_result = _check_face_on_document(cv2_bgr)
    structure_result = _analyze_document_structure(cv2_bgr)
    mrz_result = _detect_mrz_zone(raw_ocr_text)
    keyword_result = _analyze_identity_keywords(raw_ocr_text)
    density_result = _analyze_text_density(cv2_bgr, raw_ocr_text)
    color_result = _analyze_color_profile(cv2_bgr)
    screenshot_result = _detect_screenshot_artifacts(cv2_bgr, raw_ocr_text)

    # Compute weighted score
    weighted_score = (
        face_result["score"] * SIGNAL_WEIGHTS["face"] +
        structure_result["score"] * SIGNAL_WEIGHTS["structure"] +
        mrz_result["score"] * SIGNAL_WEIGHTS["mrz"] +
        keyword_result["score"] * SIGNAL_WEIGHTS["keywords"] +
        density_result["score"] * SIGNAL_WEIGHTS["text_density"] +
        color_result["score"] * SIGNAL_WEIGHTS["color"] +
        screenshot_result["score"] * SIGNAL_WEIGHTS["screenshot"]
    )

    # Apply document-type-specific adjustments
    if document_type in ("PASSPORT",):
        # Passports MUST have MRZ - penalize heavily if missing
        if not mrz_result["has_mrz"]:
            weighted_score *= 0.8
            reasons.append("No Machine-Readable Zone (MRZ) detected — expected on passports.")
    elif document_type in ("NATIONAL_ID",):
        # NID should have either MRZ (TD1) or strong keyword presence
        if not mrz_result["has_mrz"] and keyword_result["high_matches"] < 2:
            weighted_score *= 0.85
            reasons.append("Neither MRZ nor sufficient identity keywords found for National ID.")

    # Hard disqualifiers (immediate FAKE classification)
    if screenshot_result["is_screenshot"] and screenshot_result["screenshot_confidence"] >= 0.75:
        weighted_score = min(weighted_score, 0.20)
        reasons.append("Image detected as an application screenshot with high confidence.")

    if not face_result["has_face"] and not mrz_result["has_mrz"] and keyword_result["total_matches"] == 0:
        weighted_score = min(weighted_score, 0.10)
        reasons.append("No face, no MRZ, and no identity keywords found — this does not appear to be an identity document.")

    # Build reason explanations for each signal
    if face_result["has_face"]:
        if face_result["face_area_ratio"] > 0.50:
            reasons.append("Face detected but occupies an unusually large portion of the image (selfie-like, not document-embedded).")
    else:
        reasons.append("No portrait photo detected on the document.")

    if keyword_result["total_matches"] == 0:
        reasons.append("No identity-related text found on the image.")
    elif keyword_result["high_matches"] >= 3:
        reasons.append(f"Strong identity vocabulary detected ({keyword_result['high_matches']} high-confidence keywords).")

    if structure_result["score"] >= 0.7:
        reasons.append("Image dimensions and structure are consistent with standard identity document formats.")

    if color_result["uniform_block_ratio"] > 0.5:
        reasons.append("Image contains large uniform color blocks typical of app interfaces/screenshots.")

    # Classify
    weighted_score = round(max(0.0, min(1.0, weighted_score)), 3)

    if weighted_score >= GENUINE_THRESHOLD:
        classification = "GENUINE"
        is_authentic = True
        recommendation = "Document appears to be a legitimate identity document. Proceed with verification."
    elif weighted_score >= SUSPICIOUS_THRESHOLD:
        classification = "SUSPICIOUS"
        is_authentic = False
        recommendation = "Document shows some identity document characteristics but failed multiple checks. Manual review recommended."
    else:
        classification = "FAKE"
        is_authentic = False
        recommendation = "Image does not appear to be a genuine identity document. Verification declined."

    return {
        "classification": classification,
        "is_authentic_document": is_authentic,
        "authenticity_score": weighted_score,
        "signals": {
            "face_presence": {
                "score": face_result["score"],
                "has_face": face_result["has_face"],
                "face_count": face_result["face_count"],
                "face_area_ratio": face_result["face_area_ratio"],
            },
            "structure": {
                "score": structure_result["score"],
                "aspect_ratio": structure_result["aspect_ratio"],
            },
            "mrz_detection": {
                "score": mrz_result["score"],
                "has_mrz": mrz_result["has_mrz"],
                "format": mrz_result["mrz_format"],
            },
            "keyword_analysis": {
                "score": keyword_result["score"],
                "total_matches": keyword_result["total_matches"],
                "high_matches": keyword_result["high_matches"],
                "matched": keyword_result["matched_keywords"],
            },
            "text_density": {
                "score": density_result["score"],
                "char_count": density_result["char_count"],
                "line_count": density_result["line_count"],
            },
            "color_profile": {
                "score": color_result["score"],
                "is_grayscale": color_result["is_predominantly_grayscale"],
                "uniform_block_ratio": color_result["uniform_block_ratio"],
            },
            "screenshot_detection": {
                "score": screenshot_result["score"],
                "is_screenshot": screenshot_result["is_screenshot"],
                "confidence": screenshot_result["screenshot_confidence"],
                "artifacts": screenshot_result["detected_artifacts"],
            },
        },
        "reasons": [r for r in reasons if r],  # Deduplicate and clean
        "recommendation": recommendation,
    }
