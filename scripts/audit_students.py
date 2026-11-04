import openpyxl
import re
import json

xlsx_path = r'C:\Users\Abdul\.gemini\antigravity\brain\9b9206b7-9351-4a4e-81a7-946ea1a6a7f1\.user_uploaded\media_1793763455834_1cdcfa13.xlsx'
wb = openpyxl.load_workbook(xlsx_path)
ws = wb.active

cols = [
    ('Matematika', 1, 2, 'crs-matematika'),
    ('Ingliz tili', 3, 4, 'crs-ingliz-tili'),
    ('Arab tili', 5, 6, 'crs-arab-tili'),
    ('Rus Tili', 7, 8, 'crs-rus-tili'),
    ('IT', 9, 10, 'crs-fullstack'),
    ('Mental', 11, 12, 'crs-1793623377912'),
    ('Shaxmat', 13, 14, 'crs-shaxmat')
]

raw_records = []
for course_name, n_col, p_col, c_id in cols:
    for r in range(2, ws.max_row + 1):
        name = ws.cell(row=r, column=n_col).value
        phone = ws.cell(row=r, column=p_col).value
        if name and str(name).strip():
            raw_records.append({
                'course': course_name,
                'courseId': c_id,
                'name': str(name).strip(),
                'phone': str(phone or '').strip()
            })

print(f"Total raw records from table: {len(raw_records)}")

def normalize_name(n):
    n = re.sub(r"[`'’ʻ´]", "'", n.strip().lower())
    n = re.sub(r"\s+", " ", n)
    return n

distinct_students = {}
for rec in raw_records:
    digits = re.sub(r"\D", "", rec['phone'])
    digits_9 = digits[-9:] if len(digits) >= 7 else ""
    norm_n = normalize_name(rec['name'])
    
    # Matching rule:
    # 1. Exact match on normalized full name
    # 2. Or if digits match and names are clearly the same person (e.g. Baratov Jaxongir vs Baratov Jahongir)
    matched_key = None
    for key, p in distinct_students.items():
        if p['norm_name'] == norm_n:
            matched_key = key
            break
        if digits_9 and p['digits'] == digits_9:
            # check if names are slight spelling variants
            c1 = re.sub(r"[hx' ]", "", norm_n)
            c2 = re.sub(r"[hx' ]", "", p['norm_name'])
            if c1 == c2:
                matched_key = key
                break
    
    if matched_key:
        distinct_students[matched_key]['courses'].append(rec['course'])
        distinct_students[matched_key]['course_ids'].append(rec['courseId'])
        if not distinct_students[matched_key]['digits'] and digits_9:
            distinct_students[matched_key]['digits'] = digits_9
            distinct_students[matched_key]['raw_phone'] = rec['phone']
    else:
        new_key = f"{norm_n}_{digits_9 if digits_9 else 'nophone'}"
        distinct_students[new_key] = {
            'norm_name': norm_n,
            'original_name': rec['name'],
            'raw_phone': rec['phone'],
            'digits': digits_9,
            'courses': [rec['course']],
            'course_ids': [rec['courseId']]
        }

print(f"Distinct individual students identified: {len(distinct_students)}")
multi = [p for p in distinct_students.values() if len(p['courses']) > 1]
print(f"Students attending multiple courses: {len(multi)}")
for p in multi:
    c_list = ", ".join(p['courses'])
    print(f"  * {p['original_name']} ({p['digits']}): {c_list}")


with open(r'.data\db.json', encoding='utf-8') as f:
    db = json.load(f)

users = db.get('educo_db_users', [])
students_in_db = [u for u in users if u.get('role') == 'student']

print(f"\n--- DATABASE AUDIT ---")
print(f"Students currently in DB: {len(students_in_db)}")
print(f"Expected distinct students from Excel: {len(distinct_students)}")

matched = 0
unmatched = []
for k, s in distinct_students.items():
    s_norm = s['norm_name']
    s_dig = s['digits']
    found = None
    for u in students_in_db:
        u_name = normalize_name(u.get('fullName') or u.get('name') or '')
        u_dig = ''.join(c for c in str(u.get('phone', '')) if c.isdigit())[-9:]
        if s_norm == u_name:
            found = u
            break
        if s_dig and u_dig == s_dig and (s_norm in u_name or u_name in s_norm):
            found = u
            break
    if found:
        matched += 1
    else:
        unmatched.append(s)

print(f"Matched in DB: {matched}/{len(distinct_students)}")
print(f"Unmatched (Missing) in DB ({len(unmatched)}):")
for u in unmatched:
    c_str = ", ".join(u['courses'])
    print(f"  - {u['original_name']} | phone: {u['raw_phone']} | courses: {c_str}")
