import React from 'react';
import { useTranslation } from 'react-i18next';
import Badge from './Badge';
import { ATTENDANCE_STATUSES } from '@/lib/constants';

export default function StatusBadge({
  status,
  type = 'attendance',
  score,
  size = 'md',
  className = '',
}) {
  const { t } = useTranslation();

  if (type === 'attendance') {
    switch (status) {
      case ATTENDANCE_STATUSES.PRESENT:
      case 'present':
        return (
          <Badge variant="success" size={size} dot className={className}>
            {t('attendance.present', 'Present')}
          </Badge>
        );
      case ATTENDANCE_STATUSES.ABSENT:
      case 'absent':
        return (
          <Badge variant="danger" size={size} dot className={className}>
            {t('attendance.absent', 'Absent')}
          </Badge>
        );
      case ATTENDANCE_STATUSES.LATE:
      case 'late':
        return (
          <Badge variant="warning" size={size} dot className={className}>
            {t('attendance.late', 'Late')}
          </Badge>
        );
      case ATTENDANCE_STATUSES.EXCUSED:
      case 'excused':
        return (
          <Badge variant="info" size={size} dot className={className}>
            {t('attendance.excused', 'Excused')}
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size={size} dot className={className}>
            {status || t('common.unknown', 'Unknown')}
          </Badge>
        );
    }
  }

  if (type === 'grade') {
    const numericScore = typeof score === 'number' ? score : parseFloat(status);
    let variant = 'default';

    if (!isNaN(numericScore)) {
      if (numericScore >= 90) variant = 'success';
      else if (numericScore >= 75) variant = 'primary';
      else if (numericScore >= 60) variant = 'warning';
      else variant = 'danger';
    }

    return (
      <Badge variant={variant} size={size} className={className}>
        {score !== undefined ? `${score}%` : status}
      </Badge>
    );
  }

  // Generic status (active, inactive, pending, archived)
  switch (status?.toLowerCase()) {
    case 'active':
    case 'paid':
    case 'completed':
    case 'approved':
      return (
        <Badge variant="success" size={size} dot className={className}>
          {t(`status.${status}`, status)}
        </Badge>
      );
    case 'pending':
    case 'in_progress':
      return (
        <Badge variant="warning" size={size} dot className={className}>
          {t(`status.${status}`, status)}
        </Badge>
      );
    case 'inactive':
    case 'failed':
    case 'rejected':
    case 'suspended':
      return (
        <Badge variant="danger" size={size} dot className={className}>
          {t(`status.${status}`, status)}
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size={size} className={className}>
          {status}
        </Badge>
      );
  }
}
