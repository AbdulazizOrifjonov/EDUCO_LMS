import { describe, it, expect, beforeEach } from 'vitest';
import { getGroups } from '../src/services/groupService';
import { localStore } from '../src/lib/localStore';

describe('Teacher Groups Scoping & Isolation', () => {
  beforeEach(() => {
    // Populate test groups with multiple teachers
    const testGroups = [
      {
        id: 'grp-test-1',
        name: 'FE-24 React Guruh',
        course_id: 'crs-1',
        course_name: 'Frontend React',
        teacher_id: 'usr-teacher-bobur',
        teacher_name: 'Bobur Mirzayev',
        status: 'active',
        capacity: 16,
        enrolled_count: 6,
      },
      {
        id: 'grp-test-2',
        name: 'PY-18 Python Dasturlash',
        course_id: 'crs-2',
        course_name: 'Python Backend',
        teacher_id: 'usr-teacher-bobur',
        teacher_name: 'Bobur Mirzayev',
        status: 'active',
        capacity: 14,
        enrolled_count: 6,
      },
      {
        id: 'grp-test-3',
        name: 'ENG-05 IELTS Foundation',
        course_id: 'crs-3',
        course_name: 'Ingliz tili (IELTS)',
        teacher_id: 'usr-teacher-nilufar',
        teacher_name: 'Nilufar Usmonova',
        status: 'active',
        capacity: 18,
        enrolled_count: 6,
      },
      {
        id: 'grp-test-4',
        name: 'DSGN-08 UI/UX Dizayn',
        course_id: 'crs-4',
        course_name: 'UI/UX Dizayn',
        teacher_id: 'usr-teacher-abdulaziz',
        teacher_name: 'Abdulazizbek Orifjonov',
        status: 'active',
        capacity: 15,
        enrolled_count: 6,
      },
    ];
    localStore.setItem('educo_db_groups', testGroups);
  });

  it('correctly filters groups by teacherId', async () => {
    const res = await getGroups({ teacherId: 'usr-teacher-bobur' });
    expect(res.groups).toHaveLength(2);
    expect(res.groups.every(g => g.teacher_id === 'usr-teacher-bobur')).toBe(true);
    expect(res.groups.map(g => g.name)).toEqual(['FE-24 React Guruh', 'PY-18 Python Dasturlash']);
  });

  it('correctly filters groups by teacherName', async () => {
    const res = await getGroups({ teacherName: 'Bobur Mirzayev' });
    expect(res.groups).toHaveLength(2);
    expect(res.groups.every(g => g.teacher_name === 'Bobur Mirzayev')).toBe(true);
  });

  it('never leaks other teachers groups to Bobur Mirzayev', async () => {
    const res = await getGroups({ teacherId: 'usr-teacher-bobur', teacherName: 'Bobur Mirzayev' });
    const groupNames = res.groups.map(g => g.name);
    expect(groupNames).not.toContain('ENG-05 IELTS Foundation');
    expect(groupNames).not.toContain('DSGN-08 UI/UX Dizayn');
  });

  it('correctly filters for Nilufar Usmonova', async () => {
    const res = await getGroups({ teacherId: 'usr-teacher-nilufar', teacherName: 'Nilufar Usmonova' });
    expect(res.groups).toHaveLength(1);
    expect(res.groups[0].name).toBe('ENG-05 IELTS Foundation');
  });
});
