"""
Specialized IndicTrans2 Training & Tokenizer Adaptation Module.

Manages IndicTrans2-specific requirements:
- IndicProcessor token preparation (adding direction language tags: '__hin_Deva__')
- Pretrained Devanagari subword alignment
- Integration with LoRA fine-tuning wrapper
"""

import argparse
import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, "research", "model-training"))

from train_lora import main as run_lora_main


def main():
    parser = argparse.ArgumentParser(description="IndicTrans2 Training Wrapper")
    parser.add_argument("--direction", choices=["hi_to_unr", "unr_to_hi"], default="hi_to_unr")
    parser.add_argument("--smoke-test", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    print("=" * 70)
    print(f"INDICTRANS2 DIRECTIONAL TRAINING WRAPPER (Direction: {args.direction})")
    print("=" * 70)
    # Forward to core train_lora execution
    sys.argv = [sys.argv[0], f"--direction={args.direction}"]
    if args.smoke_test:
        sys.argv.append("--smoke-test")
    if args.dry_run:
        sys.argv.append("--dry-run")
    run_lora_main()


if __name__ == "__main__":
    main()
