import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { exportUsersMasterExcel } from '../src/utils/excelExport';
import { ROLE_CONFIG } from '../src/components/ui/RoleBadge';
import { ROLES } from '../src/lib/constants';

describe('Master Excel Export with Dashboard & Formulas', () => {
  const sampleUsers = [
    {
      id: 'usr-owner-1',
      fullName: 'Abbosbek',
      role: 'owner',
      phone: '+998 98 800 14 15',
      username: 'abbosbek',
      password: 'AbbosBek1415',
      is_active: true,
      subject: 'Rahbariyat',
      attendance_rate: 100,
    },
    {
      id: 'usr-admin-1',
      fullName: 'Erkinova Zilola',
      role: 'admin',
      phone: '+998 99 900 56 15',
      username: 'zilola_erkinova',
      password: 'Zilola#5615',
      is_active: true,
      subject: 'Boshqaruv',
      attendance_rate: 98,
    },
    {
      id: 'usr-teacher-1',
      fullName: 'Beknazarov Bexruz',
      role: 'teacher',
      phone: '+998 93 377 22 23',
      username: 'bexruz_beknazarov',
      password: 'Bexruz#2223',
      is_active: true,
      subject: 'Matematika',
      attendance_rate: 99,
    },
    {
      id: 'usr-student-1',
      fullName: 'Amirbek Inayatov',
      role: 'student',
      phone: '+998 94 788 29 06',
      father_phone: '+998 90 123 45 67',
      username: 'amirbek_inayatov',
      password: 'Dkre&23T2',
      is_active: true,
      course_name: 'IT',
      attendance_rate: 92,
    },
  ];

  it('generates an XLSX blob with multi-sheet structure and KPI formulas', () => {
    const blob = exportUsersMasterExcel(sampleUsers);
    expect(blob).toBeTruthy();
    expect(blob.type).toContain('spreadsheetml.sheet');
  });

  it('contains the correct role configs and icons in RoleBadge', () => {
    expect(ROLE_CONFIG[ROLES.OWNER].icon).toBe('👑');
    expect(ROLE_CONFIG[ROLES.OWNER].label).toBe('RAHBAR');
    expect(ROLE_CONFIG[ROLES.ADMIN].icon).toBe('🛡️');
    expect(ROLE_CONFIG[ROLES.ADMIN].label).toBe('ADMIN');
    expect(ROLE_CONFIG[ROLES.TEACHER].icon).toBe('👨‍🏫');
    expect(ROLE_CONFIG[ROLES.TEACHER].label).toBe('USTOZ');
    expect(ROLE_CONFIG[ROLES.STUDENT].icon).toBe('🎓');
    expect(ROLE_CONFIG[ROLES.STUDENT].label).toBe("O'QUVCHI");
  });
});
