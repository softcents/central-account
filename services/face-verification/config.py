import os
from pathlib import Path
from dotenv import load_dotenv
import pytesseract

# Load environment variables
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

INTERNAL_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "internal_kyc_kyb_secret_key_32chars")
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

# Tesseract OCR Configuration
TESSERACT_CMD = os.getenv("TESSERACT_CMD")
if not TESSERACT_CMD or not os.path.exists(TESSERACT_CMD):
    raise RuntimeError(
        f"FATAL: Tesseract-OCR executable not found at '{TESSERACT_CMD}'. "
        "Please install Tesseract-OCR and ensure TESSERACT_CMD is set in .env "
        "(e.g., TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe)."
    )

pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# In-memory storage for active verification sessions
active_sessions: dict[str, dict] = {}
verification_results: dict[str, dict] = {}
