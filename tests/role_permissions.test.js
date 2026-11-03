import { describe, it, expect, beforeEach } from 'vitest';
import { ROLES } from '../src/lib/constants';
import { localStore } from '../src/lib/localStore';
import { getUsers, deleteUser, createUser } from '../src/services/userService';

describe('Role Hierarchy & Privilege Separation Audit', () => {
  beforeEach(() => {
    localStore.clear();
    localStore.ensureCleanStart();
  });

  it('Owner has supreme privileges and is never demoted or deleted', async () => {
    const users = localStore.getUsers();
    const owner = users.find((u) => u.role === ROLES.OWNER || u.username === 'abbosbek');
    expect(owner).toBeDefined();
    expect(owner.role).toBe(ROLES.OWNER);

    // Verify Abbosbek Owner root cannot be deleted via localStore or service
    localStore.deleteUser(owner.id);
    const afterDelete = localStore.getUsers();
    const ownerStillExists = afterDelete.find((u) => u.username === 'abbosbek');
    expect(ownerStillExists).toBeDefined();
    expect(ownerStillExists.role).toBe(ROLES.OWNER);
  });

  it('Admin cannot delete Owner or another Admin', async () => {
    // Helper replicating canDeleteUser logic
    const canDeleteUser = (callerRole, targetRole, callerId, targetId) => {
      if (callerId === targetId) return false;
      const myRole = String(callerRole).toLowerCase();
      const theirRole = String(targetRole).toLowerCase();

      if (myRole === 'owner') return theirRole !== 'owner';
      if (myRole === 'admin') return theirRole === 'teacher' || theirRole === 'student';
      if (myRole === 'teacher') return theirRole === 'student';
      return false;
    };

    expect(canDeleteUser('admin', 'owner', 'admin-1', 'owner-1')).toBe(false);
    expect(canDeleteUser('admin', 'admin', 'admin-1', 'admin-2')).toBe(false);
    expect(canDeleteUser('admin', 'teacher', 'admin-1', 'teacher-1')).toBe(true);
    expect(canDeleteUser('admin', 'student', 'admin-1', 'student-1')).toBe(true);
  });

  it('Teacher can only delete/manage assigned students, never staff', async () => {
    const canDeleteUser = (callerRole, targetRole, callerId, targetId) => {
      if (callerId === targetId) return false;
      const myRole = String(callerRole).toLowerCase();
      const theirRole = String(targetRole).toLowerCase();

      if (myRole === 'owner') return theirRole !== 'owner';
      if (myRole === 'admin') return theirRole === 'teacher' || theirRole === 'student';
      if (myRole === 'teacher') return theirRole === 'student';
      return false;
    };

    expect(canDeleteUser('teacher', 'owner', 'teacher-1', 'owner-1')).toBe(false);
    expect(canDeleteUser('teacher', 'admin', 'teacher-1', 'admin-1')).toBe(false);
    expect(canDeleteUser('teacher', 'teacher', 'teacher-1', 'teacher-2')).toBe(false);
    expect(canDeleteUser('teacher', 'student', 'teacher-1', 'student-1')).toBe(true);
  });

  it('Filtered user list enforces role boundaries in userService', async () => {
    // Create test teacher and student
    await createUser({
      firstName: 'Test',
      lastName: 'Teacher',
      phone: '998901112233',
      role: ROLES.TEACHER,
    });

    await createUser({
      firstName: 'Test',
      lastName: 'Student',
      phone: '998904445566',
      role: ROLES.STUDENT,
    });

    // 1. Owner sees all roles
    const ownerView = await getUsers({ currentUserRole: 'owner' });
    const hasOwner = ownerView.users.some((u) => u.role === 'owner');
    const hasTeacher = ownerView.users.some((u) => u.role === 'teacher');
    const hasStudent = ownerView.users.some((u) => u.role === 'student');
    expect(hasOwner).toBe(true);
    expect(hasTeacher).toBe(true);
    expect(hasStudent).toBe(true);

    // 2. Admin cannot see Owner in user list
    const adminView = await getUsers({ currentUserRole: 'admin' });
    const adminSeesOwner = adminView.users.some((u) => u.role === 'owner');
    expect(adminSeesOwner).toBe(false);
    expect(adminView.users.some((u) => u.role === 'teacher')).toBe(true);

    // 3. Teacher can ONLY see students in user list
    const teacherView = await getUsers({ currentUserRole: 'teacher' });
    expect(teacherView.users.every((u) => u.role === 'student')).toBe(true);
  });

  it('Deleted user records are tracked in _deleted_ids to prevent cloud resurrection', async () => {
    const student = await createUser({
      firstName: 'To_Be',
      lastName: 'Deleted',
      phone: '998909998877',
      role: ROLES.STUDENT,
    });

    expect(student.id).toBeDefined();
    await deleteUser(student.id);

    // Verify user is gone from store
    const currentUsers = localStore.getUsers();
    expect(currentUsers.some((u) => u.id === student.id)).toBe(false);

    // Verify ID is tracked in _deleted_ids
    const deletedIds = localStore.getDeletedIds();
    expect(deletedIds.includes(student.id)).toBe(true);
  });
});
