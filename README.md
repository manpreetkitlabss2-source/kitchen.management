Objective
Build a production-like demo system that helps restaurants manage their kitchen inventory, track ingredient usage, and monitor wastage.
This project focuses on internal restaurant operations, showcasing strong backend logic, data modeling, and analytics capabilities.
This will be:
Shared with clients as a real-world operational solution
Evaluated for business logic, scalability, and system design
Hosted on GitHub with proper documentation
Tech Stack
Frontend: React.js
Backend: Node.js (Express.js)
Database: MySQL
User Roles & Responsibilities
1. Admin / Restaurant Manager
Manages inventory
Tracks usage & wastage
Views analytics and reports
Core Features (Detailed)
1. Authentication & Authorization
JWT-based login system
Single role (Admin/Manager)
Protected APIs using middleware
2. Ingredient Inventory Management
Add new ingredients:
Name (e.g., Tomato, Cheese)
Unit (kg, liters, pieces)
Current stock quantity
Update stock manually
View all ingredients with current stock levels
3. Recipe / Item Mapping (Important)
Create dishes/menu items
Map ingredients to each dish:
Ingredient name
Quantity required per dish
Example:
Pizza → Cheese (200g), Tomato (100g), Dough (1 unit)
4. Consumption Tracking
When a dish is “prepared”, system should:
Deduct ingredient quantities automatically
Option to:
Manually log consumption
Maintain history of consumption
5. Waste Management
Log wasted ingredients:
Ingredient
Quantity
Reason (expired, spoiled, overcooked, etc.)
Deduct from inventory
Maintain waste history
6. Alerts & Notifications (Simple Logic)
Low stock alert:
Trigger when stock < predefined threshold
Optional:
Expiry tracking (if implemented)
7. Dashboard & Analytics (Important)
Provide a simple dashboard with:
Total ingredients in stock
Low stock items
Daily/weekly consumption summary
Wastage report:
Most wasted ingredients
Total waste quantity
Database Design (Minimum Required)
Tables:
users
id
name
email
password

ingredients
id
name
unit
current_stock
threshold_value (for alerts)

recipes
id
name
recipe_ingredients
id
recipe_id
ingredient_id
quantity_required

consumption_logs
id
recipe_id (nullable if manual)
ingredient_id
quantity_used
created_at

waste_logs
id
ingredient_id
quantity
reason
created_at

API Requirements
Follow RESTful conventions
Route grouping:
/auth
/ingredients
/recipes
/consumption
/waste
/dashboard
Middleware:
Authentication
Proper validation & error handling
Technical Expectations
Code Structure
Follow MVC architecture
Separate:
Controllers
Services (business logic)
Models (DB layer)
Routes
Best Practices
Use async/await
Centralized error handling
Use .env for configuration
Secure password hashing (bcrypt)
Frontend Expectations
Clean dashboard UI
Ingredient list view
Forms for:
Adding ingredients
Logging consumption
Logging waste
Dashboard charts (basic)
Deliverables (Very Important)
1. GitHub Repository
Must include:
Clean folder structure
Proper commit history
.gitignore
Well-written README
2. README File (Mandatory Details)
Include:
Project Overview
What problem this solves (inventory & wastage tracking)
Key features
Tech Stack
Setup Instructions
Clone repo
Install dependencies
Setup .env
Run frontend & backend
Database Setup
SQL file OR migration steps
Seed data instructions
API Documentation
Postman collection OR endpoint list
Demo Credentials
Admin login
3. Seed Data
Pre-create:
10–15 ingredients
3–5 recipes
Sample consumption logs
Sample waste logs
4. Postman Collection
Include APIs for:
Auth
Ingredients
Recipes
Consumption
Waste
Dashboard
5. Environment Configuration
Provide .env.example
Include:
DB credentials
JWT secret
Port
6. (Optional but Recommended)
Deployment link OR demo video walkthrough
Nice to Have (Bonus Points)
Ingredient expiry tracking
Unit conversion (grams ↔ kg)
CSV import/export
Advanced analytics (monthly trends)