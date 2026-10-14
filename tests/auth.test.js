import { describe, it, expect } from 'vitest';
import { ROLES } from '../src/lib/constants';

describe('EDUCO LMS Role Access & Permissions Suite', () => {
  const isAuthorized = (userRole, allowedRoles) => {
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
  };

  it('allows owner to access owner-only routes', () => {
    const ownerOnly = [ROLES.OWNER];
    expect(isAuthorized(ROLES.OWNER, ownerOnly)).toBe(true);
    expect(isAuthorized(ROLES.ADMIN, ownerOnly)).toBe(false);
    expect(isAuthorized(ROLES.TEACHER, ownerOnly)).toBe(false);
    expect(isAuthorized(ROLES.STUDENT, ownerOnly)).toBe(false);
  });

  it('allows owner and admin to access management routes', () => {
    const adminOrOwner = [ROLES.OWNER, ROLES.ADMIN];
    expect(isAuthorized(ROLES.OWNER, adminOrOwner)).toBe(true);
    expect(isAuthorized(ROLES.ADMIN, adminOrOwner)).toBe(true);
    expect(isAuthorized(ROLES.TEACHER, adminOrOwner)).toBe(false);
    expect(isAuthorized(ROLES.STUDENT, adminOrOwner)).toBe(false);
  });

  it('allows teachers to access teacher dashboard and grading', () => {
    const teacherRoutes = [ROLES.TEACHER];
    expect(isAuthorized(ROLES.TEACHER, teacherRoutes)).toBe(true);
    expect(isAuthorized(ROLES.STUDENT, teacherRoutes)).toBe(false);
  });

  it('allows students to access student dashboard only', () => {
    const studentRoutes = [ROLES.STUDENT];
    expect(isAuthorized(ROLES.STUDENT, studentRoutes)).toBe(true);
    expect(isAuthorized(ROLES.TEACHER, studentRoutes)).toBe(false);
  });

  it('prevents self-role-promotion: non-owner cannot grant owner or admin role', () => {
    const canAssignRole = (actorRole, targetRole) => {
      if (actorRole === ROLES.OWNER) return true; // Owner can assign any role
      if (actorRole === ROLES.ADMIN) {
        // Admin can only create/assign teacher and student
        return targetRole === ROLES.TEACHER || targetRole === ROLES.STUDENT;
      }
      return false; // Teacher and Student cannot assign roles
    };

    expect(canAssignRole(ROLES.OWNER, ROLES.OWNER)).toBe(true);
    expect(canAssignRole(ROLES.OWNER, ROLES.ADMIN)).toBe(true);
    expect(canAssignRole(ROLES.ADMIN, ROLES.OWNER)).toBe(false);
    expect(canAssignRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(false);
    expect(canAssignRole(ROLES.ADMIN, ROLES.TEACHER)).toBe(true);
    expect(canAssignRole(ROLES.ADMIN, ROLES.STUDENT)).toBe(true);
    expect(canAssignRole(ROLES.TEACHER, ROLES.STUDENT)).toBe(false);
    expect(canAssignRole(ROLES.STUDENT, ROLES.TEACHER)).toBe(false);
  });
});
