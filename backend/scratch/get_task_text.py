import sqlite3
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
conn = sqlite3.connect('test.db')
cursor = conn.cursor()
cursor.execute("SELECT id, name, is_cloned, ref_audio_path, ref_text FROM voices")
rows = cursor.fetchall()
print("\n--- VOICES ---")
for r in rows:
    print(r)

cursor.execute("SELECT id, text, voice_id, status FROM generations WHERE id='047d5630-97da-4409-a95f-4e11c6e7b6ea'")
row = cursor.fetchone()
print("\n--- TARGET GENERATION ---")
print(row)
conn.close()
