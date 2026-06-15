"""
Test the trained model on sample inputs.

Usage:
  python scripts/test_model.py
  python scripts/test_model.py --onnx   # test ONNX version
"""

import sys
from pathlib import Path

MODEL_DIR = Path(__file__).parent.parent / "models" / "job-email-classifier"
ONNX_DIR = Path(__file__).parent.parent / "models" / "job-email-classifier-onnx"

TEST_CASES = [
    # (subject, snippet, expected)
    ("Offer Letter - Senior Engineer", "Hi, please find attached your formal offer for the Senior Engineer role. Compensation includes...", "offer"),
    ("Update on your application", "We'd like to schedule a 45-minute technical interview with two of our engineers. Are you free...", "interview_request"),
    ("Thank you for your interest", "After careful consideration, we've decided to move forward with other candidates at this time...", "rejection"),
    ("Application received", "Thank you for applying to the Backend Engineer role. Our team will review your application and...", "application_confirmation"),
    ("Reference check request", "As part of our process, could you provide contact info for two professional references?", "other"),
    # Hard cases
    ("Next steps", "Following our conversations, we'd like to extend an offer. Please find the compensation details...", "offer"),
    ("Your application status", "Unfortunately, we won't be moving forward. We were impressed by your skills and encourage you...", "rejection"),
    ("Quick question about your application", "Before we schedule the next round, could you confirm your visa sponsorship status?", "other"),
    ("Congrats!", "You've been referred for an open position by a friend. Click here to view and apply...", "other"),
    ("Interview invitation", "Based on your profile, here are 5 companies that want to interview you on Hired.com...", "other"),
]


def test_pytorch():
    from transformers import pipeline
    print(f"Loading PyTorch model from {MODEL_DIR}\n")
    clf = pipeline("text-classification", model=str(MODEL_DIR), top_k=5)
    run_tests(clf)


def test_onnx():
    from optimum.onnxruntime import ORTModelForSequenceClassification
    from transformers import AutoTokenizer, pipeline
    print(f"Loading ONNX model from {ONNX_DIR}\n")
    model = ORTModelForSequenceClassification.from_pretrained(str(ONNX_DIR))
    tokenizer = AutoTokenizer.from_pretrained(str(ONNX_DIR))
    clf = pipeline("text-classification", model=model, tokenizer=tokenizer, top_k=5)
    run_tests(clf)


def run_tests(clf):
    correct = 0
    total = len(TEST_CASES)

    for subject, snippet, expected in TEST_CASES:
        text = f"{subject} [SEP] {snippet}"
        results = clf(text)
        # top_k returns list of lists
        top = results[0][0] if isinstance(results[0], list) else results[0]
        predicted = top["label"]
        confidence = top["score"]
        match = "✓" if predicted == expected else "✗"

        if predicted == expected:
            correct += 1

        print(f"  {match} [{confidence:.2f}] {predicted:<25} (expected: {expected})")
        print(f"    Subject: {subject}")
        print(f"    Snippet: {snippet[:80]}...")
        print()

    print(f"Accuracy: {correct}/{total} ({correct/total*100:.0f}%)")


if __name__ == "__main__":
    if "--onnx" in sys.argv:
        test_onnx()
    else:
        test_pytorch()
