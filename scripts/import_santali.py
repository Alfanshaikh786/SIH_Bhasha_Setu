"""
Safe, Transactional CSV Ingestion Script for Bhasha Setu
Imports Santhali-Words.csv into local PostgreSQL (tribal_translation_db)
Preserving 100% Unicode Ol Chiki, Devanagari, English, and Romanized text.
"""

import os
import sys
import csv
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

# Ensure standard output supports UTF-8 on Windows
sys.stdout.reconfigure(encoding='utf-8')

# 1. Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '5432'))
DB_NAME = os.getenv('DB_NAME', 'tribal_translation_db')
DB_USER = os.getenv('DB_USER', 'tribal_app')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
CSV_PATH = BASE_DIR / 'Santhali-Words.csv'

def connect_db():
    print(f"🔌 Connecting to PostgreSQL at {DB_HOST}:{DB_PORT}/{DB_NAME} as user '{DB_USER}'...")
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def ensure_categories(conn, categories_in_csv):
    """
    Ensure all categories in CSV exist in the categories table.
    Returns a dictionary mapping category_name -> category_id.
    """
    cur = conn.cursor()
    cur.execute("SELECT category_id, category_name FROM categories;")
    existing = {name: cid for cid, name in cur.fetchall()}

    for cat_name in categories_in_csv:
        if not cat_name:
            continue
        if cat_name not in existing:
            # Insert missing category
            cur.execute(
                "INSERT INTO categories (category_name, description) VALUES (%s, %s) RETURNING category_id;",
                (cat_name, f"Category for {cat_name}")
            )
            new_id = cur.fetchone()[0]
            existing[cat_name] = new_id
            print(f"  ✨ Added new category '{cat_name}' with ID {new_id}")
    
    cur.close()
    return existing

def import_csv():
    if not CSV_PATH.exists():
        print(f"❌ Error: CSV file not found at {CSV_PATH}")
        sys.exit(1)

    print(f"📄 Reading dataset from {CSV_PATH}...")
    
    # Read CSV rows
    records = []
    unique_categories = set()
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
            cat = (row.get('category') or 'General').strip()
            if cat:
                unique_categories.add(cat)

    total_csv_rows = len(records)
    print(f"📊 Total CSV records found: {total_csv_rows}")

    conn = connect_db()
    
    # Verify languages table
    cur = conn.cursor()
    cur.execute("SELECT language_id, language_code, language_name FROM languages ORDER BY language_id;")
    languages = cur.fetchall()
    print(f"🌐 Found {len(languages)} languages in database:")
    for lid, lcode, lname in languages:
        print(f"   ID {lid}: {lname} ({lcode})")
    
    # Map language codes: 1 -> en, 2 -> hi, 3 -> sat, 4 -> hoc, 5 -> unr
    lang_map = {lcode: lid for lid, lcode, lname in languages}
    # Ensure English, Hindi, Santali, Ho, Mundari are present
    en_id = lang_map.get('en', 1)
    hi_id = lang_map.get('hi', 2)
    sat_id = lang_map.get('sat', 3)
    ho_id = lang_map.get('hoc', 4)
    unr_id = lang_map.get('unr', 5)

    category_map = ensure_categories(conn, unique_categories)
    conn.commit()

    # Begin transactional import
    print("\n🚀 Starting transactional import into 'translation_sets' and 'translation_texts'...")
    
    imported_sets = 0
    imported_texts = 0
    skipped_rows = 0
    duplicate_rows = 0
    failed_rows = 0

    try:
        # Check existing translation_set_ids to avoid duplicates
        cur.execute("SELECT translation_set_id FROM translation_sets;")
        existing_set_ids = set(r[0] for r in cur.fetchall())

        for idx, row in enumerate(records, start=1):
            try:
                row_id_raw = row.get('id', '').strip()
                row_id = int(row_id_raw) if row_id_raw.isdigit() else idx

                english = (row.get('English_text') or '').strip()
                hindi = (row.get('Hindi') or '').strip()
                santali = (row.get('Santhali') or '').strip()
                santali_roman = (row.get('Santali_English_Pronounciation') or '').strip()
                category = (row.get('category') or 'General').strip()
                verified_raw = (row.get('verified') or 'Yes').strip().lower()
                is_verified = (verified_raw in ('yes', 'true', '1'))

                if not (english or hindi or santali):
                    skipped_rows += 1
                    continue

                if row_id in existing_set_ids:
                    duplicate_rows += 1
                    continue

                cat_id = category_map.get(category, category_map.get('Classroom', 1))

                # 1. Insert into translation_sets
                insert_set_query = """
                    INSERT INTO translation_sets (translation_set_id, category_id, source_name, verified, created_at, updated_at)
                    OVERRIDING SYSTEM VALUE
                    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
                """
                cur.execute(insert_set_query, (row_id, cat_id, 'santhali_words_csv', is_verified))
                existing_set_ids.add(row_id)
                imported_sets += 1

                # 2. Insert into translation_texts for each language
                # Text insert template
                text_query = """
                    INSERT INTO translation_texts (translation_set_id, language_id, text_content, pronunciation, is_verified, created_at)
                    VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP);
                """

                # English
                if english:
                    cur.execute(text_query, (row_id, en_id, english, None, is_verified))
                    imported_texts += 1

                # Hindi
                if hindi:
                    cur.execute(text_query, (row_id, hi_id, hindi, None, is_verified))
                    imported_texts += 1

                # Santali (Ol Chiki + Romanized pronunciation)
                if santali:
                    cur.execute(text_query, (row_id, sat_id, santali, santali_roman or None, is_verified))
                    imported_texts += 1

                # Ho cognate
                if santali and ho_id:
                    cur.execute(text_query, (row_id, ho_id, santali, santali_roman or None, is_verified))
                    imported_texts += 1

                # Mundari cognate
                if santali and unr_id:
                    cur.execute(text_query, (row_id, unr_id, santali, santali_roman or None, is_verified))
                    imported_texts += 1

                # Progress reporting every 1000 rows
                if imported_sets % 1000 == 0:
                    print(f"   ⏳ Ingested {imported_sets}/{total_csv_rows} translation sets ({imported_texts} texts)...")

            except Exception as row_err:
                print(f"⚠️ Error processing row {idx}: {row_err}")
                failed_rows += 1
                raise row_err  # Trigger full transaction rollback

        # Update sequences so subsequent inserts auto-increment cleanly
        cur.execute("SELECT setval(pg_get_serial_sequence('translation_sets', 'translation_set_id'), COALESCE((SELECT MAX(translation_set_id) FROM translation_sets), 1));")
        cur.execute("SELECT setval(pg_get_serial_sequence('translation_texts', 'translation_text_id'), COALESCE((SELECT MAX(translation_text_id) FROM translation_texts), 1));")

        conn.commit()
        print("\n✅ Transaction successfully committed to PostgreSQL!")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during import! Transaction rolled back completely: {e}")
        cur.close()
        conn.close()
        sys.exit(1)

    cur.close()
    conn.close()

    # Summary Report
    print("\n" + "="*50)
    print("📊 IMPORT SUMMARY REPORT")
    print("="*50)
    print(f"Total CSV rows:               {total_csv_rows}")
    print(f"Successfully imported sets:   {imported_sets}")
    print(f"Total translation texts:      {imported_texts}")
    print(f"Skipped empty rows:           {skipped_rows}")
    print(f"Duplicate rows skipped:       {duplicate_rows}")
    print(f"Failed rows:                  {failed_rows}")
    print("="*50 + "\n")

    # Run validation checks
    run_validation()

def run_validation():
    print("🔍 RUNNING PHASE 5 DATA VALIDATION CHECKS...\n")
    conn = connect_db()
    cur = conn.cursor()

    # 1. Total translation sets
    cur.execute("SELECT COUNT(*) FROM translation_sets;")
    total_sets = cur.fetchone()[0]

    # 2. Total translation texts
    cur.execute("SELECT COUNT(*) FROM translation_texts;")
    total_texts = cur.fetchone()[0]

    # 3. Counts per language
    cur.execute("""
        SELECT l.language_code, l.language_name, COUNT(tt.translation_text_id)
        FROM languages l
        LEFT JOIN translation_texts tt ON l.language_id = tt.language_id
        GROUP BY l.language_id, l.language_code, l.language_name
        ORDER BY l.language_id;
    """)
    lang_counts = cur.fetchall()

    # 4. Verified records
    cur.execute("SELECT COUNT(*) FROM translation_texts WHERE is_verified = TRUE;")
    verified_texts = cur.fetchone()[0]

    # 5. Missing translations check (sets without English or Hindi or Santali)
    cur.execute("""
        SELECT COUNT(*) FROM translation_sets ts
        WHERE NOT EXISTS (SELECT 1 FROM translation_texts WHERE translation_set_id = ts.translation_set_id AND language_id = 1)
           OR NOT EXISTS (SELECT 1 FROM translation_texts WHERE translation_set_id = ts.translation_set_id AND language_id = 2)
           OR NOT EXISTS (SELECT 1 FROM translation_texts WHERE translation_set_id = ts.translation_set_id AND language_id = 3);
    """)
    missing_core = cur.fetchone()[0]

    # 6. Duplicate check (sets with more than one text for same language)
    cur.execute("""
        SELECT translation_set_id, language_id, COUNT(*)
        FROM translation_texts
        GROUP BY translation_set_id, language_id
        HAVING COUNT(*) > 1;
    """)
    duplicate_texts = cur.fetchall()

    # 7. Sample query verification
    test_queries = ['this is a cow.', 'lock the door.', "I couldn't solve it."]
    sample_results = []
    for q in test_queries:
        cur.execute("""
            SELECT ts.translation_set_id, 
                   en.text_content as english,
                   hi.text_content as hindi,
                   sat.text_content as santali,
                   sat.pronunciation as santali_roman,
                   c.category_name
            FROM translation_texts en
            JOIN translation_sets ts ON en.translation_set_id = ts.translation_set_id
            LEFT JOIN categories c ON ts.category_id = c.category_id
            LEFT JOIN translation_texts hi ON hi.translation_set_id = ts.translation_set_id AND hi.language_id = 2
            LEFT JOIN translation_texts sat ON sat.translation_set_id = ts.translation_set_id AND sat.language_id = 3
            WHERE en.language_id = 1 AND LOWER(TRIM(en.text_content)) = LOWER(TRIM(%s))
            LIMIT 1;
        """, (q,))
        row = cur.fetchone()
        if row:
            sample_results.append({
                "query": q,
                "id": row[0],
                "english": row[1],
                "hindi": row[2],
                "santali": row[3],
                "pronunciation": row[4],
                "category": row[5]
            })

    cur.close()
    conn.close()

    print("="*50)
    print("📋 VALIDATION RESULTS")
    print("="*50)
    print(f"1. Total translation sets:     {total_sets}")
    print(f"2. Total translation texts:    {total_texts}")
    print("3. Language Text Breakdown:")
    for code, name, count in lang_counts:
        print(f"   - {name} ({code}): {count}")
    print(f"4. Verified translation texts: {verified_texts}")
    print(f"5. Sets with missing core text:{missing_core}")
    print(f"6. Duplicate language texts:   {len(duplicate_texts)}")
    print("="*50)
    print("🧪 SAMPLE QUERIES VERIFICATION:")
    for s in sample_results:
        print(f"✅ Found ID {s['id']}: '{s['english']}'")
        print(f"   Hindi: {s['hindi']}")
        print(f"   Santali (Ol Chiki): {s['santali']}")
        print(f"   Pronunciation: {s['pronunciation']}")
        print(f"   Category: {s['category']}\n")
    print("="*50)

if __name__ == '__main__':
    import_csv()
