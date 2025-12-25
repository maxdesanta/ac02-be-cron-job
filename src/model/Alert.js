const { query } = require("../config/db");

class Alert {
  static async create(alertData) {
    const { machine_id, type, severity, message, data } = alertData;

    const sql = `
            INSERT INTO alert (machine_id, type, severity, message, data)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

    const values = [
      machine_id,
      type,
      severity,
      message,
      JSON.stringify(data || {}),
    ];

    console.log(`[8] DB: Executing INSERT INTO alert for machine: ${machine_id}`);
    console.log(`[8] DB: SQL values preview: [${values[0]}, ${values[1]}, ${values[2]}]...`);
    
    const result = await query(sql, values);

    console.log(`[9] DB: Insert successful. Rows affected: ${result.rowCount}`);
    
    return result.rows[0];
  }

  static async findAll() {
    const sql = "SELECT * FROM alert ORDER BY created_at DESC";
    const result = await query(sql);
    return result.rows;
  }

  static async findAllSummary() {
    const sql = `
      SELECT 
        id, 
        machine_id, 
        type, 
        severity, 
        CASE 
          WHEN LENGTH(message) > 150 THEN SUBSTRING(message FROM 1 FOR 150) || '...'
          ELSE message 
        END as message_preview,
        created_at
      FROM alert 
      WHERE resolved = false
      ORDER BY created_at DESC
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async findById(id) {
    const sql = "SELECT * FROM alert WHERE id = $1";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByMachineId(udi) {
    const sql = `
            SELECT * FROM alert 
            WHERE machine_id = $1 
            ORDER BY created_at DESC
        `;
    const result = await query(sql, [udi]);
    return result.rows;
  }

  // Backward compatibility method
  static async findByEngineId(udi) {
    return this.findByMachineId(udi);
  }

  static async findBySeverity(severity) {
    const sql =
      "SELECT * FROM alert WHERE severity = $1 ORDER BY created_at DESC";
    const result = await query(sql, [severity]);
    return result.rows;
  }

  static async findUnresolved() {
    const sql =
      "SELECT * FROM alert WHERE resolved = false ORDER BY created_at DESC";
    const result = await query(sql);
    return result.rows;
  }

  static async markAsResolved(id, resolvedBy = null) {
    const sql = `
      UPDATE alert 
      SET resolved = true, 
          resolved_at = NOW(), 
          resolved_by = $2
      WHERE id = $1 
      RETURNING *
    `;
    const result = await query(sql, [id, resolvedBy]);
    return result.rows[0];
  }

  static async update(id, alertData) {
    const { type, severity, message, data } = alertData;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (type !== undefined) {
      updates.push(`type = $${paramCount}`);
      values.push(type);
      paramCount++;
    }
    if (severity !== undefined) {
      updates.push(`severity = $${paramCount}`);
      values.push(severity);
      paramCount++;
    }
    if (message !== undefined) {
      updates.push(`message = $${paramCount}`);
      values.push(message);
      paramCount++;
    }
    if (data !== undefined) {
      updates.push(`data = $${paramCount}`);
      values.push(JSON.stringify(data));
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);
    const sql = `
            UPDATE alert 
            SET ${updates.join(", ")}
            WHERE id = $${paramCount}
            RETURNING *
        `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = "DELETE FROM alert WHERE id = $1 RETURNING *";
    const result = await query(sql, [id]);
    return result.rows[0];
  }
}

module.exports = Alert;
