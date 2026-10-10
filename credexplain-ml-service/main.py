import io
import os
import pandas as pd
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model_service import credit_engine
from feature_engineering import extract_features_from_transactions, FEATURE_METADATA, FEATURE_NAMES
from income_synthesizer import synthesize_informal_income
from explainability_service import explain_service
from what_if_service import simulate_counterfactual
from fairness_service import evaluate_model_fairness
from transaction_verification_service import verify_and_analyze_transactions

app = FastAPI(
    title="CredExplain ML Analytics Service",
    description="Explainable Alternative Credit Scoring & Informal Income Synthesizer API",
    version="1.4.2"
)

# Enable CORS for frontend and core backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeatureInput(BaseModel):
    features: Dict[str, float]

class WhatIfRequest(BaseModel):
    base_features: Dict[str, float]
    scenario_deltas: Dict[str, float]

class TransactionVerificationRequest(BaseModel):
    applicant_ref_id: Optional[str] = "APP-2026-001"
    applicant_name: Optional[str] = "Borrower"
    claimed_monthly_income: Optional[float] = 35000.0
    transactions: List[Dict[str, Any]] = []

@app.get("/")
def root():
    return {
        "service": "CredExplain ML Analytics & Scoring Service",
        "status": "ONLINE",
        "version": credit_engine.model_version
    }

@app.get("/api/ml/health")
def health_check():
    return {
        "status": "HEALTHY",
        "model_version": credit_engine.model_version,
        "features_count": len(credit_engine.feature_names),
        "auc_roc": credit_engine.performance_metrics.get("auc_roc"),
        "ks_statistic": credit_engine.performance_metrics.get("ks_statistic")
    }

@app.get("/api/ml/feature-definitions")
def get_feature_definitions():
    return {
        "feature_count": len(FEATURE_NAMES),
        "features": FEATURE_METADATA
    }

@app.get("/api/ml/model-performance")
def get_model_performance():
    return credit_engine.performance_metrics

@app.get("/api/ml/global-explanations")
def get_global_explanations():
    return {
        "global_importance": explain_service.get_global_feature_importance()
    }

@app.get("/api/ml/fairness")
def get_fairness_audit():
    return evaluate_model_fairness()

@app.post("/api/ml/score-features")
def score_features_endpoint(payload: FeatureInput):
    score_res = credit_engine.score_features(payload.features)
    explain_res = explain_service.explain_prediction(payload.features)
    return {
        **score_res,
        "explanation": explain_res
    }

@app.post("/api/ml/what-if")
def what_if_endpoint(payload: WhatIfRequest):
    return simulate_counterfactual(payload.base_features, payload.scenario_deltas)

@app.post("/api/ml/upload-transactions")
async def upload_transactions(
    file: UploadFile = File(...),
    business_age_years: float = Form(3.0),
    has_inventory: bool = Form(False)
):
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Synthesize income
        synth_result = synthesize_informal_income(df)
        
        # Extract features
        features = extract_features_from_transactions(
            tx_df=df,
            business_age_years=business_age_years,
            has_inventory=has_inventory
        )
        
        # Score and Explain
        score_result = credit_engine.score_features(features)
        explain_result = explain_service.explain_prediction(features)
        
        return {
            "income_synthesis": synth_result,
            "engineered_features": features,
            "credit_score_result": score_result,
            "explanations": explain_result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process transaction file: {str(e)}")

@app.post("/api/ml/verify-transactions")
def verify_transactions_endpoint(payload: TransactionVerificationRequest):
    """
    Forensic transaction verification and underwriting report generation.
    """
    try:
        report = verify_and_analyze_transactions(
            transactions=payload.transactions,
            claimed_monthly_income=payload.claimed_monthly_income or 35000.0,
            applicant_name=payload.applicant_name or "Borrower",
            ref_id=payload.applicant_ref_id or "APP-2026-001"
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction verification failed: {str(e)}")

@app.post("/api/ml/verify-transactions-csv")
async def verify_transactions_csv_endpoint(
    file: UploadFile = File(...),
    applicant_name: str = Form("Borrower"),
    applicant_ref_id: str = Form("APP-2026-001"),
    claimed_monthly_income: float = Form(35000.0)
):
    """
    Direct CSV file parsing and forensic transaction verification.
    """
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        # Normalize column names to standard keys
        df.columns = [str(col).strip().lower().replace(" ", "_") for col in df.columns]

        transactions = []
        for _, row in df.iterrows():
            amt = float(row.get("amount", row.get("txn_amount", row.get("credit", row.get("debit", 0.0)))) or 0.0)
            raw_type = str(row.get("type", row.get("transaction_type", row.get("cr_dr", "CREDIT")))).upper()
            is_credit = ("CR" in raw_type or "CREDIT" in raw_type or "INFLOW" in raw_type or ("credit" in df.columns and float(row.get("credit", 0.0) or 0.0) > 0))
            if not is_credit and ("debit" in df.columns and float(row.get("debit", 0.0) or 0.0) > 0):
                amt = float(row.get("debit", amt) or amt)
            
            transactions.append({
                "id": str(row.get("id", row.get("transaction_id", row.get("ref_no", f"TXN-{len(transactions) + 1000}")))),
                "datetime": str(row.get("datetime", row.get("date", row.get("txn_date", "")))),
                "amount": amt,
                "type": "CREDIT" if is_credit else "DEBIT",
                "paymentMode": str(row.get("payment_mode", row.get("channel", row.get("mode", "UPI_QR")))).upper(),
                "counterparty": str(row.get("counterparty", row.get("payer", row.get("party", "Counterparty")))),
                "description": str(row.get("description", row.get("particulars", row.get("narration", "")))),
                "refNumber": str(row.get("ref_number", row.get("utr", row.get("ref", ""))))
            })

        report = verify_and_analyze_transactions(
            transactions=transactions,
            claimed_monthly_income=claimed_monthly_income,
            applicant_name=applicant_name,
            ref_id=applicant_ref_id
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to verify transaction CSV: {str(e)}")

@app.get("/api/ml/demo-applicant/{slug}")
def get_demo_applicant_analysis(slug: str):
    """
    Returns full analysis for borrower dataset archetypes:
    'priya_sharma', 'ramesh_kumar', or 'amit_patel'
    """
    data_dir = os.path.join(os.path.dirname(__file__), "sample_datasets")
    tx_file = os.path.join(data_dir, f"{slug}_transactions.csv")
    util_file = os.path.join(data_dir, "sample_utility_bills.csv")
    inv_file = os.path.join(data_dir, "sample_inventory_records.csv")

    if not os.path.exists(tx_file):
        raise HTTPException(status_code=404, detail="Demo applicant dataset not found")

    tx_df = pd.read_csv(tx_file)
    util_df = pd.read_csv(util_file) if os.path.exists(util_file) else None
    inv_df = pd.read_csv(inv_file) if os.path.exists(inv_file) else None

    # Applicant metadata
    meta = {
        "priya_sharma": {
            "id": "APP-2026-081",
            "name": "Priya Sharma",
            "occupation": "Street Food Vendor",
            "business_name": "Sharma Chaat & Snacks",
            "business_type": "Food & Beverage Micro-Enterprise",
            "business_vintage": "4.5 Years",
            "contact": "+91 98765-XXXX1",
            "location": "Indore, Madhya Pradesh",
            "business_age_years": 4.5,
            "has_inventory": False,
            "rent_tenancy_status": "Verified (Premises Lease Agreement Active)",
            "identity_verification": "Simulated Aadhaar / PAN Verified (Demo Mode)"
        },
        "ramesh_kumar": {
            "id": "APP-2026-142",
            "name": "Ramesh Kumar",
            "occupation": "Kirana Shopkeeper",
            "business_name": "Ramesh Provision & General Store",
            "business_type": "Grocery & Daily Essentials Retail",
            "business_vintage": "7.0 Years",
            "contact": "+91 98765-XXXX2",
            "location": "Jaipur, Rajasthan",
            "business_age_years": 7.0,
            "has_inventory": True,
            "rent_tenancy_status": "Verified (Commercial Tenancy Active)",
            "identity_verification": "Simulated Aadhaar / PAN Verified (Demo Mode)"
        },
        "amit_patel": {
            "id": "APP-2026-295",
            "name": "Amit Patel",
            "occupation": "Gig Delivery Partner",
            "business_name": "Independent Fleet Operator",
            "business_type": "On-Demand Delivery Logistics",
            "business_vintage": "2.0 Years",
            "contact": "+91 98765-XXXX3",
            "location": "Ahmedabad, Gujarat",
            "business_age_years": 2.0,
            "has_inventory": False,
            "rent_tenancy_status": "Needs Review (Tenancy agreement update pending)",
            "identity_verification": "Simulated Aadhaar / PAN Verified (Demo Mode)"
        }
    }.get(slug, {
        "id": "APP-2026-001",
        "name": slug.replace("_", " ").title(),
        "occupation": "Micro-Entrepreneur",
        "business_name": "Local Enterprise",
        "business_age_years": 3.0,
        "has_inventory": False
    })

    # Filter utilities for this applicant
    applicant_util = util_df[util_df["applicant_name"] == meta["name"]] if util_df is not None else None

    # Feature extraction & processing
    features = extract_features_from_transactions(
        tx_df=tx_df,
        utility_df=applicant_util,
        inventory_df=inv_df if meta["has_inventory"] else None,
        business_age_years=meta["business_age_years"],
        has_inventory=meta["has_inventory"]
    )

    synth_income = synthesize_informal_income(tx_df)
    score_res = credit_engine.score_features(features)
    explain_res = explain_service.explain_prediction(features)

    # Seasonal inventory data if applicable
    inventory_data = inv_df.to_dict(orient="records") if (meta["has_inventory"] and inv_df is not None) else []

    return {
        "applicant": meta,
        "features": features,
        "income_synthesis": synth_income,
        "credit_score": score_res,
        "explanations": explain_res,
        "inventory_analysis": inventory_data,
        "transactions_count": len(tx_df),
        "recent_transactions": tx_df.head(40).to_dict(orient="records")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
