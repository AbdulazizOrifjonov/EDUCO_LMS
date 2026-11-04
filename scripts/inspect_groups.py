import json

with open(r'.data\db.json', encoding='utf-8') as f:
    db = json.load(f)

groups = db.get('educo_db_groups', [])
print(f"Total groups in db: {len(groups)}")
for g in groups:
    c_id = g.get('courseId') or g.get('course_id')
    t_id = g.get('teacherId') or g.get('teacher_id')
    t_name = g.get('teacherName') or g.get('teacher_name')
    st_count = len(g.get('student_ids') or [])
    print(f"ID: {g.get('id'):20} | Name: {g.get('name'):30} | Course: {c_id:18} | Teacher: {t_name} | Students: {st_count}")
