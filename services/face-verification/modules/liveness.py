import random
import uuid
import time
import cv2
import numpy as np
from PIL import Image
from .face_quality import decode_base64_image, get_face_mesh, estimate_head_pose

CHALLENGE_TYPES = ["LOOK_LEFT", "LOOK_RIGHT", "BLINK", "NOD_HEAD", "TURN_HEAD"]

def create_liveness_challenge() -> dict:
    """Generates a random active challenge with a time-limited session."""
    challenge_type = random.choice(CHALLENGE_TYPES)
    token = str(uuid.uuid4())
    return {
        "challenge_token": token,
        "challenge_type": challenge_type,
        "instructions": get_challenge_instruction(challenge_type),
        "expires_in_seconds": 120,
        "created_at": time.time(),
    }

def get_challenge_instruction(challenge_type: str) -> str:
    instructions = {
        "LOOK_LEFT": "Please turn your head slightly to your left",
        "LOOK_RIGHT": "Please turn your head slightly to your right",
        "BLINK": "Please blink your eyes naturally",
        "NOD_HEAD": "Please nod your head downwards and upwards",
        "TURN_HEAD": "Please turn your head to the side",
    }
    return instructions.get(challenge_type, "Look directly into the camera")

def compute_ear(eye_landmarks: np.ndarray) -> float:
    """
    Computes Eye Aspect Ratio (EAR) given 6 landmark points [p1, p2, p3, p4, p5, p6]:
    EAR = (|p2 - p6| + |p3 - p5|) / (2 * |p1 - p4|)
    """
    # Vertical distances
    d_v1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
    d_v2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
    # Horizontal distance
    d_h = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])

    if d_h < 1e-6:
        return 0.30
    return float((d_v1 + d_v2) / (2.0 * d_h))

def verify_liveness(
    challenge_type: str,
    frame_base64: str,
    client_response: dict | None = None
) -> dict:
    """
    Verifies active liveness challenge response using real MediaPipe FaceMesh
    landmark geometry (Eye Aspect Ratio, 3D Pitch/Yaw/Roll) and supplementary
    passive anti-spoofing heuristics (spectral analysis and texture diffusion).
    """
    try:
        pil_img = decode_base64_image(frame_base64)
    except Exception as e:
        return {
            "is_live": False,
            "active_passed": False,
            "passive_liveness_score": 0.0,
            "challenge_type": challenge_type,
            "reasons": [f"Invalid frame data: {str(e)}"],
        }

    width, height = pil_img.size
    rgb_arr = np.array(pil_img)
    reasons = []

    # 1. MediaPipe Landmark Extraction
    face_mesh = get_face_mesh()
    mesh_results = face_mesh.process(rgb_arr)
    detected_faces = mesh_results.multi_face_landmarks if mesh_results and mesh_results.multi_face_landmarks else []

    if len(detected_faces) == 0:
        return {
            "is_live": False,
            "active_passed": False,
            "passive_liveness_score": 0.0,
            "challenge_type": challenge_type,
            "reasons": ["No face landmarks detected in challenge frame."],
            "metrics": {
                "measured_yaw": 0.0,
                "measured_pitch": 0.0,
                "measured_ear": 0.0,
                "spectral_ratio": 0.0,
            },
        }

    face_landmarks = detected_faces[0]
    landmarks_px = np.array([
        (lm.x * width, lm.y * height) for lm in face_landmarks.landmark
    ], dtype=np.float32)

    # 2. Real Active Landmark Motion Verification
    pitch, yaw, roll = estimate_head_pose(landmarks_px, width, height)

    # MediaPipe Eye indices (6 points per eye for EAR calculation)
    # Left eye: outer corner, upper1, upper2, inner corner, lower2, lower1
    left_eye_indices = [33, 160, 158, 133, 153, 144]
    right_eye_indices = [362, 385, 387, 263, 373, 380]

    left_ear = compute_ear(landmarks_px[left_eye_indices])
    right_ear = compute_ear(landmarks_px[right_eye_indices])
    avg_ear = float((left_ear + right_ear) / 2.0)

    active_passed = False
    reported_client = client_response or {}

    if challenge_type == "BLINK":
        # Eye closure is confirmed if detected EAR < 0.21, or client reported multi-frame minimum EAR < 0.22
        client_min_ear = float(reported_client.get("min_ear", avg_ear))
        is_eyes_closed = avg_ear < 0.21 or client_min_ear < 0.22
        active_passed = is_eyes_closed or reported_client.get("blink_detected", False)
        if not active_passed:
            reasons.append(f"Blink not detected (EAR={round(avg_ear, 3)}).")

    elif challenge_type == "LOOK_LEFT":
        # Turning head to user's left produces negative yaw
        client_yaw = float(reported_client.get("yaw_degrees", yaw))
        measured_yaw = min(yaw, client_yaw)
        active_passed = measured_yaw < -8.0
        if not active_passed:
            reasons.append(f"Left turn not detected (Yaw={round(yaw, 1)}°).")

    elif challenge_type == "LOOK_RIGHT":
        # Turning head to user's right produces positive yaw
        client_yaw = float(reported_client.get("yaw_degrees", yaw))
        measured_yaw = max(yaw, client_yaw)
        active_passed = measured_yaw > 8.0
        if not active_passed:
            reasons.append(f"Right turn not detected (Yaw={round(yaw, 1)}°).")

    elif challenge_type == "NOD_HEAD":
        # Vertical nod pitch
        client_pitch = float(reported_client.get("pitch_degrees", pitch))
        measured_pitch = pitch if abs(pitch) > abs(client_pitch) else client_pitch
        active_passed = abs(measured_pitch) > 7.0
        if not active_passed:
            reasons.append(f"Head nod not detected (Pitch={round(pitch, 1)}°).")

    elif challenge_type == "TURN_HEAD":
        # Any significant lateral turn
        client_yaw = float(reported_client.get("yaw_degrees", yaw))
        max_abs_yaw = max(abs(yaw), abs(client_yaw))
        active_passed = max_abs_yaw > 8.0
        if not active_passed:
            reasons.append(f"Head turn not detected (Yaw={round(yaw, 1)}°).")

    else:
        active_passed = True

    # 3. Supplementary Passive Anti-Spoofing (FFT Spectrum & Color Consistency)
    gray = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2GRAY)
    fft = np.fft.fft2(gray.astype(np.float32))
    fft_shift = np.fft.fftshift(fft)
    magnitude = np.log(np.abs(fft_shift) + 1.0)

    h, w = gray.shape
    cy, cx = h // 2, w // 2
    r = max(1, min(h, w) // 4)
    low_freq = float(np.mean(magnitude[cy - r : cy + r, cx - r : cx + r]))
    high_freq = float(np.mean(magnitude))
    freq_ratio = float(high_freq / (low_freq + 1e-5))

    spectral_score = 0.95 if (0.45 <= freq_ratio <= 1.6) else 0.60

    # Color naturalness (skin tone RGB ratio)
    r_chan, g_chan, b_chan = rgb_arr[:, :, 0], rgb_arr[:, :, 1], rgb_arr[:, :, 2]
    rg_diff = float(np.mean(np.abs(r_chan.astype(float) - g_chan.astype(float))))
    rb_diff = float(np.mean(np.abs(r_chan.astype(float) - b_chan.astype(float))))
    color_score = 1.0 if (rg_diff > 6.0 and rb_diff > 10.0) else 0.60

    passive_score = round(float(color_score * 0.4 + spectral_score * 0.6), 3)

    if passive_score < 0.65:
        reasons.append("Passive texture score flagged potential screen replay or photo printout.")

    is_live = active_passed and (passive_score >= 0.65)

    return {
        "is_live": is_live,
        "active_passed": active_passed,
        "passive_liveness_score": passive_score,
        "challenge_type": challenge_type,
        "reasons": reasons,
        "metrics": {
            "measured_yaw": round(yaw, 1),
            "measured_pitch": round(pitch, 1),
            "measured_ear": round(avg_ear, 3),
            "spectral_ratio": round(freq_ratio, 2),
        },
    }
