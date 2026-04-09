const pool = require("./db");

const createUsersTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            restaurantName VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin') DEFAULT 'admin',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            -- No extra indexes needed here. 'PRIMARY KEY' and 'UNIQUE' (on email) automatically create the necessary indexes.
        )
    `);
    console.log("✅ Users table ready");
};

const createIngredientsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ingredients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            unit VARCHAR(50),
            current_stock DECIMAL(10,2) DEFAULT 0,
            threshold_value DECIMAL(10,2) DEFAULT 0,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ingredient_name (name) -- Added index to speed up searching/dropdowns for ingredients
        )
    `);
    console.log("✅ Ingredients table ready");
};

const createRecipesTables = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS recipes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_recipe_name (name) -- Added index to speed up searching for recipes
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
            -- No extra indexes needed. MySQL automatically indexes Foreign Keys and the Primary Key combo.
        )
    `);
    console.log("✅ Recipes & Junction tables ready");
};

const createLogsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            type ENUM('consumption', 'waste') NOT NULL,
            ingredient_id INT,
            recipe_id INT NULL,
            quantity DECIMAL(10,2),
            reason TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
            FOREIGN KEY (recipe_id) REFERENCES recipes(id),
            INDEX idx_logs_created_at (created_at), -- Added index for generating daily/monthly reports fast
            INDEX idx_logs_type (type) -- Added index for quickly filtering waste vs consumption
        )
    `);
    console.log("✅ Logs table ready");
};

const createNotificationsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ingredient_id INT NOT NULL,
            type ENUM('low_stock', 'out_of_stock') NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
            UNIQUE KEY unique_notification (ingredient_id, type),
            INDEX idx_notifications_is_read (is_read) -- Added index to instantly fetch unread notifications for the UI badge
        )
    `);
    console.log("✅ Notifications table ready");
};

const getAllTables = async () => {
    const test = await pool.query(`
        SELECT * FROM information_schema.tables WHERE table_schema = 'defaultdb'
    `);
    console.log("✅ All tables retrieved", test);
};

const deleteAllTables = async () => {
    const test = await pool.query(`
        DROP TABLE IF EXISTS logs, notifications, recipe_ingredients, recipes, ingredients, users
    `);
    console.log("✅ All tables deleted", test);
};

// MASTER RUNNER
const setupDatabase = async () => {
    try {
        console.log("--- Starting Sequential Setup ---");
        
        // Order matters for Foreign Keys!
        await createUsersTable();
        await createIngredientsTable(); 
        await createRecipesTables();
        await createLogsTable();
        await createNotificationsTable();
        // await getAllTables();

        console.log("🚀 Database fully initialized!");
    } catch (err) {
        console.error("❌ Setup Failed:", err.message);
    } finally {
        // Do not call pool.end() if you want the server to stay running.
        // If this is a one-time script, keep these lines:
        // await pool.end();
        // process.exit();
    }
};

module.exports = { setupDatabase };