import unittest
import base64
import io
import numpy as np
from PIL import Image, ImageDraw
import config


from modules.face_quality import assess_face_quality
from modules.liveness import create_liveness_challenge, verify_liveness
from modules.face_match import compare_faces
from modules.ocr_engine import extract_document_ocr, extract_business_trade_license_ocr, parse_mrz_with_icao_checker
from mrz.checker.td3 import TD3CodeChecker
from mrz.checker.td1 import TD1CodeChecker

def create_sample_image_base64(size=(640, 480), color=(220, 200, 180)):
    """Creates a basic valid test image in base64 format."""
    img = Image.new("RGB", size, color)
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def create_rendered_passport_base64():
    """Renders a synthetic official passport ID card with visible text and valid ICAO 9303 TD3 MRZ."""
    img = Image.new("RGB", (1000, 600), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    draw.text((50, 40), "PASSPORT REPUBLIC OF BANGLADESH", fill=(0, 0, 0))
    draw.text((50, 90), "SURNAME: ERIKSSON", fill=(0, 0, 0))
    draw.text((50, 140), "GIVEN NAMES: ANNA MARIA", fill=(0, 0, 0))
    draw.text((50, 190), "DOCUMENT NUMBER: L898902C3", fill=(0, 0, 0))
    draw.text((50, 240), "NATIONALITY: UTO", fill=(0, 0, 0))

    # Standard valid ICAO 9303 TD3 MRZ
    mrz_line1 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<"
    mrz_line2 = "L898902C36UTO7408122F1204159ZE184226B<<<<<10"
    draw.text((50, 430), mrz_line1, fill=(0, 0, 0))
    draw.text((50, 490), mrz_line2, fill=(0, 0, 0))

    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def create_rendered_license_base64():
    """Renders a synthetic commercial business license document with visible legal entity details."""
    img = Image.new("RGB", (1000, 700), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    draw.text((80, 50), "CITY CORPORATION TRADE LICENSE", fill=(0, 0, 0))
    draw.text((80, 120), "Company Name: Apex Enterprise Ltd.", fill=(0, 0, 0))
    draw.text((80, 180), "License Number: TRD-BD-982341", fill=(0, 0, 0))
    draw.text((80, 240), "Issuing Authority: City Corporation Revenue Authority", fill=(0, 0, 0))
    draw.text((80, 300), "Valid Up to: 2028-12-31", fill=(0, 0, 0))

    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

class TestFaceVerificationService(unittest.TestCase):
    def setUp(self):
        self.sample_b64 = create_sample_image_base64()
        self.passport_b64 = create_rendered_passport_base64()
        self.license_b64 = create_rendered_license_base64()

    def test_face_quality_structure_and_metrics(self):
        result = assess_face_quality(self.sample_b64)
        self.assertIn("is_acceptable", result)
        self.assertIn("quality_score", result)
        self.assertIn("checks", result)
        self.assertIn("metrics", result)
        self.assertGreaterEqual(result["metrics"]["width"], 160)
        self.assertGreaterEqual(result["metrics"]["height"], 160)

    def test_liveness_challenge_and_verification(self):
        challenge = create_liveness_challenge()
        self.assertIn(challenge["challenge_type"], ["LOOK_LEFT", "LOOK_RIGHT", "BLINK", "NOD_HEAD", "TURN_HEAD"])
        self.assertGreater(challenge["expires_in_seconds"], 0)

        # Verify active challenge response evaluation
        result = verify_liveness(
            challenge_type="BLINK",
            frame_base64=self.sample_b64,
            client_response={"challenge_type": "BLINK", "blink_detected": True, "min_ear": 0.16}
        )
        self.assertIn("is_live", result)
        self.assertIn("active_passed", result)
        self.assertIn("passive_liveness_score", result)
        self.assertIn("metrics", result)

    def test_face_match_contract_and_embedding_dimension(self):
        result = compare_faces(self.sample_b64, self.sample_b64)
        self.assertIn("is_matched", result)
        self.assertIn("match_score", result)
        self.assertIn("confidence", result)
        self.assertIn("threshold", result)
        # Validate 512-dimensional ArcFace embedding contract
        self.assertEqual(result.get("embedding_dimension"), 512)

    def test_icao_9303_mrz_checksum_validation(self):
        # Official ICAO Doc 9303 TD3 sample
        mrz_td3 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10"
        checker = TD3CodeChecker(mrz_td3)
        self.assertTrue(bool(checker), "ICAO 9303 TD3 checksum should evaluate to True")

        fields = checker.fields()
        self.assertEqual(fields.surname, "ERIKSSON")
        self.assertEqual(fields.name, "ANNA MARIA")
        self.assertEqual(fields.document_number, "L898902C3")

        # Official ICAO Doc 9303 TD1 sample
        mrz_td1 = "I<UTOD231458907<<<<<<<<<<<<<<<\n7408122F1204159UTO<<<<<<<<<<<6\nERIKSSON<<ANNA<MARIA<<<<<<<<<<"
        checker_td1 = TD1CodeChecker(mrz_td1)
        self.assertTrue(bool(checker_td1), "ICAO 9303 TD1 checksum should evaluate to True")

    def test_document_ocr_pipeline(self):
        result = extract_document_ocr(self.passport_b64, document_type="PASSPORT", country_code="BD")
        self.assertTrue(result["success"])
        self.assertIn("fields", result)
        self.assertIn("document_number", result["fields"])
        self.assertIn("confidence_score", result)
        self.assertIn("field_confidences", result)
        self.assertIn("authenticity", result)
        self.assertIn("is_valid", result["authenticity"])

    def test_business_trade_license_ocr_pipeline(self):
        result = extract_business_trade_license_ocr(self.license_b64, country_code="BD")
        self.assertTrue(result["success"])
        self.assertIn("trade_license_number", result["fields"])
        self.assertIn("legal_name", result["fields"])
        self.assertIn("confidence_score", result)
        self.assertIn("is_valid", result)

if __name__ == "__main__":
    unittest.main()
