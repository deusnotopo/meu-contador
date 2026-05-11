import json
from collections import Counter
from pathlib import Path

file_path = Path("D:/meu-contador/python_projects/leads_zona_leste_sem_site.json")

if not file_path.exists():
    print("File not found")
    exit(1)

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

phones = [l.get("telefone") for l in data if l.get("telefone")]
duplicates = [item for item, count in Counter(phones).items() if count > 1]

print(f"Total Leads: {len(data)}")
print(f"Total Leads with Phone: {len(phones)}")
print(f"Unique Phone Numbers: {len(set(phones))}")
print(f"Duplicate Phone Numbers found: {len(duplicates)}")

print("\nDetail of top duplicates:")
for phone in sorted(duplicates, key=lambda x: phones.count(x), reverse=True)[:10]:
    companies = [l.get("nome") for l in data if l.get("telefone") == phone]
    print(f"{phone}: {len(companies)} times ({', '.join(companies[:3])}...)")
