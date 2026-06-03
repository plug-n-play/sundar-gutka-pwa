import sqlite3
import json
import os

def generate_json_database():
    db_path = './gutka_v01.db'
    output_dir = './public/data'
    banis_output_dir = os.path.join(output_dir, 'banis')

    # Ensure output directories exist
    os.makedirs(banis_output_dir, exist_ok=True)

    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        return

    print("Connecting to database...")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Generate banis.json
    print("Generating banis.json...")
    cursor.execute("SELECT ID, Gurmukhi, Transliterations FROM Banis WHERE ID <= 107 OR ID = 1000")
    banis = []
    for row in cursor.fetchall():
        translit = None
        if row['Transliterations']:
            try:
                translit = json.loads(row['Transliterations'])
            except Exception as e:
                print(f"Warning: Failed to parse transliteration for Bani ID {row['ID']}: {e}")
                translit = row['Transliterations']
                
        banis.append({
            'ID': row['ID'],
            'Gurmukhi': row['Gurmukhi'],
            'Transliterations': translit
        })

    with open(os.path.join(output_dir, 'banis.json'), 'w', encoding='utf-8') as f:
        json.dump(banis, f, ensure_ascii=False, indent=2)

    print(f"Generated banis.json with {len(banis)} items.")

    # 2. Generate banis/{id}.json
    print("Generating individual Bani JSON files...")
    for index, bani in enumerate(banis):
        bani_id = bani['ID']
        cursor.execute("""
            SELECT ID, Seq, header, Paragraph, Gurmukhi, Visraam, Transliterations, Translations, 
                   existsSGPC, existsMedium, existsTaksal, existsBuddhaDal, MangalPosition
            FROM mv_Banis_Shabad
            WHERE Bani = ?
            ORDER BY Seq ASC
        """, (bani_id,))
        
        lines = []
        for row in cursor.fetchall():
            translit = None
            trans = None
            visraam = None
            
            if row['Transliterations']:
                try:
                    translit = json.loads(row['Transliterations'])
                except Exception:
                    translit = row['Transliterations']
                    
            if row['Translations']:
                try:
                    trans = json.loads(row['Translations'])
                except Exception:
                    trans = row['Translations']
                    
            if row['Visraam']:
                try:
                    visraam = json.loads(row['Visraam'])
                except Exception:
                    visraam = row['Visraam']
                    
            lines.append({
                'ID': row['ID'],
                'Seq': row['Seq'],
                'header': row['header'],
                'Paragraph': row['Paragraph'],
                'Gurmukhi': row['Gurmukhi'],
                'Visraam': visraam,
                'Transliterations': translit,
                'Translations': trans,
                'existsSGPC': row['existsSGPC'],
                'existsMedium': row['existsMedium'],
                'existsTaksal': row['existsTaksal'],
                'existsBuddhaDal': row['existsBuddhaDal'],
                'MangalPosition': row['MangalPosition']
            })
            
        with open(os.path.join(banis_output_dir, f"{bani_id}.json"), 'w', encoding='utf-8') as f:
            json.dump(lines, f, ensure_ascii=False, indent=2)
        
        if (index + 1) % 10 == 0 or (index + 1) == len(banis):
            print(f"Progress: {index + 1}/{len(banis)} Banis processed.")

    conn.close()
    print("Static JSON database generation complete!")

if __name__ == '__main__':
    generate_json_database()
