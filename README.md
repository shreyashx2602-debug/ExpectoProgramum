# CreditSetu — Explainable Alternative Credit Scoring & Informal Income Synthesizer

> **“Understand income. Explain risk. Make fairer decisions.”**  
> *A Complete FinTech Website Prototype for Micro-Entrepreneurs and Alternative Credit Underwriting.*

---

## 1. Project Overview & Motivation

Millions of micro-entrepreneurs in emerging markets—including street food vendors, kirana shopkeepers, gig delivery workers, artisanal tailors, and tradespeople—earn consistent, honest livelihood income. However, because their earnings are informal and unrecorded by standard corporate payroll slips, they are frequently excluded from formal banking credit or subjected to exorbitant predatory loans.

**CreditSetu** addresses this financial exclusion through:
1. **Informal Income Synthesizer**: Classifying cash flows from UPI QR logs and account statements to isolate recurring commercial turnover from personal transfers and peer borrowings.
2. **Alternative Data Verification**: Automated OCR and consistency checks for municipal vending certificates, electricity utility payments, and commercial premises tenancy agreements.
3. **Calibrated Machine Learning Scoring**: Estimating Probability of Default (PD) and mapping to an illustrative 300–900 score using Platt-calibrated models trained on diverse synthetic borrower cohorts.
4. **SHAP & LIME Explainability**: Deconstructing every recommendation into positive score drivers and risk mitigation factors translated into plain, dignified language.
5. **Interactive What-If Simulation**: Allowing micro-entrepreneurs to simulate how actions like improving utility payment discipline or building a 3-week buffer will boost their future credit eligibility.
6. **Fairness, Privacy & Governance**: Auditing disparate impact ratios (EEOC 80% rule compliance) across demographic cohorts and ensuring human loan officers retain final decision authority.

---

## 2. System Architecture

CreditSetu is architected as an integrated three-tier platform:

```
┌────────────────────────────────────────────────────────┐
│             React + Vite Frontend (Port 5173)          │
│   Vanilla CSS • Recharts • Lucide • jsPDF PDF Export   │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs
┌───────────────────────────▼────────────────────────────┐
│         Java 17 Spring Boot Backend (Port 8080)        │
│    JPA / Hibernate • H2 & PostgreSQL • RBAC • Audit    │
└───────────────────────────┬────────────────────────────┘
                            │ REST Proxy
┌───────────────────────────▼────────────────────────────┐
│         Python FastAPI ML & Analytics (Port 8000)      │
│  NumPy / Pandas • Platt Calibration • SHAP & LIME XAI  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend**: React 19, JavaScript, HTML5, Vanilla CSS Design System (clean FinTech palette: deep navy, slate, teal, emerald, amber, crimson), Recharts for responsive visualizations, Lucide React icons, jsPDF for downloadable credit assessment dossiers and Adverse Action notices.
- **Core Backend**: Java 17, Spring Boot 3.2.3, Spring Data JPA, Spring Web, H2 in-memory/file persistent database (zero-friction local execution) and PostgreSQL production profile (`application-postgres.yml`), SHA-256 hashed password authentication, RBAC, immutable Audit Trail.
- **Machine Learning & Analytics Service**: Python 3.11, FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn principles, Platt calibration (`PlattCalibrator`), game-theoretic SHAP local & global attributions, LIME local perturbations, disparate impact fairness auditor.

---

## 4. Pre-Seeded Demonstration Profiles

| Applicant | ID | Occupation & Enterprise | Avg Income | Credit Score | Calibrated PD | Review Band |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Priya Sharma** | `APP-2026-081` | Street Food Vendor (*Sharma Chaat & Snacks*) | ₹32,000 / mo | **761** | 6.8% | **Lower-Risk Band** (Approve) |
| **Ramesh Kumar** | `APP-2026-142` | Kirana Shopkeeper (*Ramesh Provision Store*) | ₹58,000 / mo | **672** | 14.2% | **Intermediate-Risk Band** (Review) |
| **Amit Patel** | `APP-2026-295` | Gig Delivery Partner (*Independent Fleet*) | ₹26,000 / mo | **582** | 28.5% | **Higher-Risk Band** (Evidence Req) |

---

## 5. Quick Start & Localhost Deployment

### Prerequisites
- Node.js (v18+) and npm
- Java JDK 17+ and Apache Maven 3.9+
- Python 3.11+

### Running the Services

#### 1. Start Python FastAPI ML Analytics Service (Port 8000)
```powershell
cd c:\ExpectoProgramum\credexplain-ml-service
# Using the installed Python 3.11 runtime:
& "C:\Users\HP\AppData\Local\Programs\Python\Python311\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
```
*Health Check*: `http://localhost:8000/api/ml/health`  
*API Docs*: `http://localhost:8000/docs`

#### 2. Start Java Spring Boot Core Backend (Port 8080)
```powershell
cd c:\ExpectoProgramum\credexplain-core-backend
$env:JAVA_HOME = "C:\Users\HP\AppData\Local\Programs\Java\jdk-17.0.10+7"
& "C:\Users\HP\AppData\Local\Programs\Java\jdk-17.0.10+7\bin\java.exe" -jar target\credexplain-core-backend-1.0.0-SNAPSHOT.jar
```
*H2 Database Console*: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:credexplaindb`)  
*API Base*: `http://localhost:8080/api`

#### 3. Start React Frontend Client (Port 5173)
```powershell
cd c:\ExpectoProgramum\credexplain-client
npm run dev
```
Open **`http://localhost:5173`** in your browser!

---

## 6. Demo Account Credentials (1-Click Login Supported)

- **Loan Officer**: `officer@credexplain.demo` / `demo123` (Full Underwriting & Reviewer Portal)
- **Applicant**: `applicant@credexplain.demo` / `demo123` (Applicant Profile & Submitted Records)
- **System Auditor**: `admin@credexplain.demo` / `demo123` (Model Diagnostics & Fairness Audit)

---

## 7. Key REST API Endpoints

### Core Backend (Spring Boot :8080)
- `POST /api/auth/login` — Account sign in & JWT token issuance
- `GET /api/auth/demo-accounts` — Seeded demo account list
- `GET /api/applicants` — Retrieve all applicants
- `GET /api/applicants/{refId}` — Single applicant profile
- `GET /api/documents/applicant/{refId}` — Document checklist & verification status
- `POST /api/documents/upload` — Ingest document with simulated OCR
- `POST /api/decisions` — Record human loan officer final decision
- `GET /api/audit/logs` — Retrieve immutable audit trail

### ML Analytics Service (FastAPI :8000)
- `GET /api/ml/health` — Model version & service diagnostics
- `GET /api/ml/demo-applicant/{slug}` — Full analysis dossier (Priya, Ramesh, Amit)
- `POST /api/ml/score-features` — Score 24 behavioral features
- `POST /api/ml/what-if` — Counterfactual hypothetical simulation
- `GET /api/ml/model-performance` — AUC-ROC, KS statistic, Confusion Matrix, Calibration Curve
- `GET /api/ml/fairness` — Cohort disparate impact ratios & 80% rule audit

---

## 8. Responsible AI & Regulatory Disclaimers

> [!IMPORTANT]
> **Educational & Demonstration Notice:** CreditSetu is developed as an innovative fintech prototype. All scores, probability of default estimates, and document verification results are demonstrated using realistic synthetic models. They do not constitute statutory Fair Credit Reporting Act (FCRA) notices or legally binding underwriting commitments. Protected personal attributes (gender, religion, caste, exact address) are strictly excluded from credit scoring features.
