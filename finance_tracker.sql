-- 1. DATABASE CLEANUP
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 2. TABLES CREATION
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'KGS'
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('expense', 'income'))
);

CREATE TABLE payment_methods (
    method_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    category_id INTEGER REFERENCES categories(category_id),
    method_id INTEGER REFERENCES payment_methods(method_id),
    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE audit_log (
    log_id SERIAL PRIMARY KEY,
    transaction_id INTEGER,
    action_type VARCHAR(20),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_users_username ON users(username);

-- 4. REFERENCE DATA
INSERT INTO users (username, full_name, currency) VALUES 
('ii', 'Avin', 'KGS'),
('nursultan', 'Nursultan', 'KGS');

INSERT INTO categories (name, type) VALUES
('Food', 'expense'),
('Transport', 'expense'),
('Salary', 'income'),
('Freelance', 'income'),
('Subscriptions', 'expense'),
('Rent', 'expense'),
('Shopping', 'expense'),
('Entertainment', 'expense');

INSERT INTO payment_methods (name) VALUES 
('MBANK'), ('O!Dengi'), ('Optima Bank'), ('Cash');

-- 5. INITIAL TRANSACTIONS
INSERT INTO transactions (user_id, amount, category_id, method_id, description) VALUES
((SELECT user_id FROM users WHERE username = 'ii'), 45000.00, (SELECT category_id FROM categories WHERE name = 'Salary'), (SELECT method_id FROM payment_methods WHERE name = 'Optima Bank'), 'Monthly Salary'),
((SELECT user_id FROM users WHERE username = 'ii'), 1200.00, (SELECT category_id FROM categories WHERE name = 'Food'), (SELECT method_id FROM payment_methods WHERE name = 'O!Dengi'), 'Lunch'),
((SELECT user_id FROM users WHERE username = 'nursultan'), 25000.00, (SELECT category_id FROM categories WHERE name = 'Salary'), (SELECT method_id FROM payment_methods WHERE name = 'MBANK'), 'Monthly Salary');

-- 6. VIEWS FOR REPORTS
CREATE VIEW v_user_balances AS
SELECT
    u.username,
    SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE -t.amount END) AS balance,
    u.currency
FROM users u
LEFT JOIN transactions t ON u.user_id = t.user_id
LEFT JOIN categories c ON t.category_id = c.category_id
GROUP BY u.username, u.currency;

CREATE VIEW v_detailed_report AS
SELECT 
    t.transaction_id,
    u.username,
    t.amount,
    c.name AS category,
    c.type AS flow_type,
    p.name AS method,
    t.transaction_date,
    t.description
FROM transactions t
JOIN users u ON t.user_id = u.user_id
JOIN categories c ON t.category_id = c.category_id
JOIN payment_methods p ON t.method_id = p.method_id;

-- 7. FUNCTIONS AND TRIGGERS
CREATE OR REPLACE FUNCTION log_new_transaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (transaction_id, action_type)
    VALUES (NEW.transaction_id, 'INSERT');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_insert_transaction
AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION log_new_transaction();

CREATE OR REPLACE FUNCTION check_sufficient_funds()
RETURNS TRIGGER AS $$
DECLARE
    current_user_balance DECIMAL;
    category_type VARCHAR(20);
BEGIN
    SELECT type INTO category_type FROM categories WHERE category_id = NEW.category_id;
    IF category_type = 'expense' THEN
        SELECT balance INTO current_user_balance FROM v_user_balances 
        WHERE username = (SELECT username FROM users WHERE user_id = NEW.user_id);
        IF current_user_balance < NEW.amount THEN
            RAISE EXCEPTION 'Insufficient funds for this transaction';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_before_insert_transaction
BEFORE INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION check_sufficient_funds();

CREATE OR REPLACE FUNCTION get_user_balance(u_name VARCHAR)
RETURNS DECIMAL AS $$
BEGIN
    RETURN (SELECT balance FROM v_user_balances WHERE username = u_name);
END;
$$ LANGUAGE plpgsql;