const pool = require("./db");

const createUsersTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            restaurantName VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'manager', 'chef', 'inventory_staff') DEFAULT 'admin',
            created_by INT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
    `);
    console.log("✅ Users table ready");
};

const createIngredientsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ingredients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL, -- Added ownership
            name VARCHAR(255) NOT NULL,
            unit VARCHAR(50),
            current_stock DECIMAL(10,2) DEFAULT 0,
            threshold_value DECIMAL(10,2) DEFAULT 0,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ingredient_name (name),
            INDEX idx_ingredient_user (user_id), -- Added for fast user-specific inventory lookups
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- Data Consistency
        )
    `);
    console.log("✅ Ingredients table ready");
};

const createRecipesTables = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS recipes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL, -- Added ownership
            name VARCHAR(255) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_recipe_name (name),
            INDEX idx_recipe_user (user_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS recipe_ingredients (
            recipe_id INT,
            ingredient_id INT,
            quantity_required DECIMAL(10,2),
            PRIMARY KEY (recipe_id, ingredient_id),
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
        )
    `);
    console.log("✅ Recipes & Junction tables ready");
};

const createLogsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL, -- Added ownership
            type ENUM('consumption', 'waste') NOT NULL,
            ingredient_id INT,
            recipe_id INT NULL,
            quantity DECIMAL(10,2),
            reason TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL, -- Keep logs if ingredient is deleted, but user deletion wipes all
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL,
            INDEX idx_logs_user_created (user_id, created_at), -- Composite index for user reports
            INDEX idx_logs_type (type)
        )
    `);
    console.log("✅ Logs table ready");
};

const createNotificationsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL, -- Added ownership
            ingredient_id INT NOT NULL,
            type ENUM('low_stock', 'out_of_stock') NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
            UNIQUE KEY unique_notification (ingredient_id, type),
            INDEX idx_notifications_user_read (user_id, is_read) -- Faster badge counts for specific users
        )
    `);
    console.log("✅ Notifications table ready");
};

const createBatchTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ingredient_batches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            ingredient_id INT NOT NULL,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
            expiry_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
            
            INDEX idx_user_id (user_id),
            INDEX idx_ingredient_id (ingredient_id),
            INDEX idx_batch_ingredient (ingredient_id),
            INDEX idx_batch_expiry (expiry_date),
            INDEX idx_user_expiry (user_id, expiry_date),
            CONSTRAINT fk_batch_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
            CONSTRAINT fk_batch_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE        
        )`
    );
    console.log("✅ Ingredient Batches table ready");
}


const getAllTables = async () => {
    const test = await pool.query(`
        SELECT * FROM information_schema.tables WHERE table_schema = 'defaultdb'
    `);
    console.log("✅ All tables retrieved", test);
};

const deleteAllTables = async () => {
    const test = await pool.query(`
        DROP TABLE IF EXISTS ingredient_batches, logs, notifications, recipe_ingredients, recipes, ingredients, users
    `);
    console.log("✅ All tables deleted", test);
};

const migrateUsersTable = async () => {
    // Shrink ENUM to remove viewer + ensure created_by exists
    await pool.query(`
        ALTER TABLE users
        MODIFY COLUMN role ENUM('admin','manager','chef','inventory_staff') NOT NULL DEFAULT 'admin'
    `).catch(() => {});

    const [cols] = await pool.query(`
        SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'created_by'
    `);
    if (cols.length === 0) {
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN created_by INT NULL,
            ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log("✅ users.created_by column added");
    }
};

// MASTER RUNNER
const setupDatabase = async () => {
    try {
        console.log("--- Starting Sequential Setup ---");

        await createUsersTable();
        await createIngredientsTable();
        await createRecipesTables();
        await createLogsTable();
        await createNotificationsTable();
        await createBatchTable();

        console.log("🚀 Database fully initialized and secured!");
    } catch (err) {
        console.error("❌ Setup Failed:", err.message);
    }
};

module.exports = { setupDatabase };