import json

file_path = r"C:\Users\acord\.gemini\antigravity\brain\1c62f881-baa3-4e90-9381-005336d8305c\.system_generated\steps\36\output.txt"
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for table in data['tables']:
    if 'grab' in table['name'].lower() or 'ejec' in table['name'].lower():
        print(table['name'])
