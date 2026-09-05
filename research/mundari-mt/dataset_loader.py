"""
Dataset Loader for Mundari Machine Translation Research Pipeline.

Loads, verifies, and normalizes Hindi-Mundari parallel corpora from:
research/datasets/mundari/

Features:
- Flexible schema detection (Hindi/hindi, Mundari/mundari, row_id)
- Missing column validation
- Explicit control over empty row removal
- Full Unicode NFC normalization
- Preserves original dataset content without silent alterations
"""

import os
import sys
import unicodedata
from typing import Optional, Tuple, Dict, Any
import pandas as pd

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

DEFAULT_DATASET_DIR = os.path.join("research", "datasets", "mundari")
DEFAULT_DATASET_PATH = os.path.join(DEFAULT_DATASET_DIR, "mundari-train.csv")


class MundariDatasetLoader:
    def __init__(self, filepath: Optional[str] = None):
        self.filepath = filepath or DEFAULT_DATASET_PATH
        self.df: Optional[pd.DataFrame] = None
        self.hindi_col: Optional[str] = None
        self.mundari_col: Optional[str] = None
        self.id_col: Optional[str] = None

    def exists(self) -> bool:
        return os.path.exists(self.filepath) and os.path.isfile(self.filepath)

    def detect_columns(self, columns) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        hindi_candidates = ["Hindi", "hindi", "hi", "source_sentence", "source", "hi_sentence"]
        mundari_candidates = ["Mundari", "mundari", "unr", "target_sentence", "target", "unr_sentence"]
        id_candidates = ["row_id", "Row ID", "id", "ID", "Unnamed: 0"]

        h_col, m_col, i_col = None, None, None

        for col in columns:
            clean = col.strip()
            if clean in hindi_candidates or clean.lower() == "hindi":
                h_col = col
            elif clean in mundari_candidates or clean.lower() == "mundari":
                m_col = col
            elif clean in id_candidates or clean.lower() in ["row_id", "row id", "id"]:
                i_col = col

        return h_col, m_col, i_col

    def load(self, drop_empty: bool = False, normalize_unicode: bool = True) -> pd.DataFrame:
        """
        Load dataset with empirical checks.

        Args:
            drop_empty: If True, drops rows where either Hindi or Mundari text is missing/empty.
            normalize_unicode: If True, applies Unicode NFC normalization to text columns.

        Returns:
            pd.DataFrame with detected columns mapped and standardized.
        """
        if not self.exists():
            raise FileNotFoundError(
                f"Dataset not found at '{self.filepath}'.\n"
                f"Please place the authentic Mundari parallel corpus at '{self.filepath}'."
            )

        print(f"Loading dataset from: {self.filepath}")
        df = pd.read_csv(self.filepath, dtype=str, keep_default_na=False)
        print(f"Available columns: {list(df.columns)}")

        h_col, m_col, i_col = self.detect_columns(df.columns)
        print(f"Detected columns -> Hindi: '{h_col}', Mundari: '{m_col}', ID: '{i_col}'")

        if not h_col or not m_col:
            raise ValueError(
                f"Required translation columns missing in {self.filepath}. "
                f"Could not reliably detect Hindi and Mundari columns from {list(df.columns)}."
            )

        self.hindi_col = h_col
        self.mundari_col = m_col
        self.id_col = i_col

        total_raw = len(df)
        print(f"Total raw rows: {total_raw}")

        if drop_empty:
            initial_count = len(df)
            mask = (df[h_col].str.strip() != "") & (df[m_col].str.strip() != "")
            df = df[mask].copy()
            dropped = initial_count - len(df)
            print(f"Explicitly dropped {dropped} empty rows. Remaining valid: {len(df)}")
        else:
            print(f"Preserving all {len(df)} rows without dropping empties (drop_empty=False).")

        if normalize_unicode:
            print("Applying Unicode NFC normalization...")
            df[h_col] = df[h_col].apply(lambda s: unicodedata.normalize("NFC", s) if isinstance(s, str) else s)
            df[m_col] = df[m_col].apply(lambda s: unicodedata.normalize("NFC", s) if isinstance(s, str) else s)

        self.df = df
        return df

    def get_summary(self) -> Dict[str, Any]:
        if self.df is None:
            return {"status": "NOT_LOADED"}
        return {
            "filepath": self.filepath,
            "total_rows": len(self.df),
            "columns": list(self.df.columns),
            "hindi_col": self.hindi_col,
            "mundari_col": self.mundari_col,
            "id_col": self.id_col
        }


def run_self_test():
    print("=" * 65)
    print("MUNDARI DATASET LOADER SELF-TEST")
    print("=" * 65)

    loader = MundariDatasetLoader()
    if not loader.exists():
        print(f"STATUS: Dataset file not found at {loader.filepath}")
        return

    df = loader.load(drop_empty=False, normalize_unicode=True)
    summary = loader.get_summary()
    print("Summary:", summary)
    print("First 3 rows:")
    h_col = summary["hindi_col"]
    m_col = summary["mundari_col"]
    for i in range(min(3, len(df))):
        print(f"  [{i+1}] HI: {df.iloc[i][h_col][:70]}")
        print(f"      UNR: {df.iloc[i][m_col][:70]}")


if __name__ == "__main__":
    run_self_test()
