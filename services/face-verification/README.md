# Central Account AI Verification Microservice

Enterprise-grade facial biometric and identity document verification service powered by **InsightFace (ArcFace)**, **MediaPipe FaceMesh**, **Pytesseract**, and **ICAO Doc 9303 MRZ**.

## Architecture & Capabilities

1. **Biometric Face Matching (`/face/match`)**:
   - Uses InsightFace's `buffalo_l` model on the ONNXRuntime CPU provider.
   - Extracts genuine normalized 512-dimensional ArcFace facial embeddings.
   - Computes cosine similarity metrics with calibrated match thresholds (Match $\ge 0.65$, Review $0.58 - 0.65$, Reject $< 0.58$).

> **IMPORTANT - Initial Model Download**:
> On the first execution of `/face/match`, InsightFace automatically downloads the `buffalo_l` model archive (~300MB) from the official repository and caches it locally under `~/.insightface/models/buffalo_l/`.
> This requires active internet access only on the very first request. Subsequent executions run completely offline and load instantly from disk cache.

2. **Facial Quality & Pose (`/face/quality`)**:
   - Uses MediaPipe FaceMesh (468/478 3D landmarks) to verify exactly one face is present.
   - Computes landmark-based bounding box centering and framing.
   - 3D Head Pose estimation (Pitch, Yaw, Roll) via OpenCV `solvePnP` against canonical anthropometric 3D facial coordinates.
   - True OpenCV Laplacian blur variance and face ROI exposure analysis.

3. **Active Biometric Liveness (`/face/liveness`)**:
   - `BLINK`: Real-time Eye Aspect Ratio (EAR) calculated from 6 3D landmarks per eye.
   - `LOOK_LEFT` / `LOOK_RIGHT` / `TURN_HEAD`: Real 3D yaw angle calculated from facial landmark geometry.
   - `NOD_HEAD`: Real 3D pitch angle calculated from facial landmark geometry.
   - Supplementary passive anti-spoofing via 2D FFT spectral frequency analysis and skin color diffusion.

4. **Document OCR & ICAO 9303 MRZ (`/document/ocr`, `/business/ocr`)**:
   - OpenCV image preprocessing (deskewing, bilateral filtering, Otsu adaptive binarization).
   - Real character recognition using `pytesseract` (v5.5+).
   - Official ICAO Doc 9303 check-digit calculation and format verification via the `mrz` library (TD1, TD2, TD3).
   - Real per-field word confidences extracted from Tesseract `image_to_data`.

## Prerequisites & Environment

- **Python Version**: Python 3.12 (in `services/face-verification/venv`).
- **Tesseract-OCR**: Required on system path or configured via `TESSERACT_CMD` environment variable:
  ```env
  TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
  ```
  The service performs a hard sanity check on startup and fails immediately if Tesseract is not found.

## Starting the Service

```powershell
cd services/face-verification
.\venv\Scripts\Activate.ps1
uvicorn main:app --host 127.0.0.1 --port 8000
```
