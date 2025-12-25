"use strict";

const { query } = require("../config/db");
const { redisClient } = require("../config/redis");

class MachinesModel {
  static async create(machineData) {
    const {
      udi,
      product_id,
      type,
      air_temperature,
      process_temperature,
      rotational_speed,
      torque,
      tool_wear,
      target,
      failure_type,
    } = machineData;

    const sql = `
            INSERT INTO machines (udi, product_id, type, air_temperature, process_temperature, 
                                 rotational_speed, torque, tool_wear, target, failure_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

    const values = [
      udi,
      product_id,
      type,
      air_temperature,
      process_temperature,
      rotational_speed,
      torque,
      tool_wear,
      target || 0,
      failure_type || "No Failure",
    ];
    try {
      const result = await query(sql, values);

      await redisClient.del("machines:statistic");
      await redisClient.del("machine:latest:500");
      return result.rows[0];
    } catch (err) {
      console.log(err.message);
    }
  }

  static async findAll() {
    const sql = `SELECT DISTINCT ON (machine_id)
      machine_id,
      timestamp,
      type,
      air_temperature,
      process_temperature,
      rotational_speed,
      torque,
      tool_wear,
      tool_wear_hours,
      target,
      failure_type
    FROM
        machines
    ORDER BY
        machine_id,
        timestamp DESC`;
    const result = await query(sql);

    return result.rows;
  }

  static async findAllWithPagination(limit, offset) {
      const sql =
      `SELECT DISTINCT ON (machine_id)
    machine_id,
    timestamp,
    type,
    air_temperature,
    process_temperature,
    rotational_speed,
    torque,
    tool_wear,
    tool_wear_hours,
    target,
    failure_type FROM machines ORDER BY machine_id,
    timestamp DESC LIMIT $1 OFFSET $2`;

    const result = await query(sql, [limit, offset]);
    return result.rows;
  }

  static async getTotalCount() {
    const sql = "SELECT COUNT(DISTINCT machine_id) as count FROM machines";
    const result = await query(sql);
    return parseInt(result.rows[0].count);
  }

  static async findById(id) {
    const sql = `SELECT DISTINCT ON (machine_id)
      machine_id,
      timestamp,
      type,
      air_temperature,
      process_temperature,
      rotational_speed,
      torque,
      tool_wear,
      tool_wear_hours,
      target,
      failure_type
    FROM
        machines
        WHERE machine_id = $1
    ORDER BY
        machine_id,
        timestamp DESC`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

    /* 

  static async update(id, machineData) {
    const {
      machine_id,
      type,
      air_temperature,
      process_temperature,
      rotational_speed,
      torque,
      tool_wear,
      tool_wear_hours,
      target,
      failure_type
    } = machineData;

    const sql = `
            UPDATE machines 
            SET machine_id = $1, type = $2, air_temperature = $3,
                process_temperature = $4, rotational_speed = $5, torque = $6,
                tool_wear = $7, target = $8, failure_type = $9,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
            RETURNING *
        `;

    const values = [
      machine_id,
      timestamp,
      type,
      air_temperature,
      process_temperature,
      rotational_speed,
      torque,
      tool_wear,
      target,
      failure_type,
      udi,
    ];

    try {
      const result = await query(sql, values);

      await redisClient.del("machines:statistic");
      await redisClient.del("machine:latest:500");

      return result.rows[0];
    } catch (err) {
      console.log(err.message);
    }
  }

  static async delete(udi) {
    const sql = "DELETE FROM machines WHERE udi = $1 RETURNING *";
    try {
      const result = await query(sql, [udi]);

      await redisClient.del("machines:statistic");
      await redisClient.del("machine:latest:500");

      return result.rows[0];
    } catch (err) {
      console.log(err.message);
    }
  }
  
  */
  
  static async searchMachineByName(name) {
    const sql = `SELECT DISTINCT ON (machine_id)
      machine_id,
      timestamp,
      type,
      air_temperature,
      process_temperature,
      rotational_speed,
      torque,
      tool_wear,
      tool_wear_hours,
      target,
      failure_type
    FROM
        machines
        WHERE machine_id ILIKE $1
    ORDER BY
        machine_id,
        timestamp DESC`;

    try {
      const result = await query(sql, [`%${name}%`]);
      return result.rows;
    } catch (err) {
      console.log(err.message);
    }
  }

  static async searchMachineByNameWithPagination(name, limit, offset) {
    const sql =
      `SELECT DISTINCT ON (machine_id)
          machine_id,
          timestamp,
          type,
          air_temperature,
          process_temperature,
          rotational_speed,
          torque,
          tool_wear,
          tool_wear_hours,
          target,
          failure_type
      FROM machines WHERE machine_id ILIKE $1 ORDER BY
          machine_id,
          timestamp DESC LIMIT $2 OFFSET $3`;
    try {
      const result = await query(sql, [`%${name}%`, limit, offset]);
      return result.rows;
    }catch (err) {
      console.log(err.message);
    }
  }

  static async getCountBySeacrh(name) {
    const sql = `SELECT COUNT(DISTINCT machine_id) as count FROM machines WHERE machine_id ILIKE $1`;
    try {
      const result = await query(sql, [`%${name}%`]);
      return parseInt(result.rows[0].count);
    }catch (err) {
      console.log(err.message);
    }
  }

  static async findByType(type) {
    const sql =
      `SELECT DISTINCT ON (machine_id)
        machine_id,
        timestamp,
        type,
        air_temperature,
        process_temperature,
        rotational_speed,
        torque,
        tool_wear,
        tool_wear_hours,
        target,
        failure_type
      FROM
        machines WHERE type = $1
      ORDER BY
        machine_id,
        timestamp DESC`;

    const result = await query(sql, [type]);
    return result.rows;
  }

  static async findByTypeWithPagination(type, limit, offset) {
    const sql =
      `SELECT DISTINCT ON (machine_id)
          machine_id,
          timestamp,
          type,
          air_temperature,
          process_temperature,
          rotational_speed,
          torque,
          tool_wear,
          tool_wear_hours,
          target,
          failure_type
      FROM machines WHERE type = $1 ORDER BY
          machine_id,
          timestamp DESC LIMIT $2 OFFSET $3`;
    const result = await query(sql, [type, limit, offset]);
    return result.rows;
  }

  static async getCountByType(type) {
    const sql = "SELECT COUNT(DISTINCT machine_id) as count FROM machines WHERE type = $1";
    const result = await query(sql, [type]);
    return parseInt(result.rows[0].count);
  }

  static async findFailures() {
    const sql =
      `SELECT DISTINCT ON (machine_id)
          machine_id,
          timestamp,
          type,
          air_temperature,
          process_temperature,
          rotational_speed,
          torque,
          tool_wear,
          tool_wear_hours,
          target,
          failure_type
      FROM
        machines WHERE target = 1 
      ORDER BY
          machine_id,
          timestamp DESC`;
    const result = await query(sql);
    return result.rows;
  }

  static async findFailuresWithPagination(limit, offset) {
    const sql =
      `SELECT DISTINCT ON (machine_id)
          machine_id,
          timestamp,
          type,
          air_temperature,
          process_temperature,
          rotational_speed,
          torque,
          tool_wear,
          tool_wear_hours,
          target,
          failure_type
      FROM
        machines WHERE target = 1  ORDER BY machine_id, timestamp DESC LIMIT $1 OFFSET $2`;
    const result = await query(sql, [limit, offset]);
    return result.rows;
  }

  static async getFailuresCount() {
    const sql = "SELECT COUNT(DISTINCT machine_id) as count FROM machines WHERE target = 1";
    const result = await query(sql);
    return parseInt(result.rows[0].count);
  }

  static async findByFailureType(failureType) {
    const sql =
      `SELECT DISTINCT ON (machine_id)
          machine_id,
          timestamp,
          type,
          air_temperature,
          process_temperature,
          rotational_speed,
          torque,
          tool_wear,
          tool_wear_hours,
          target,
          failure_type
      FROM machines WHERE failure_type = $1 ORDER BY machine_id, timestamp DESC`;
    const result = await query(sql, [failureType]);
    return result.rows;
  }

  static async getLatest(limit = 500) {
    const CACHE_KEY = `machine:latest:${limit}`;
    const CACHE_EXPIRATION = 60;

    const sql = `SELECT DISTINCT ON (machine_id)
    machine_id,
    timestamp,
    type,
    air_temperature,
    process_temperature,
    rotational_speed,
    torque,
    tool_wear,
    tool_wear_hours,
    target,
    failure_type
  FROM machines ORDER BY machine_id,timestamp DESC LIMIT $1`;

    try {
      const cachedData = await redisClient.get(CACHE_KEY);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const result = await query(sql, [limit]);
      const rows = result.rows;

      if (rows && rows.length > 0) {
        await redisClient.setEx(CACHE_KEY, CACHE_EXPIRATION, JSON.stringify(rows));
      }

      return rows;
    } catch (err) {
      console.log(err.message);
    }

    try {
      const result = await query(sql, [limit]);
      await redisClient.setEx(CACHE_KEY, CACHE_EXPIRATION, JSON.stringify(result.rows));
      return result.rows;
    } catch (err) {
      console.log(err.message);
    }
  }

  static async getStatistics() {
    const CACHE_EXPIRATION = 3600;
    const CACHE_KEY = "machines:statistic";

    try {
      const cachedStats = await redisClient.get(CACHE_KEY);

      if(cachedStats) {
        return JSON.parse(cachedStats);
      }
    } catch (err) {
      console.log(err.message);
    }

    const sql = `WITH latest_records AS (
            SELECT DISTINCT ON (machine_id)
                air_temperature,
                process_temperature,
                rotational_speed,
                torque,
                tool_wear
            FROM
                machines
            ORDER BY
                machine_id,
                timestamp DESC -- Memilih record TERBARU untuk setiap mesin
        )
        SELECT
            (SELECT COUNT(DISTINCT machine_id) FROM machines) AS total_unique_machines,
            
            -- Kolom COUNT(DISTINCT...) yang sudah diperbaiki sebelumnya
            COUNT(DISTINCT CASE WHEN type = 'L' THEN machine_id END) AS type_l_count_unique,
            COUNT(DISTINCT CASE WHEN type = 'M' THEN machine_id END) AS type_m_count_unique,
            COUNT(DISTINCT CASE WHEN type = 'H' THEN machine_id END) AS type_h_count_unique,

            -- Rata-rata (AVG) dihitung HANYA dari 100 record terbaru
            AVG(lr.air_temperature) AS avg_air_temp,
            AVG(lr.process_temperature) AS avg_process_temp,
            AVG(lr.rotational_speed) AS avg_rotational_speed,
            AVG(lr.torque) AS avg_torque,
            AVG(lr.tool_wear) AS avg_tool_wear
        FROM
            machines
        CROSS JOIN -- Menggabungkan statistik COUNT dengan AVG dari CTE
            latest_records lr
        LIMIT 1;`;
    const result = await query(sql);
    return result.rows[0];

    try {
      await redisClient.setEx(
        CACHE_KEY,
        CACHE_EXPIRATION,
        JSON.stringify(stats)
      );
    } catch (err) {
      console.log(err.message);
    }
  }

  static async getLatestMachinesByProductId() {
    const sql = `
      SELECT DISTINCT ON (machine_id)
        id, machine_id, timestamp, type, air_temperature, 
        process_temperature, rotational_speed, torque, tool_wear, 
        tool_wear_hours, target
      FROM machines 
      ORDER BY machine_id, timestamp DESC
    `;
    const result = await query(sql);
    return result.rows;
  }

  // filter by status
  static async getLatestMachinesByFilterPagination(status, risk, limit, offset) {
    const sql = `
      SELECT
          m_latest.*,
          p.prediction,
          p.confidence,
          p.severity,
          p.overall_health_summary,
          p.diagnostics,
          p.anomalies,
          p.features
      FROM
          (
              SELECT DISTINCT ON (machine_id)
                  *
              FROM
                  machines
              ORDER BY
                  machine_id ASC,
                  timestamp DESC,
                  id DESC
          ) AS m_latest
      JOIN machine_predictions p 
          ON m_latest.machine_id = p.machine_id
      WHERE 
          p.${status} = $1 
      ORDER BY
          p.timestamp DESC
      LIMIT $2 OFFSET $3;
    `;

    try {
      const result = await query(sql, [risk, limit, offset]);
      return result.rows;
    }
    catch (err) {
      console.log(err.message);
    }
  };

  // count filter
  static async getLatestMachinesByFilterCount(status, risk) {
    const sql = `
    SELECT COUNT(*) as count
    FROM machine_predictions
    WHERE ${status} = $1
    `;
    try {
      const result = await query(sql, [risk]);
      return result.rows[0].count;
    } catch (err) {
      console.log(err.message);
    }
  };

  // get count prediction
  static async getCountPrediction(column, name) {
    const sql = `
      SELECT 
        ${column} AS ${name},
        COUNT(DISTINCT machine_id) AS count
      FROM 
        machine_predictions
      GROUP BY 
        ${column};
    `;

    try {
      const result = await query(sql);
      return result.rows;
    } catch (err) {
      console.log(err.message);
    }
  }

  // get count prediction
  static async getCountMachinePredict() {
    const sql = `
      SELECT 
        COUNT(DISTINCT machine_id)
      FROM machine_predictions;
    `;

    try {
      const result = await query(sql);
      return result.rows[0].count;
    } catch (err) {
      console.log(err.message);
    }
  }
}

module.exports = { MachinesModel };
