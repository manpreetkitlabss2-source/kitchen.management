const pool = require("./db");
require('dotenv').config();

const createUsersTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            restaurantName VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'manager', 'chef', 'inventory_staff') NOT NULL DEFAULT 'admin',
            restaurant_id INT NULL,
            created_by INT NULL,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_users_restaurant (restaurant_id)
        )
    `);
    console.log("✅ Users table ready");
};

const createIngredientsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ingredients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            restaurant_id INT NOT NULL,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            unit VARCHAR(50),
            current_stock DECIMAL(10,2) DEFAULT 0,
            threshold_value DECIMAL(10,2) DEFAULT 0,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ingredient_name (name),
            INDEX idx_ingredient_restaurant (restaurant_id),
            INDEX idx_ingredient_user (user_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log("✅ Ingredients table ready");
};

const createRecipesTables = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS recipes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            restaurant_id INT NOT NULL,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_recipe_name (name),
            INDEX idx_recipe_restaurant (restaurant_id),
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
            restaurant_id INT NOT NULL,
            user_id INT NOT NULL,
            type ENUM('consumption', 'waste') NOT NULL,
            ingredient_id INT,
            recipe_id INT NULL,
            quantity DECIMAL(10,2),
            reason TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL,
            INDEX idx_logs_restaurant_created (restaurant_id, created_at),
            INDEX idx_logs_user_created (user_id, created_at),
            INDEX idx_logs_type (type)
        )
    `);
    console.log("✅ Logs table ready");
};

const createNotificationsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            restaurant_id INT NOT NULL,
            user_id INT NOT NULL,
            ingredient_id INT NOT NULL,
            type ENUM('low_stock', 'out_of_stock') NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
            UNIQUE KEY unique_notification (restaurant_id, ingredient_id, type),
            INDEX idx_notifications_restaurant_read (restaurant_id, is_read)
        )
    `);
    console.log("✅ Notifications table ready");
};

const createBatchTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ingredient_batches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            restaurant_id INT NOT NULL,
            user_id INT NOT NULL,
            ingredient_id INT NOT NULL,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
            expiry_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
            INDEX idx_restaurant_id (restaurant_id),
            INDEX idx_user_id (user_id),
            INDEX idx_ingredient_id (ingredient_id),
            INDEX idx_batch_expiry (expiry_date),
            INDEX idx_restaurant_expiry (restaurant_id, expiry_date)
        )
    `);
    console.log("✅ Ingredient Batches table ready");
};

const createOrdersTables = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            restaurant_id INT NOT NULL,
            user_id INT NOT NULL,
            status ENUM('pending','completed','cancelled') DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_orders_restaurant (restaurant_id),
            INDEX idx_orders_user (user_id)
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            recipe_id INT NULL,
            quantity INT NOT NULL DEFAULT 1,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
        )
    `);
    console.log("✅ Orders tables ready");
};

const deleteAllTables = async () => {
    await pool.query(`
        DROP TABLE IF EXISTS order_items, orders, ingredient_batches, logs, notifications, recipe_ingredients, recipes, ingredients, users
    `);
    console.log("✅ All tables deleted");
};

const test = async () => {

    const [tables] = await pool.query(`SELECT * FROM users` , [process.env.DB_NAME, 0]);
    console.log("✅ table contents:", tables);
}

const setupDatabase = async () => {
    try {
        console.log("--- Starting Sequential Setup ---");
        await createUsersTable();
        await createIngredientsTable();
        await createRecipesTables();
        await createLogsTable();
        await createNotificationsTable();
        await createBatchTable();
        await createOrdersTables();
        // await deleteAllTables();
        console.log("🚀 Database fully initialized and secured!");
    } catch (err) {
        console.error("❌ Setup Failed:", err.message);
    }
};

module.exports = { setupDatabase };
