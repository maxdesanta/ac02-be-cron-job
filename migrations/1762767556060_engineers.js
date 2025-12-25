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
    pgm.createTable('engineers', {
        id: 'id',
        username: {
            type: 'VARCHAR(50)',
            notNull: true,
            unique: true,
        },
        email: {
            type: 'VARCHAR(50)',
            notNull: true,
            unique: true,
        },
        password: {
            type: 'VARCHAR(100)',
            notNull: true,
        },
    })
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('engineers');
};
