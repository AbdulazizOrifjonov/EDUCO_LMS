/**
 * Schedule parsing and conflict detection utility for Educo LMS.
 * Supports multi-group student enrollments, timetable clash detection, and free-time matching.
 */

/**
 * Parses schedule strings like:
 * - "Dush-Chor-Jum, 09:30 - 11:00"
 * - "Sesh-Pay-Shan, 14:00 - 15:30"
 * - "Dushanba, Chorshanba, Juma 18:00 - 20:00"
 * - "Har kuni, 08:00 - 09:30"
 * Returns active days of the week and minutes from midnight for start and end times.
 */
export function parseSchedule(scheduleStr) {
  if (!scheduleStr) return null;
  const s = String(scheduleStr).toLowerCase().trim();
  const days = [];

  // Match days in Uzbek, Russian, and English
  if (s.includes('dush') || s.includes('пн') || s.includes('пон') || s.includes('mon')) days.push('mon');
  if (s.includes('sesh') || s.includes('вт') || s.includes('tue')) days.push('tue');
  if (s.includes('chor') || s.includes('ср') || s.includes('wed')) days.push('wed');
  if (s.includes('pay') || s.includes('чт') || s.includes('чет') || s.includes('thu')) days.push('thu');
  if (s.includes('jum') || s.includes('пт') || s.includes('пят') || s.includes('fri')) days.push('fri');
  if (s.includes('shan') || s.includes('сб') || s.includes('суб') || s.includes('sat')) days.push('sat');
  if (s.includes('yak') || s.includes('вс') || s.includes('вос') || s.includes('sun')) days.push('sun');

  if (s.includes('har kuni') || s.includes('каждый день') || s.includes('everyday')) {
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].forEach((d) => {
      if (!days.includes(d)) days.push(d);
    });
  }

  // Extract start and end time (e.g., 09:30 - 11:00)
  const timeMatch = s.match(/(\d{1,2})[:.](\d{2})\s*[-—–]\s*(\d{1,2})[:.](\d{2})/);
  let startMin = null;
  let endMin = null;
  if (timeMatch) {
    startMin = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
    endMin = parseInt(timeMatch[3], 10) * 60 + parseInt(timeMatch[4], 10);
  }

  return { days, startMin, endMin, raw: scheduleStr };
}

/**
 * Checks whether two lesson schedules conflict (overlap in days and hours).
 */
export function hasScheduleConflict(sched1, sched2) {
  const p1 = parseSchedule(sched1);
  const p2 = parseSchedule(sched2);
  if (!p1 || !p2) return false;

  // Check if they share any day
  const sharedDays = p1.days.filter((d) => p2.days.includes(d));
  if (sharedDays.length === 0) return false;

  // If time is defined on both, check interval overlap: max(start1, start2) < min(end1, end2)
  if (p1.startMin !== null && p1.endMin !== null && p2.startMin !== null && p2.endMin !== null) {
    return Math.max(p1.startMin, p2.startMin) < Math.min(p1.endMin, p2.endMin);
  }

  // If days overlap but exact hours cannot be parsed, conservatively flag potential overlap
  return true;
}

/**
 * Evaluates a candidate group's schedule against all currently enrolled groups of a student.
 * Returns whether there is a conflict, which group it conflicts with, and if it's during free time.
 */
export function getScheduleConflictDetails(targetGroup, enrolledGroups = []) {
  if (!targetGroup) {
    return { hasConflict: false, conflictingGroup: null, conflictMessage: null, isFreeTime: false };
  }

  const targetSched = targetGroup.schedule || targetGroup.schedule_time || `${targetGroup.schedule_days || ''} ${targetGroup.time || ''}`;
  if (!targetSched || enrolledGroups.length === 0) {
    return { hasConflict: false, conflictingGroup: null, conflictMessage: null, isFreeTime: enrolledGroups.length > 0 };
  }

  for (const enrolled of enrolledGroups) {
    // Skip if comparing against itself
    if (enrolled.id === targetGroup.id) continue;

    const enrolledSched = enrolled.schedule || enrolled.schedule_time || `${enrolled.schedule_days || ''} ${enrolled.time || ''}`;
    if (hasScheduleConflict(targetSched, enrolledSched)) {
      return {
        hasConflict: true,
        conflictingGroup: enrolled,
        conflictMessage: `«${enrolled.name}» (${enrolledSched || 'darsi'}) bilan to‘qnashadi`,
        isFreeTime: false,
      };
    }
  }

  return {
    hasConflict: false,
    conflictingGroup: null,
    conflictMessage: null,
    isFreeTime: true,
  };
}
