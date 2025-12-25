exports.up = (pgm) => {
  // Create Alert table
  pgm.createTable("alert", {
    id: { type: "serial", primaryKey: true },
    machine_id: {
      type: "varchar(20)",
      notNull: true,
    },
    type: {
      type: "varchar(100)",
      notNull: true,
    },
    severity: {
      type: "varchar(20)",
      notNull: true,
    },
    message: {
      type: "text",
      notNull: true,
    },
    data: {
      type: "jsonb",
    },
    resolved: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    resolved_at: {
      type: "timestamp",
      notNull: false,
    },
    resolved_by: {
      type: "varchar(100)",
      notNull: false,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint("alert", "alert_severity_check", {
    check: "severity IN ('low', 'medium', 'high', 'critical')",
  });

  // 3. Membuat Indexes
  pgm.createIndex("alert", "resolved", {
    name: "idx_alert_resolved",
  });

  pgm.createIndex("alert", ["machine_id", "resolved"], {
    name: "idx_alert_machine_resolved",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("alert");
};
