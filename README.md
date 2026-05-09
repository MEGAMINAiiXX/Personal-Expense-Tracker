Personal Finance Tracker Database

A robust PostgreSQL database system designed to manage personal finances, track transactions, and monitor balances with built-in security logic.
Features

    Relational Structure: Normalized database with 4 core tables: users, categories, payment_methods, and transactions.

    Automated Balances: A dedicated view v_user_balances that calculates real-time balances for every user.

    Security Trigger: A server-side trigger trg_before_insert_transaction that prevents users from spending more money than they currently have.

    Audit Logging: Every new transaction is automatically logged in an audit_log table for security and tracking history.

    Performance: Indexes on frequently searched columns to ensure fast queries.

    Stored Logic: Custom PostgreSQL functions for balance retrieval and data logging.

Database Schema

    users: Stores profile information (username, full name, preferred currency).

    categories: Classifies transactions as 'income' or 'expense'.

    payment_methods: Lists available payment options.

    transactions: The core ledger connecting users to their financial activities.

    audit_log: Stores system-generated logs of database actions.

Installation and Usage

    Download the finance_tracker.sql file.

    Execute the script in your PostgreSQL environment:
    SQL

    \i finance_tracker.sql

    Note: The script will automatically clean up the public schema to ensure a fresh install.

Sandbox: Manual Testing Commands

Use these commands to interact with the database and test its features.
1. Adding a new user
SQL

INSERT INTO users (username, full_name, currency) 
VALUES ('alex_smith', 'Alex Smith', 'USD');

2. Adding a new transaction (Income)
SQL

INSERT INTO transactions (user_id, amount, category_id, method_id, description)
VALUES (
    (SELECT user_id FROM users WHERE username = 'alex_smith'),
    5000.00,
    (SELECT category_id FROM categories WHERE name = 'Salary'),
    (SELECT method_id FROM payment_methods WHERE name = 'Optima Bank'),
    'First Salary'
);

3. Adding a new transaction (Expense)
SQL

INSERT INTO transactions (user_id, amount, category_id, method_id, description)
VALUES (
    (SELECT user_id FROM users WHERE username = 'alex_smith'),
    50.00,
    (SELECT category_id FROM categories WHERE name = 'Food'),
    (SELECT method_id FROM payment_methods WHERE name = 'Cash'),
    'Dinner at cafe'
);

4. Testing the Insufficient Funds Trigger

Try to spend more than the current balance to see the error message:
SQL

INSERT INTO transactions (user_id, amount, category_id, method_id, description)
VALUES (
    (SELECT user_id FROM users WHERE username = 'alex_smith'),
    10000.00,
    (SELECT category_id FROM categories WHERE name = 'Shopping'),
    (SELECT method_id FROM payment_methods WHERE name = 'MBANK'),
    'Expensive Laptop'
);

5. Checking Reports
SQL

-- View all balances
SELECT * FROM v_user_balances;

-- View detailed history for a specific user
SELECT * FROM v_detailed_report WHERE username = 'alex_smith';

-- View system audit logs
SELECT * FROM audit_log;