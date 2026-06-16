CREATE DATABASE test;

CREATE TABLE users(
	user_id SERIAL PRIMARY KEY,
	user_balamce FLOAT
);

CREATE TABLE transactions(
	transaction_id SERIAL PRIMARY KEY,
	amount FLOAT,
	before_transaction FLOAT,
	after_transaction FLOAT,
	user_id INT,
	type_of_transaction TEXT
);

INSERT INTO users
VALUES
(500),
(600),
(700);

