import base64
import io
import cv2
import numpy as np
from PIL import Image
import mediapipe as mp

# MediaPipe FaceMesh Singleton
_mp_face_mesh = None

def get_face_mesh():
    """Returns a cached MediaPipe FaceMesh instance configured for static portrait analysis."""
    global _mp_face_mesh
    if _mp_face_mesh is None:
        _mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=3,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        )
    return _mp_face_mesh

def decode_base64_image(image_base64: str) -> Image.Image:
    """Decodes a base64 encoded image string to a PIL Image in RGB format."""
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    image_data = base64.b64decode(image_base64)
    return Image.open(io.BytesIO(image_data)).convert("RGB")

def estimate_head_pose(landmarks_2d: np.ndarray, img_w: int, img_h: int) -> tuple[float, float, float]:
    """
    Estimates Pitch, Yaw, and Roll angles (in degrees) using OpenCV solvePnP
    with canonical 3D facial model points mapped to 2D MediaPipe landmarks:
    - Nose tip: index 1
    - Chin: index 152
    - Left eye outer corner: index 33
    - Right eye outer corner: index 263
    - Left mouth corner: index 61
    - Right mouth corner: index 291
    """
    # 3D model points (standard anthropometric facial landmarks in mm, Y downwards matching OpenCV image space)
    model_points = np.array([
        (0.0, 0.0, 0.0),          # Nose tip (landmark 1)
        (0.0, 330.0, -65.0),      # Chin (landmark 152)
        (-225.0, -170.0, -135.0), # Left eye corner (viewer's left / landmark 33)
        (225.0, -170.0, -135.0),  # Right eye corner (viewer's right / landmark 263)
        (-150.0, 150.0, -125.0),  # Left mouth corner (landmark 61)
        (150.0, 150.0, -125.0),   # Right mouth corner (landmark 291)
    ], dtype=np.float64)

    image_points = np.array([
        landmarks_2d[1],
        landmarks_2d[152],
        landmarks_2d[33],
        landmarks_2d[263],
        landmarks_2d[61],
        landmarks_2d[291],
    ], dtype=np.float64)

    focal_length = img_w
    center = (img_w / 2.0, img_h / 2.0)
    camera_matrix = np.array([
        [focal_length, 0.0, center[0]],
        [0.0, focal_length, center[1]],
        [0.0, 0.0, 1.0],
    ], dtype=np.float64)

    dist_coeffs = np.zeros((4, 1), dtype=np.float64)

    success, rvec, _ = cv2.solvePnP(
        model_points,
        image_points,
        camera_matrix,
        dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE,
    )

    if not success:
        return 0.0, 0.0, 0.0

    rmat, _ = cv2.Rodrigues(rvec)
    # Extract Euler angles from rotation matrix
    sy = np.sqrt(rmat[0, 0] ** 2 + rmat[1, 0] ** 2)
    singular = sy < 1e-6

    if not singular:
        x = np.arctan2(rmat[2, 1], rmat[2, 2])
        y = np.arctan2(-rmat[2, 0], sy)
        z = np.arctan2(rmat[1, 0], rmat[0, 0])
    else:
        x = np.arctan2(-rmat[1, 2], rmat[1, 1])
        y = np.arctan2(-rmat[2, 0], sy)
        z = 0.0

    pitch = float(np.degrees(x))
    yaw = float(np.degrees(y))
    roll = float(np.degrees(z))

    return pitch, yaw, roll

def assess_face_quality(image_base64: str) -> dict:
    """
    Performs real biometric quality assessment using MediaPipe FaceMesh
    landmark geometry and OpenCV spatial analyses:
    - Exactly one face presence verification
    - Landmark-based bounding box centering and framing
    - 3D Head pose angle analysis (Pitch, Yaw, Roll via solvePnP)
    - True Laplacian blur variance
    - Face ROI exposure & contrast analysis
    """
    try:
        pil_img = decode_base64_image(image_base64)
    except Exception as e:
        return {
            "is_acceptable": False,
            "quality_score": 0.0,
            "checks": {
                "has_single_face": False,
                "is_clear": False,
                "good_lighting": False,
                "is_centered": False,
            },
            "issues": [f"Image decoding error: {str(e)}"],
            "metrics": {},
        }

    width, height = pil_img.size
    rgb_arr = np.array(pil_img)
    gray = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2GRAY)
    issues = []

    # 1. Resolution Check
    if width < 160 or height < 160:
        issues.append("Image resolution is too low. Minimum required is 160x160 pixels.")

    # 2. MediaPipe Landmark Detection
    face_mesh = get_face_mesh()
    mesh_results = face_mesh.process(rgb_arr)

    detected_faces = mesh_results.multi_face_landmarks if mesh_results and mesh_results.multi_face_landmarks else []
    face_count = len(detected_faces)
    has_single_face = face_count == 1

    if face_count == 0:
        issues.append("No face detected in the image.")
    elif face_count > 1:
        issues.append(f"Multiple faces ({face_count}) detected in frame. Only one individual must be present.")

    is_centered = False
    pitch, yaw, roll = 0.0, 0.0, 0.0
    face_roi_gray = gray

    if has_single_face:
        face_landmarks = detected_faces[0]
        # Convert normalized coordinates to pixel space
        landmarks_px = np.array([
            (lm.x * width, lm.y * height) for lm in face_landmarks.landmark
        ], dtype=np.float32)

        # Compute face bounding box from all 468 landmarks
        min_x = np.min(landmarks_px[:, 0])
        max_x = np.max(landmarks_px[:, 0])
        min_y = np.min(landmarks_px[:, 1])
        max_y = np.max(landmarks_px[:, 1])

        face_w = max_x - min_x
        face_h = max_y - min_y
        face_center_x = (min_x + max_x) / 2.0
        face_center_y = (min_y + max_y) / 2.0

        # Centering check: distance from frame center relative to image dimensions
        offset_x = abs(face_center_x - (width / 2.0)) / width
        offset_y = abs(face_center_y - (height / 2.0)) / height
        is_centered = offset_x < 0.25 and offset_y < 0.25

        if not is_centered:
            issues.append("Face is not centered in the frame. Please look directly into the camera.")

        # Face size coverage check
        face_coverage = (face_w * face_h) / (width * height)
        if face_coverage < 0.08:
            issues.append("Face is too far from camera. Please move closer.")

        # 3D Head Pose check
        try:
            pitch, yaw, roll = estimate_head_pose(landmarks_px, width, height)
            if abs(yaw) > 25.0:
                issues.append(f"Head is turned sideways ({round(yaw, 1)}°). Please face camera directly.")
            if abs(pitch) > 25.0:
                issues.append(f"Head is tilted up/down ({round(pitch, 1)}°). Please face camera directly.")
        except Exception:
            pass

        # Crop face ROI for localized illumination analysis
        bx1 = max(0, int(min_x))
        by1 = max(0, int(min_y))
        bx2 = min(width, int(max_x))
        by2 = min(height, int(max_y))
        if bx2 > bx1 and by2 > by1:
            face_roi_gray = gray[by1:by2, bx1:bx2]

    # 3. Blur Detection (OpenCV Laplacian variance)
    laplacian_var = float(cv2.Laplacian(face_roi_gray, cv2.CV_64F).var())
    is_clear = laplacian_var >= 55.0

    if not is_clear:
        issues.append("Image appears blurry. Please hold camera steady.")

    # 4. Exposure & Lighting Analysis on Face Region
    mean_brightness = float(np.mean(face_roi_gray))
    std_brightness = float(np.std(face_roi_gray))
    good_lighting = 40.0 <= mean_brightness <= 220.0 and std_brightness >= 18.0

    if mean_brightness < 40.0:
        issues.append("Lighting is too dark on face.")
    elif mean_brightness > 220.0:
        issues.append("Face is overexposed to direct light or glare.")

    # 5. Composite Quality Score
    components = [
        1.0 if has_single_face else 0.0,
        1.0 if is_clear else min(1.0, laplacian_var / 55.0),
        1.0 if good_lighting else 0.4,
        1.0 if is_centered else 0.5,
        1.0 if (abs(yaw) <= 15.0 and abs(pitch) <= 15.0) else 0.5,
    ]
    quality_score = round(float(np.mean(components)), 3)
    is_acceptable = len(issues) == 0 and quality_score >= 0.70

    return {
        "is_acceptable": is_acceptable,
        "quality_score": quality_score,
        "checks": {
            "has_single_face": has_single_face,
            "is_clear": is_clear,
            "good_lighting": good_lighting,
            "is_centered": is_centered,
        },
        "issues": issues,
        "metrics": {
            "width": width,
            "height": height,
            "face_count": face_count,
            "mean_brightness": round(mean_brightness, 1),
            "laplacian_variance": round(laplacian_var, 1),
            "estimated_yaw": round(yaw, 1),
            "estimated_pitch": round(pitch, 1),
        },
    }
