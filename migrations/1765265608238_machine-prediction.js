/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.createTable('machine_predictions', {
        id: {
            type: 'serial',
            primaryKey: true
        },
        machine_id: {
            type: 'id',
            notNull: true,
            references: 'machines',
            onDelete: 'CASCADE'
        },
        timestamp: {
            type: 'timestamptz',
            notNull: true
        },
        prediction: {
            type: 'varchar(50)',
            notNull: true
        },
        confidence: {
            type: 'numeric',
            notNull: true
        },
        severity: {
            type: 'varchar(50)',
            notNull: true
        },
        overall_health_summary: {
            type: 'text'
        },
        diagnostics: {
            type: 'jsonb'
        },
        anomalies: {
            type: 'jsonb'
        },
        features_data: {
            type: 'jsonb'
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    })

    pgm.createIndex('machine_predictions', 'machine_id');
    pgm.createIndex('machine_predictions', 'severity');
    pgm.createIndex('machine_predictions', ['diagnostics'], { method: 'gin' });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('machine_predictions');
};
