import { Router } from 'express';

const ALLOWED_TABLES = new Set([
  'profiles',
  'user_roles',
  'projects',
  'project_assignments',
  'employee_profiles',
  'employee_profile_drafts',
  'leave_balances',
  'leave_requests',
  'drivers',
  'vehicles',
  'driver_availability',
  'vehicle_maintenance',
  'trip_requests',
  'trip_templates',
  'kpis',
  'kpi_values',
  'weekly_targets',
  'weekly_tasks',
  'task_submissions',
  'task_evaluations',
  'task_conversations',
  'conversation_participants',
  'notifications',
  'role_audit_log',
  'security_events',
  'external_trainings',
  'internal_trainings',
  'internal_training_attendees',
  'employee_certifications',
  'staff_requests',
  'field_activity_reports',
  'conversation_summaries',
  'kpi_gaps',
]);

const READ_ONLY_VIEWS = new Set([
  'conversation_summaries',
  'kpi_gaps',
]);

function quoteIdent(name) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  return `"${name}"`;
}

function parseFilters(query) {
  const filters = [];
  const values = [];
  let order = null;
  let limit = null;
  let offset = null;
  let select = '*';
  let count = false;

  for (const [key, raw] of Object.entries(query)) {
    if (key === 'select') {
      select = String(raw);
      continue;
    }
    if (key === 'order') {
      order = String(raw);
      continue;
    }
    if (key === 'limit') {
      limit = Number(raw);
      continue;
    }
    if (key === 'offset') {
      offset = Number(raw);
      continue;
    }
    if (key === 'count') {
      count = raw === 'exact' || raw === 'true';
      continue;
    }
    if (key === 'single' || key === 'maybeSingle' || key === 'head') {
      continue;
    }

    const value = Array.isArray(raw) ? raw[raw.length - 1] : String(raw);

    if (key === 'or') {
      // Simple PostgREST or: col.op.val,col.op.val
      const parts = String(value).split(',').map((p) => p.trim()).filter(Boolean);
      const orClauses = [];
      for (const part of parts) {
        const m = part.match(/^([a-z_]+)\.(eq|neq|gt|gte|lt|lte|like|ilike|is|not\.is)\.(.*)$/i);
        if (!m) continue;
        const [, col, op, operand] = m;
        if (op === 'is' && operand === 'null') {
          orClauses.push(`${quoteIdent(col)} IS NULL`);
          continue;
        }
        if (op === 'not.is' && operand === 'null') {
          orClauses.push(`${quoteIdent(col)} IS NOT NULL`);
          continue;
        }
        const sqlOp = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=', like: 'LIKE', ilike: 'ILIKE' }[op];
        if (!sqlOp) continue;
        values.push(operand);
        orClauses.push(`${quoteIdent(col)} ${sqlOp} $${values.length}`);
      }
      if (orClauses.length) {
        filters.push(`(${orClauses.join(' OR ')})`);
      }
      continue;
    }

    const match = value.match(/^(eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|not\.in|not\.is)\.(.*)$/s);
    if (!match) {
      values.push(value);
      filters.push(`${quoteIdent(key)} = $${values.length}`);
      continue;
    }

    const [, op, operand] = match;
    if (op === 'is') {
      if (operand === 'null') {
        filters.push(`${quoteIdent(key)} IS NULL`);
      } else if (operand === 'true') {
        filters.push(`${quoteIdent(key)} IS TRUE`);
      } else if (operand === 'false') {
        filters.push(`${quoteIdent(key)} IS FALSE`);
      }
      continue;
    }

    if (op === 'not.is') {
      if (operand === 'null') {
        filters.push(`${quoteIdent(key)} IS NOT NULL`);
      }
      continue;
    }

    if (op === 'in' || op === 'not.in') {
      const list = operand.replace(/^\(|\)$/g, '').split(',').map((s) => s.trim()).filter(Boolean);
      const placeholders = list.map((item) => {
        values.push(item);
        return `$${values.length}`;
      });
      const clause = `${quoteIdent(key)} ${op === 'not.in' ? 'NOT IN' : 'IN'} (${placeholders.join(', ')})`;
      filters.push(clause);
      continue;
    }

    if (op === 'cs') {
      values.push(operand.replace(/^\{|\}$/g, '').split(','));
      filters.push(`${quoteIdent(key)} @> $${values.length}::text[]`);
      continue;
    }

    const sqlOp = {
      eq: '=',
      neq: '<>',
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      like: 'LIKE',
      ilike: 'ILIKE',
    }[op];

    values.push(operand);
    filters.push(`${quoteIdent(key)} ${sqlOp} $${values.length}`);
  }

  return { filters, values, order, limit, offset, select, count };
}

function buildSelectList(select) {
  if (!select || select === '*') return '*';
  // Support simple comma lists and nested resource hints by stripping joins for now
  // Nested selects not supported; use flat column lists
  // e.g. "*" not "*, entries:child_table(*)"
  if (select.includes(':') || select.includes('(')) {
    return '*';
  }
  return select
    .split(',')
    .map((part) => quoteIdent(part.trim()))
    .join(', ');
}

function buildOrder(order) {
  if (!order) return '';
  const parts = order.split(',').map((chunk) => {
    const [col, dir] = chunk.split('.');
    const direction = dir === 'desc' ? 'DESC' : 'ASC';
    return `${quoteIdent(col)} ${direction}`;
  });
  return ` ORDER BY ${parts.join(', ')}`;
}

export function createTableRouter(pool) {
  const router = Router();

  router.get('/:table', async (req, res) => {
    const table = req.params.table;
    if (!ALLOWED_TABLES.has(table)) {
      return res.status(400).json({ error: `Unknown table: ${table}` });
    }

    try {
      const { filters, values, order, limit, offset, select, count } = parseFilters(req.query);
      const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
      const selectList = buildSelectList(select);

      if (count) {
        const countSql = `SELECT COUNT(*)::int AS count FROM ${quoteIdent(table)}${where}`;
        const countResult = await pool.query(countSql, values);
        const total = countResult.rows[0].count;
        res.set('x-total-count', String(total));
        res.set('content-range', `*/${total}`);

        if (req.query.head === 'true') {
          return res.json([]);
        }
      }

      let sql = `SELECT ${selectList} FROM ${quoteIdent(table)}${where}${buildOrder(order)}`;
      const queryValues = [...values];
      if (limit != null && !Number.isNaN(limit)) {
        queryValues.push(limit);
        sql += ` LIMIT $${queryValues.length}`;
      }
      if (offset != null && !Number.isNaN(offset)) {
        queryValues.push(offset);
        sql += ` OFFSET $${queryValues.length}`;
      }

      const { rows } = await pool.query(sql, queryValues);

      if (req.query.single === 'true' || req.headers.accept?.includes('vnd.pgrst.object')) {
        if (!rows[0]) return res.status(406).json({ error: 'No rows' });
        return res.json(rows[0]);
      }
      if (req.query.maybeSingle === 'true') {
        return res.json(rows[0] ?? null);
      }

      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:table', async (req, res) => {
    const table = req.params.table;
    if (!ALLOWED_TABLES.has(table) || READ_ONLY_VIEWS.has(table)) {
      return res.status(400).json({ error: `Cannot insert into: ${table}` });
    }

    try {
      const payload = Array.isArray(req.body) ? req.body : [req.body];
      if (!payload.length) return res.status(400).json({ error: 'Empty body' });

      const keys = Object.keys(payload[0]);
      if (!keys.length) return res.status(400).json({ error: 'Empty object' });

      const cols = keys.map(quoteIdent).join(', ');
      const allValues = [];
      const rowPlaceholders = payload.map((row) => {
        const placeholders = keys.map((key) => {
          allValues.push(row[key]);
          return `$${allValues.length}`;
        });
        return `(${placeholders.join(', ')})`;
      });

      const sql = `INSERT INTO ${quoteIdent(table)} (${cols}) VALUES ${rowPlaceholders.join(', ')} RETURNING *`;
      const { rows } = await pool.query(sql, allValues);

      if (req.query.single === 'true' || !Array.isArray(req.body)) {
        return res.status(201).json(rows[0]);
      }
      res.status(201).json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.patch('/:table', async (req, res) => {
    const table = req.params.table;
    if (!ALLOWED_TABLES.has(table) || READ_ONLY_VIEWS.has(table)) {
      return res.status(400).json({ error: `Cannot update: ${table}` });
    }

    try {
      const { filters, values } = parseFilters(req.query);
      if (!filters.length) {
        return res.status(400).json({ error: 'Update requires filters' });
      }

      const data = req.body || {};
      const keys = Object.keys(data);
      if (!keys.length) return res.status(400).json({ error: 'Empty body' });

      const sets = keys.map((key) => {
        values.push(data[key]);
        return `${quoteIdent(key)} = $${values.length}`;
      });

      // Move filter values after set values — rebuild carefully
      const setValues = keys.map((k) => data[k]);
      const filterParsed = parseFilters(req.query);
      const allValues = [...setValues, ...filterParsed.values];
      const setClauses = keys.map((key, i) => `${quoteIdent(key)} = $${i + 1}`);
      const whereClauses = filterParsed.filters.map((f) => {
        // rewrite $n placeholders to continue after set values
        return f.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + setValues.length}`);
      });

      if (keys.includes('updated_at') === false) {
        // best-effort touch updated_at when column exists — ignore failures via try
      }

      const sql = `UPDATE ${quoteIdent(table)} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`;
      const { rows } = await pool.query(sql, allValues);

      if (req.query.single === 'true' || req.query.maybeSingle === 'true') {
        return res.json(rows[0] ?? null);
      }
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:table', async (req, res) => {
    const table = req.params.table;
    if (!ALLOWED_TABLES.has(table) || READ_ONLY_VIEWS.has(table)) {
      return res.status(400).json({ error: `Cannot delete from: ${table}` });
    }

    try {
      const { filters, values } = parseFilters(req.query);
      if (!filters.length) {
        return res.status(400).json({ error: 'Delete requires filters' });
      }
      const sql = `DELETE FROM ${quoteIdent(table)} WHERE ${filters.join(' AND ')} RETURNING *`;
      const { rows } = await pool.query(sql, values);
      if (req.query.single === 'true' || req.query.maybeSingle === 'true') {
        return res.json(rows[0] ?? null);
      }
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
