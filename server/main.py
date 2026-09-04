"""
Local Offline FastAPI Backend for Bhasha Setu
Connects to local PostgreSQL (tribal_translation_db)
Provides offline JSON APIs for the React frontend service layer.
"""

import os
import sys
from pathlib import Path
from typing import Optional, List
from dotenv import load_dotenv
import psycopg2
from psycopg2 import pool
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

# Load environment
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '5432'))
DB_NAME = os.getenv('DB_NAME', 'tribal_translation_db')
DB_USER = os.getenv('DB_USER', 'tribal_app')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
PORT = int(os.getenv('PORT', '5000'))

# Connection Pool
db_pool = None

def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = pool.SimpleConnectionPool(
            1, 10,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
    return db_pool

app = FastAPI(
    title="Bhasha Setu Offline Translation Engine",
    description="Local offline PostgreSQL bridge for tribal multilingual translations.",
    version="1.0.0"
)

# CORS: strictly local origins
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Language code normalization
LANG_MAP = {
    'eng': 1, 'en': 1,
    'hin': 2, 'hi': 2,
    'sat': 3,
    'hoc': 4,
    'unr': 5
}

class TranslateRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

class TranslationRowResponse(BaseModel):
    id: int
    english: str
    hindi: str
    santali: str
    santali_roman: Optional[str] = None
    ho: Optional[str] = None
    mundari: Optional[str] = None
    category: str
    verified: str = "Yes"

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify backend and database connection."""
    p = get_db_pool()
    conn = p.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM translation_sets;")
        total_sets = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM translation_texts;")
        total_texts = cur.fetchone()[0]
        cur.close()
        return {
            "status": "online",
            "mode": "offline-local",
            "database": DB_NAME,
            "total_translation_sets": total_sets,
            "total_translation_texts": total_texts
        }
    finally:
        p.putconn(conn)

@app.get("/api/stats")
def get_stats():
    """Returns database stats formatted for SqliteStats interface."""
    p = get_db_pool()
    conn = p.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM translation_sets;")
        total_rows = cur.fetchone()[0]

        cur.execute("SELECT COUNT(DISTINCT category_id) FROM translation_sets WHERE category_id IS NOT NULL;")
        cat_count = cur.fetchone()[0]
        cur.close()

        return {
            "isReady": True,
            "totalRows": total_rows,
            "categoriesCount": cat_count,
            "loadError": None
        }
    except Exception as e:
        return {
            "isReady": False,
            "totalRows": 0,
            "categoriesCount": 0,
            "loadError": str(e)
        }
    finally:
        p.putconn(conn)

@app.get("/api/categories")
def get_categories():
    """Get categories and count of sentences per category."""
    p = get_db_pool()
    conn = p.getconn()
    try:
        cur = conn.cursor()
        query = """
            SELECT c.category_name, COUNT(ts.translation_set_id) as count
            FROM categories c
            JOIN translation_sets ts ON c.category_id = ts.category_id
            GROUP BY c.category_name
            ORDER BY count DESC;
        """
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        return [{"category": r[0], "count": r[1]} for r in rows]
    finally:
        p.putconn(conn)

@app.get("/api/search", response_model=List[TranslationRowResponse])
def search_sentences(
    keyword: str = Query("", description="Keyword to search across languages"),
    category: str = Query("All", description="Category filter"),
    limit: int = Query(30, description="Max rows to return")
):
    """Search parallel sentences with optional category filter."""
    clean_keyword = keyword.strip().lower()
    p = get_db_pool()
    conn = p.getconn()
    try:
        cur = conn.cursor()
        query = """
            SELECT 
                ts.translation_set_id as id,
                COALESCE(en.text_content, '') as english,
                COALESCE(hi.text_content, '') as hindi,
                COALESCE(sat.text_content, '') as santali,
                sat.pronunciation as santali_roman,
                COALESCE(ho.text_content, sat.text_content, '') as ho,
                COALESCE(unr.text_content, sat.text_content, '') as mundari,
                COALESCE(c.category_name, 'General') as category,
                CASE WHEN ts.verified THEN 'Yes' ELSE 'No' END as verified
            FROM translation_sets ts
            LEFT JOIN categories c ON ts.category_id = c.category_id
            LEFT JOIN translation_texts en ON en.translation_set_id = ts.translation_set_id AND en.language_id = 1
            LEFT JOIN translation_texts hi ON hi.translation_set_id = ts.translation_set_id AND hi.language_id = 2
            LEFT JOIN translation_texts sat ON sat.translation_set_id = ts.translation_set_id AND sat.language_id = 3
            LEFT JOIN translation_texts ho ON ho.translation_set_id = ts.translation_set_id AND ho.language_id = 4
            LEFT JOIN translation_texts unr ON unr.translation_set_id = ts.translation_set_id AND unr.language_id = 5
        """
        conditions = []
        params = []

        if clean_keyword:
            conditions.append("""(
                LOWER(en.text_content) LIKE %s OR
                LOWER(hi.text_content) LIKE %s OR
                LOWER(sat.text_content) LIKE %s OR
                LOWER(COALESCE(sat.pronunciation, '')) LIKE %s
            )""")
            pattern = f"%{clean_keyword}%"
            params.extend([pattern, pattern, pattern, pattern])

        if category and category != "All":
            conditions.append("c.category_name = %s")
            params.append(category)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY ts.translation_set_id ASC LIMIT %s;"
        params.append(limit)

        cur.execute(query, params)
        rows = cur.fetchall()
        cur.close()

        results = []
        for r in rows:
            results.append({
                "id": r[0],
                "english": r[1],
                "hindi": r[2],
                "santali": r[3],
                "santali_roman": r[4],
                "ho": r[5],
                "mundari": r[6],
                "category": r[7],
                "verified": r[8]
            })
        return results
    finally:
        p.putconn(conn)

@app.post("/api/translate")
def translate_text(req: TranslateRequest):
    """
    Direct SQL parallel query for exact or fuzzy match across all 5 supported languages.
    """
    clean_text = req.text.strip()
    if not clean_text:
        return {"target_text": "", "roman": None, "confidence": 0, "row": None}

    src_lang_id = LANG_MAP.get(req.source_lang.lower(), 1)
    target_lang_id = LANG_MAP.get(req.target_lang.lower(), 3)
    lower = clean_text.lower().replace('?', '').replace('!', '').replace('.', '').replace(',', '').strip()

    p = get_db_pool()
    conn = p.getconn()
    try:
        cur = conn.cursor()

        # 1. Exact Match
        exact_query = """
            SELECT 
                ts.translation_set_id as id,
                COALESCE(en.text_content, '') as english,
                COALESCE(hi.text_content, '') as hindi,
                COALESCE(sat.text_content, '') as santali,
                sat.pronunciation as santali_roman,
                COALESCE(ho.text_content, sat.text_content, '') as ho,
                COALESCE(unr.text_content, sat.text_content, '') as mundari,
                COALESCE(c.category_name, 'General') as category,
                CASE WHEN ts.verified THEN 'Yes' ELSE 'No' END as verified,
                target.text_content as target_text,
                target.pronunciation as target_roman
            FROM translation_sets ts
            JOIN translation_texts src ON src.translation_set_id = ts.translation_set_id AND src.language_id = %s
            LEFT JOIN translation_texts target ON target.translation_set_id = ts.translation_set_id AND target.language_id = %s
            LEFT JOIN categories c ON ts.category_id = c.category_id
            LEFT JOIN translation_texts en ON en.translation_set_id = ts.translation_set_id AND en.language_id = 1
            LEFT JOIN translation_texts hi ON hi.translation_set_id = ts.translation_set_id AND hi.language_id = 2
            LEFT JOIN translation_texts sat ON sat.translation_set_id = ts.translation_set_id AND sat.language_id = 3
            LEFT JOIN translation_texts ho ON ho.translation_set_id = ts.translation_set_id AND ho.language_id = 4
            LEFT JOIN translation_texts unr ON unr.translation_set_id = ts.translation_set_id AND unr.language_id = 5
            WHERE LOWER(TRIM(src.text_content)) = %s 
               OR LOWER(TRIM(COALESCE(src.pronunciation, ''))) = %s
            LIMIT 1;
        """
        cur.execute(exact_query, (src_lang_id, target_lang_id, lower, lower))
        row = cur.fetchone()

        if row:
            target_text = row[9] or row[3] or row[1]
            roman = row[10] or row[4]
            if req.target_lang in ('sat', 'hoc', 'unr') and roman and '(' not in target_text:
                target_text = f"{target_text} ({roman})"

            res_row = {
                "id": row[0], "english": row[1], "hindi": row[2],
                "santali": row[3], "santali_roman": row[4], "ho": row[5],
                "mundari": row[6], "category": row[7], "verified": row[8]
            }
            cur.close()
            return {
                "target_text": target_text,
                "roman": roman,
                "confidence": 0.99,
                "row": res_row
            }

        # 2. Fuzzy LIKE Match
        fuzzy_query = """
            SELECT 
                ts.translation_set_id as id,
                COALESCE(en.text_content, '') as english,
                COALESCE(hi.text_content, '') as hindi,
                COALESCE(sat.text_content, '') as santali,
                sat.pronunciation as santali_roman,
                COALESCE(ho.text_content, sat.text_content, '') as ho,
                COALESCE(unr.text_content, sat.text_content, '') as mundari,
                COALESCE(c.category_name, 'General') as category,
                CASE WHEN ts.verified THEN 'Yes' ELSE 'No' END as verified,
                target.text_content as target_text,
                target.pronunciation as target_roman
            FROM translation_sets ts
            JOIN translation_texts src ON src.translation_set_id = ts.translation_set_id AND src.language_id = %s
            LEFT JOIN translation_texts target ON target.translation_set_id = ts.translation_set_id AND target.language_id = %s
            LEFT JOIN categories c ON ts.category_id = c.category_id
            LEFT JOIN translation_texts en ON en.translation_set_id = ts.translation_set_id AND en.language_id = 1
            LEFT JOIN translation_texts hi ON hi.translation_set_id = ts.translation_set_id AND hi.language_id = 2
            LEFT JOIN translation_texts sat ON sat.translation_set_id = ts.translation_set_id AND sat.language_id = 3
            LEFT JOIN translation_texts ho ON ho.translation_set_id = ts.translation_set_id AND ho.language_id = 4
            LEFT JOIN translation_texts unr ON unr.translation_set_id = ts.translation_set_id AND unr.language_id = 5
            WHERE LOWER(src.text_content) LIKE %s
            LIMIT 1;
        """
        pattern = f"%{lower}%"
        cur.execute(fuzzy_query, (src_lang_id, target_lang_id, pattern))
        row = cur.fetchone()

        if row:
            target_text = row[9] or row[3] or row[1]
            roman = row[10] or row[4]
            if req.target_lang in ('sat', 'hoc', 'unr') and roman and '(' not in target_text:
                target_text = f"{target_text} ({roman})"

            res_row = {
                "id": row[0], "english": row[1], "hindi": row[2],
                "santali": row[3], "santali_roman": row[4], "ho": row[5],
                "mundari": row[6], "category": row[7], "verified": row[8]
            }
            cur.close()
            return {
                "target_text": target_text,
                "roman": roman,
                "confidence": 0.95,
                "row": res_row
            }

        cur.close()
        return {"target_text": None, "roman": None, "confidence": 0, "row": None}

    finally:
        p.putconn(conn)

if __name__ == '__main__':
    import uvicorn
    print(f"🚀 Starting Bhasha Setu Local Backend on http://127.0.0.1:{PORT}...")
    uvicorn.run("main:app", host="127.0.0.1", port=PORT, reload=False)
