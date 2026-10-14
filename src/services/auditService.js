import { supabase } from '@/lib/supabase';

/**
 * Creates an audit log entry in Supabase.
 * @param {string} action - e.g. 'CREATE_RULE', 'MARK_PAID', 'UPDATE_SETTINGS'
 * @param {string} target - Resource name or ID e.g. 'payroll', 'student:123'
 * @param {Object|string} details - Additional metadata or JSON payload
 */
export async function createAuditLog(action, target, details = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      action,
      target,
      details: typeof details === 'object' ? details : { info: details },
      user_id: user?.id || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('auditService: Supabase insert warning:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('auditService createAuditLog exception:', err.message);
    return null;
  }
}

/**
 * Fetches audit logs with filtering and pagination.
 * @param {Object} filters
 * @param {string} [filters.action]
 * @param {string} [filters.userId]
 * @param {string} [filters.search]
 * @param {string} [filters.startDate]
 * @param {string} [filters.endDate]
 * @param {boolean} [filters.excludePayroll=false] - If true (e.g. for Admin role), excludes payroll logs
 * @param {number} [filters.page=1]
 * @param {number} [filters.pageSize=20]
 */
export async function getAuditLogs(filters = {}) {
  const {
    action,
    userId,
    search,
    startDate,
    endDate,
    excludePayroll = false,
    page = 1,
    pageSize = 20,
  } = filters;

  try {
    let query = supabase
      .from('audit_logs')
      .select('*, profiles:user_id(id, full_name, email, role, avatar_url)', { count: 'exact' });

    if (excludePayroll) {
      // Admin sees non-payroll actions
      query = query.not('target', 'ilike', '%payroll%')
                   .not('action', 'ilike', '%payroll%')
                   .not('action', 'ilike', '%salary%');
    }

    if (action && action !== 'ALL') {
      query = query.eq('action', action);
    }

    if (userId && userId !== 'ALL') {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`action.ilike.${term},target.ilike.${term}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      // Fallback if table is not yet populated
      console.warn('auditService: Error fetching audit_logs:', error.message);
      return { logs: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      logs: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (err) {
    console.error('getAuditLogs error:', err);
    return { logs: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

export default {
  createAuditLog,
  getAuditLogs,
};
