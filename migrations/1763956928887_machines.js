/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
// export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.createTable('machines', {
        id: {
            type: 'SERIAL',
            notNull: true,
            primaryKey: true,
        },
        machine_id: {
            type: "varchar(10)",
            notNull: true
        },
        timestamp: {
            type: 'TIMESTAMP WITH TIME ZONE',
            notNull: true
        },
        type: {
            type: 'CHAR(1)',
            notNull: true
        },
        air_temperature: {
            type: 'NUMERIC(5,2)',
            notNull: true
        },
        process_temperature: {
            type: 'NUMERIC(5,2)',
            notNull: true
        },
        rotational_speed: {
            type: 'INTEGER',
            notNull: true
        },
        torque: {
            type: 'NUMERIC(5,2)',
            notNull: true
        },
        tool_wear: {
            type: 'INTEGER',
            notNull: true
        },
        tool_wear_hours:  {
            type: "integer",
            notNull: true,
        },
        target: {
            type: 'SMALLINT',
            notNull: true
        },
        failure_type: {
            type: 'VARCHAR(50)',
            notNull: true
        }
    })

    pgm.createIndex('machines', ['machine_id']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('machines');
};
