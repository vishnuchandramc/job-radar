"""
Fine-tune a DistilBERT model for job email classification.

Usage:
  pip install transformers datasets torch onnx onnxruntime optimum
  python scripts/train.py

Output:
  models/job-email-classifier/       — PyTorch model + tokenizer
  models/job-email-classifier-onnx/  — ONNX quantized model (for Transformers.js)
"""

import json
import os
from pathlib import Path

import numpy as np
import torch
from datasets import Dataset, DatasetDict
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
)
from optimum.onnxruntime import ORTModelForSequenceClassification
from optimum.onnxruntime.configuration import AutoQuantizationConfig

# --- Config ---
BASE_MODEL = "distilbert-base-uncased"
DATA_PATH = Path(__file__).parent.parent / "data" / "training_data.jsonl"
OUTPUT_DIR = Path(__file__).parent.parent / "models" / "job-email-classifier"
ONNX_DIR = Path(__file__).parent.parent / "models" / "job-email-classifier-onnx"

LABELS = ["offer", "interview_request", "rejection", "application_confirmation", "other"]
LABEL2ID = {label: i for i, label in enumerate(LABELS)}
ID2LABEL = {i: label for i, label in enumerate(LABELS)}

MAX_LENGTH = 128
EPOCHS = 10
BATCH_SIZE = 16
LEARNING_RATE = 2e-5
EVAL_SPLIT = 0.15
SEED = 42


def load_data() -> DatasetDict:
    """Load JSONL and split into train/eval."""
    examples = []
    with open(DATA_PATH) as f:
        for line in f:
            if not line.strip():
                continue
            item = json.loads(line)
            examples.append({
                "text": f"{item['subject']} [SEP] {item['snippet']}",
                "label": LABEL2ID[item["label"]],
            })

    dataset = Dataset.from_list(examples)
    # Cast label to ClassLabel for stratified splitting
    from datasets import ClassLabel, Features, Value
    features = Features({"text": Value("string"), "label": ClassLabel(names=LABELS)})
    dataset = dataset.cast(features)
    split = dataset.train_test_split(test_size=EVAL_SPLIT, seed=SEED, stratify_by_column="label")
    return DatasetDict({"train": split["train"], "eval": split["test"]})


def compute_metrics(eval_pred):
    """Compute accuracy and per-class metrics."""
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    accuracy = (predictions == labels).mean()

    # Per-class accuracy
    per_class = {}
    for label_name, label_id in LABEL2ID.items():
        mask = labels == label_id
        if mask.sum() > 0:
            per_class[f"acc_{label_name}"] = (predictions[mask] == labels[mask]).mean()

    return {"accuracy": accuracy, **per_class}


def main():
    print(f"Loading data from {DATA_PATH}")
    datasets = load_data()
    print(f"Train: {len(datasets['train'])} examples, Eval: {len(datasets['eval'])} examples")

    # Label distribution
    from collections import Counter
    train_dist = Counter(datasets["train"]["label"])
    print(f"Train distribution: {({ID2LABEL[k]: v for k, v in sorted(train_dist.items())})}")

    print(f"\nLoading tokenizer and model: {BASE_MODEL}")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    model = AutoModelForSequenceClassification.from_pretrained(
        BASE_MODEL,
        num_labels=len(LABELS),
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )

    def tokenize(batch):
        return tokenizer(batch["text"], padding="max_length", truncation=True, max_length=MAX_LENGTH)

    tokenized = datasets.map(tokenize, batched=True, remove_columns=["text"])

    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR / "checkpoints"),
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        logging_steps=10,
        seed=SEED,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized["train"],
        eval_dataset=tokenized["eval"],
        compute_metrics=compute_metrics,
    )

    print("\nTraining...")
    trainer.train()

    # Evaluate
    print("\nFinal evaluation:")
    metrics = trainer.evaluate()
    for k, v in sorted(metrics.items()):
        if k.startswith("eval_"):
            print(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")

    # Save PyTorch model
    print(f"\nSaving model to {OUTPUT_DIR}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))

    # Export to ONNX (quantized) for Transformers.js
    print(f"\nExporting quantized ONNX model to {ONNX_DIR}")
    ONNX_DIR.mkdir(parents=True, exist_ok=True)

    ort_model = ORTModelForSequenceClassification.from_pretrained(
        str(OUTPUT_DIR),
        export=True,
    )

    qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)
    ort_model.save_pretrained(str(ONNX_DIR))
    tokenizer.save_pretrained(str(ONNX_DIR))

    # Also quantize
    from optimum.onnxruntime import ORTQuantizer
    quantizer = ORTQuantizer.from_pretrained(str(ONNX_DIR), file_name="model.onnx")
    quantizer.quantize(save_dir=str(ONNX_DIR), quantization_config=qconfig)

    print("\nDone! Files ready for upload to HuggingFace Hub.")
    print(f"  PyTorch: {OUTPUT_DIR}")
    print(f"  ONNX:    {ONNX_DIR}")
    print(f"\nTo upload: huggingface-cli upload job-radar/email-classifier {ONNX_DIR}")


if __name__ == "__main__":
    main()
