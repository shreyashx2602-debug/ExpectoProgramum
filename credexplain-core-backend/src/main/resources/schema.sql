-- CredExplain Database Schema
-- Multi-entity architecture supporting accounts, applicants, documents, transactions,
-- engineered features, model evaluations, explainability records, decisions, and audit trail.

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(40) NOT NULL, -- APPLICANT, LOAN_OFFICER, ADMIN
    account_status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applicant_profiles (
    id BIGSERIAL PRIMARY KEY,
    applicant_ref_id VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id),
    full_name VARCHAR(150) NOT NULL,
    occupation VARCHAR(100) NOT NULL,
    business_name VARCHAR(150),
    business_type VARCHAR(100),
    business_vintage VARCHAR(50),
    business_age_years NUMERIC(4, 1) DEFAULT 2.0,
    contact_phone VARCHAR(50),
    location VARCHAR(120),
    has_inventory BOOLEAN DEFAULT FALSE,
    identity_verification_status VARCHAR(50) DEFAULT 'SIMULATED_VERIFIED',
    rent_tenancy_status VARCHAR(50) DEFAULT 'VERIFIED_LEASE',
    profile_completion_pct INT DEFAULT 90,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_records (
    id BIGSERIAL PRIMARY KEY,
    applicant_ref_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(60) NOT NULL, -- INCOME_CERT, RENT_AGREEMENT, ELECTRICITY_BILL, PASSBOOK, EMI_HISTORY
    file_name VARCHAR(255) NOT NULL,
    file_format VARCHAR(20) NOT NULL,
    file_size_bytes BIGINT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_status VARCHAR(40) NOT NULL, -- VERIFIED, NEEDS_MANUAL_REVIEW, SUSPECTED_ISSUE
    ocr_extracted_data TEXT,
    consistency_notes TEXT,
    reviewer_notes TEXT,
    verified_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS transaction_records (
    id BIGSERIAL PRIMARY KEY,
    applicant_ref_id VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    tx_datetime TIMESTAMP NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    tx_type VARCHAR(20) NOT NULL, -- CREDIT, DEBIT
    description VARCHAR(255),
    counterparty VARCHAR(150),
    payment_mode VARCHAR(40),
    verification_status VARCHAR(50), -- VERIFIED_UPI, UNVERIFIED_STATEMENT, FLAGGED_LOAN, SETTLED_DEBIT
    reference_number VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS financial_summaries (
    id BIGSERIAL PRIMARY KEY,
    applicant_ref_id VARCHAR(50) NOT NULL,
    avg_monthly_income NUMERIC(12, 2),
    median_monthly_income NUMERIC(12, 2),
    lean_month_income NUMERIC(12, 2),
    conservative_income_p25 NUMERIC(12, 2),
    income_volatility_cv NUMERIC(6, 4),
    avg_monthly_expenses NUMERIC(12, 2),
    estimated_surplus NUMERIC(12, 2),
    on_time_utility_ratio NUMERIC(5, 3),
    buffer_ratio NUMERIC(5, 3),
    affordable_emi_indicative NUMERIC(12, 2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_decisions (
    id BIGSERIAL PRIMARY KEY,
    applicant_ref_id VARCHAR(50) NOT NULL,
    model_score INT NOT NULL,
    probability_of_default NUMERIC(6, 4) NOT NULL,
    model_decision_band VARCHAR(60) NOT NULL,
    model_recommendation VARCHAR(150) NOT NULL,
    human_decision VARCHAR(50) NOT NULL, -- APPROVED, REFERRED_MANUAL_REVIEW, DECLINED
    loan_officer_name VARCHAR(120) NOT NULL,
    decision_notes TEXT,
    adverse_action_reasons TEXT,
    approved_amount NUMERIC(12, 2),
    decision_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
    id BIGSERIAL PRIMARY KEY,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(120) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(60) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    details TEXT
);
