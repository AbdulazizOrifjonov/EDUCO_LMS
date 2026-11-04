import { describe, it, expect, beforeEach } from 'vitest';
import { generateSubgroupSuggestions, splitGroup } from '../src/services/groupService';
import { localStore } from '../src/lib/localStore';

describe('Group Subgroups & Splitting Audit', () => {
  beforeEach(() => {
    // Reset localStore state
    localStore.setItem('educo_db_groups', []);
    localStore.setItem('educo_db_users', []);
  });

  it('correctly generates sub-group suggestions and prefixes by course name', () => {
    const eng = generateSubgroupSuggestions('Ingliz tili', 1);
    expect(eng.prefix).toBe('ENG');
    expect(eng.nextSubgroupCode).toBe('ENG-1.2');
    expect(eng.suggestions[0].code).toBe('ENG-1.1');
    expect(eng.suggestions[1].code).toBe('ENG-1.2');

    const rus = generateSubgroupSuggestions('Rus tili', 1);
    expect(rus.prefix).toBe('RUS');
    expect(rus.nextSubgroupCode).toBe('RUS-1.2');

    const math = generateSubgroupSuggestions('Matematika', 0);
    expect(math.prefix).toBe('MAT');
    expect(math.nextSubgroupCode).toBe('MAT-1.1');

    const it = generateSubgroupSuggestions('IT va Dasturlash', 0);
    expect(it.prefix).toBe('IT');
  });

  it('splits an overloaded group into 2 groups, cleanly moving students and updating counts', async () => {
    // Setup test group with 30 students
    const studentIds = [];
    const dummyStudents = [];
    for (let i = 1; i <= 30; i++) {
      const id = `student-${i}`;
      studentIds.push(id);
      dummyStudents.push({
        id,
        first_name: `Student${i}`,
        last_name: `Test`,
        role: 'student',
        group_id: 'grp-test-eng',
      });
    }

    localStore.saveUsers(dummyStudents);

    const sourceGroup = localStore.saveGroup({
      id: 'grp-test-eng',
      name: 'Ingliz tili guruhi',
      code: 'ENG-1',
      course_id: 'crs-eng',
      course_name: 'Ingliz tili',
      capacity: 20,
      student_ids: studentIds,
      enrolled_count: 30,
      room: 'Xona 102',
    });

    expect(sourceGroup.student_ids.length).toBe(30);

    // Split: move 15 students to group 2
    const toMove = studentIds.slice(15);
    const result = await splitGroup({
      sourceGroupId: 'grp-test-eng',
      renameSourceGroupTo: 'Ingliz tili 1.1 (ENG-1.1)',
      newGroupName: 'Ingliz tili 1.2 (ENG-1.2)',
      newGroupCode: 'ENG-1.2',
      room: 'Xona 102B',
      capacity: 20,
      studentIdsToMove: toMove,
    });

    expect(result.success).toBe(true);
    expect(result.remainingCount).toBe(15);
    expect(result.movedCount).toBe(15);

    // Verify source group in storage
    const allGroups = localStore.getGroups();
    const updatedSource = allGroups.find((g) => g.id === 'grp-test-eng');
    expect(updatedSource.name).toBe('Ingliz tili 1.1 (ENG-1.1)');
    expect(updatedSource.student_ids.length).toBe(15);
    expect(updatedSource.enrolled_count).toBe(15);

    // Verify new group in storage
    const newGroup = allGroups.find((g) => g.id === result.newGroup.id);
    expect(newGroup).toBeDefined();
    expect(newGroup.name).toBe('Ingliz tili 1.2 (ENG-1.2)');
    expect(newGroup.student_ids.length).toBe(15);
    expect(newGroup.enrolled_count).toBe(15);

    // Verify students' group_id updated
    const updatedUsers = localStore.getUsers();
    const movedUser = updatedUsers.find((u) => u.id === 'student-16');
    expect(movedUser.group_id).toBe(result.newGroup.id);
    expect(movedUser.groupName).toBe('Ingliz tili 1.2 (ENG-1.2)');

    const remainingUser = updatedUsers.find((u) => u.id === 'student-1');
    expect(remainingUser.group_id).toBe('grp-test-eng');
  });
});
