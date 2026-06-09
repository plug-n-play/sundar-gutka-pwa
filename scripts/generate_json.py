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
    cursor.execute("SELECT ID, Gurmukhi, GurmukhiUni, Transliterations FROM Banis WHERE ID <= 107 OR ID = 1000")
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
            'GurmukhiUni': row['GurmukhiUni'],
            'Transliterations': translit
        })

    with open(os.path.join(output_dir, 'banis.json'), 'w', encoding='utf-8') as f:
        json.dump(banis, f, ensure_ascii=False, indent=2)

    print(f"Generated banis.json with {len(banis)} items.")

    # 2. Generate banis/{id}.json
    print("Generating individual Bani JSON files...")
    DEFAULT_BANI_IDS = {2, 4, 6, 9, 10, 21, 23, 3, 30, 31, 36, 90, 22}
    preloaded_shabad_lines = {}

    for index, bani in enumerate(banis):
        bani_id = bani['ID']
        cursor.execute("""
            SELECT ID, Seq, header, Paragraph, Gurmukhi, GurmukhiUni, Visraam, Transliterations, Translations, 
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
                'GurmukhiUni': row['GurmukhiUni'],
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
        
        # Capture first 8 lines of default Banis for MEDIUM length
        if bani_id in DEFAULT_BANI_IDS:
            medium_lines = [
                l for l in lines
                if l['existsMedium'] == 1 and (l['MangalPosition'] is None or l['MangalPosition'] == 'current')
            ]
            # Sort by Seq to ensure correct order
            medium_lines.sort(key=lambda x: x['Seq'])
            preloaded_shabad_lines[bani_id] = medium_lines[:8]

        if (index + 1) % 10 == 0 or (index + 1) == len(banis):
            print(f"Progress: {index + 1}/{len(banis)} Banis processed.")

    # Write preloaded_data.js
    print("Generating preloaded_data.js...")
    preloaded_js_path = './src/database/preloaded_data.js'
    with open(preloaded_js_path, 'w', encoding='utf-8') as f:
        f.write("// Generated during build process. Do not edit manually.\n")
        f.write("export const PRELOADED_BANI_LIST = ")
        json.dump(banis, f, ensure_ascii=False, indent=2)
        f.write(";\n\nexport const PRELOADED_SHABAD_LINES = ")
        json.dump(preloaded_shabad_lines, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    conn.close()
    print("Static JSON database generation complete!")

if __name__ == '__main__':
    generate_json_database()
