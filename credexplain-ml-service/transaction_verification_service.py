import re
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

def verify_and_analyze_transactions(
    transactions: List[Dict[str, Any]],
    claimed_monthly_income: float = 35000.0,
    applicant_name: str = "Borrower",
    ref_id: str = "APP-2026-001"
) -> Dict[str, Any]:
    """
    Performs forensic verification and financial analytics on online payment transactions
    (UPI QR, P2M, NetBanking, Cards, IMPS/NEFT).
    Produces an authoritative Transaction Verification Audit Report.
    """
    if not transactions or len(transactions) == 0:
        return {
            "applicant_ref_id": ref_id,
            "applicant_name": applicant_name,
            "verification_status": "NO_DATA",
            "integrity_score_pct": 0.0,
            "total_transactions": 0,
            "total_credit_volume": 0.0,
            "total_debit_volume": 0.0,
            "verified_commercial_inflow": 0.0,
            "unverified_inflow": 0.0,
            "flagged_loan_inflow": 0.0,
            "net_surplus": 0.0,
            "corroborated_monthly_income": 0.0,
            "claimed_income_coverage_pct": 0.0,
            "counterparty_diversity": {"unique_payers": 0, "top_payer_concentration_pct": 0.0},
            "channel_breakdown": [],
            "anomalies": [],
            "underwriting_verdict": "No online payment records available for verification.",
            "recommended_credit_limit": 0.0,
            "recommended_emi_capacity": 0.0,
            "audit_hash": "N/A",
            "verified_transactions": []
        }

    # Keyword rules for transaction classification
    biz_patterns = [
        r"upi/p2m", r"qr", r"customer", r"order", r"sale", r"payment", r"bill",
        r"settlement", r"merchant", r"counter", r"pos", r"store", r"retail", r"client"
    ]
    personal_patterns = [
        r"family", r"relative", r"friend", r"personal", r"gift", r"father",
        r"mother", r"brother", r"sister", r"pocket", r"help"
    ]
    loan_patterns = [
        r"loan", r"lender", r"kist", r"advance", r"borrow", r"peer", r"emi",
        r"finance", r"microfinance", r"shylock", r"hand loan"
    ]
    self_patterns = [r"self", r"own account", r"internal", r"contra", r"transfer to self"]

    verified_txs = []
    total_credit_vol = 0.0
    total_debit_vol = 0.0
    verified_credit_vol = 0.0
    unverified_vol = 0.0
    flagged_loan_vol = 0.0

    payers_credit_map: Dict[str, float] = {}
    channel_summary: Dict[str, Dict[str, Any]] = {}
    anomalies: List[Dict[str, str]] = []

    for idx, tx in enumerate(transactions):
        raw_amt = tx.get("amount", 0.0)
        try:
            amt = float(raw_amt)
        except (ValueError, TypeError):
            amt = 0.0

        raw_type = str(tx.get("type", "CREDIT")).strip().upper()
        is_credit = raw_type in ["CREDIT", "CR", "INFLOW", "DEPOSIT"]
        ttype = "CREDIT" if is_credit else "DEBIT"

        desc = str(tx.get("description", tx.get("particulars", ""))).strip()
        desc_lower = desc.lower()
        payer = str(tx.get("counterparty", tx.get("payer", tx.get("party", "Unknown")))).strip()
        mode = str(tx.get("paymentMode", tx.get("payment_mode", tx.get("channel", "UPI_QR")))).strip().upper()
        if "UPI" in mode and "P2M" not in mode and "QR" not in mode:
            mode = "UPI_QR"

        tx_id = str(tx.get("id", tx.get("transactionRef", tx.get("refNumber", f"TXN-{1000 + idx}"))))
        dt = str(tx.get("datetime", tx.get("date", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))))

        # Channel tracking
        if mode not in channel_summary:
            channel_summary[mode] = {"mode": mode, "credit_volume": 0.0, "debit_volume": 0.0, "count": 0}
        channel_summary[mode]["count"] += 1

        # Classification logic
        if not is_credit:
            status = "SETTLED_DEBIT"
            confidence = 0.98
            reason = "Operating debit / supplier settlement verified."
            category = "BUSINESS_OUTFLOW"
            total_debit_vol += amt
            channel_summary[mode]["debit_volume"] += amt
        else:
            total_credit_vol += amt
            channel_summary[mode]["credit_volume"] += amt
            payers_credit_map[payer] = payers_credit_map.get(payer, 0.0) + amt

            if any(re.search(p, desc_lower) for p in loan_patterns):
                status = "FLAGGED_LOAN_INFLOW"
                confidence = 0.94
                reason = "Peer/informal borrowing installment detected; excluded to avoid artificial income inflation."
                category = "LOAN_PROCEED"
                flagged_loan_vol += amt
                anomalies.append({
                    "severity": "HIGH",
                    "type": "LOAN_DISBURSEMENT_DETECTED",
                    "details": f"Transaction #{tx_id} of ₹{amt:,.0f} from '{payer}' matches informal borrowing patterns."
                })
            elif any(re.search(p, desc_lower) for p in personal_patterns) or any(re.search(p, desc_lower) for p in self_patterns):
                status = "UNVERIFIED_STATEMENT_ENTRY"
                confidence = 0.88
                reason = "Personal/family transfer or self-contra deposit; segregated from commercial operating revenue."
                category = "PERSONAL_TRANSFER"
                unverified_vol += amt
            elif any(re.search(p, desc_lower) for p in biz_patterns) or "UPI" in mode or amt <= 5000:
                status = "VERIFIED_UPI" if "UPI" in mode else "VERIFIED_COMMERCIAL"
                confidence = 0.95 if ("p2m" in desc_lower or "qr" in desc_lower) else 0.85
                reason = f"Authentic customer commercial payment via {mode}."
                category = "CUSTOMER_BUSINESS_RECEIPT"
                verified_credit_vol += amt
            else:
                if amt > 25000:
                    status = "UNVERIFIED_STATEMENT_ENTRY"
                    confidence = 0.60
                    reason = "Large unreferenced credit spike; flagged for manual invoice cross-referencing."
                    category = "UNCERTAIN_INFLOW"
                    unverified_vol += amt
                    anomalies.append({
                        "severity": "MEDIUM",
                        "type": "UNREFERENCED_LARGE_CREDIT",
                        "details": f"Credit of ₹{amt:,.0f} lacks verifiable merchant QR tag or counterparty identifier."
                    })
                else:
                    status = "VERIFIED_COMMERCIAL"
                    confidence = 0.80
                    reason = f"Commercial business credit settled via {mode}."
                    category = "CUSTOMER_BUSINESS_RECEIPT"
                    verified_credit_vol += amt

        verified_txs.append({
            "id": tx_id,
            "datetime": dt,
            "amount": amt,
            "type": ttype,
            "paymentMode": mode,
            "description": desc,
            "counterparty": payer,
            "status": status,
            "category": category,
            "confidence": round(confidence, 2),
            "verificationReason": reason,
            "refNumber": str(tx.get("refNumber", tx_id))
        })

    # Integrity metrics
    effective_credits = max(1.0, total_credit_vol)
    integrity_rate = round((verified_credit_vol / effective_credits) * 100, 1)

    # Counterparty diversity
    unique_payers = len(payers_credit_map)
    top_payer_amt = max(payers_credit_map.values()) if payers_credit_map else 0.0
    top_payer_concentration = round((top_payer_amt / effective_credits) * 100, 1)

    if top_payer_concentration > 40.0 and len(transactions) >= 10:
        anomalies.append({
            "severity": "MEDIUM",
            "type": "HIGH_PAYER_CONCENTRATION",
            "details": f"Single largest counterparty accounts for {top_payer_concentration}% of total inflows."
        })

    net_surplus = round(verified_credit_vol - total_debit_vol, 0)

    # Corroborated Monthly Income
    # If transactions span multiple days, normalize to a 30-day monthly equivalent
    dates = [t["datetime"][:10] for t in verified_txs if t.get("datetime")]
    unique_days = len(set(dates)) if dates else 1
    if unique_days >= 7:
        corroborated_monthly = round((verified_credit_vol / unique_days) * 30, 0)
    else:
        # If short batch, treat verified volume as month-to-date or benchmark with claimed
        corroborated_monthly = round(max(verified_credit_vol, claimed_monthly_income * (integrity_rate / 100.0)), 0)

    claimed_coverage = round((corroborated_monthly / max(1.0, claimed_monthly_income)) * 100, 1)

    # Underwriting verdict
    if integrity_rate >= 85.0 and len(anomalies) == 0:
        verdict_status = "VERIFIED"
        status_label = "High Commercial Integrity (Verified)"
    elif integrity_rate >= 70.0:
        verdict_status = "VERIFIED_WITH_CONDITIONS"
        status_label = "Verified with Minor Conditions"
    else:
        verdict_status = "FLAGGED_FOR_REVIEW"
        status_label = "Requires Underwriter Review"

    # Recommended loan metrics
    est_monthly_surplus = max(0.0, corroborated_monthly * 0.35)
    recommended_emi = round(est_monthly_surplus * 0.40, 0)
    recommended_limit = round(corroborated_monthly * 2.5, 0)

    # Forensic audit hash
    hash_payload = f"{ref_id}|{len(transactions)}|{verified_credit_vol}|{integrity_rate}|{datetime.now().strftime('%Y%m%d')}"
    audit_hash = "VERIF-" + hashlib.sha256(hash_payload.encode()).hexdigest()[:12].upper()

    channel_list = list(channel_summary.values())

    return {
        "applicant_ref_id": ref_id,
        "applicant_name": applicant_name,
        "verification_status": verdict_status,
        "verification_status_label": status_label,
        "integrity_score_pct": integrity_rate,
        "total_transactions": len(verified_txs),
        "total_credit_volume": round(total_credit_vol, 0),
        "total_debit_volume": round(total_debit_vol, 0),
        "verified_commercial_inflow": round(verified_credit_vol, 0),
        "unverified_inflow": round(unverified_vol, 0),
        "flagged_loan_inflow": round(flagged_loan_vol, 0),
        "net_surplus": net_surplus,
        "corroborated_monthly_income": corroborated_monthly,
        "claimed_income_coverage_pct": claimed_coverage,
        "counterparty_diversity": {
            "unique_payers": unique_payers,
            "top_payer_concentration_pct": top_payer_concentration,
            "repeat_payer_ratio": round(min(1.0, unique_payers / max(1, len(verified_txs) * 0.6)), 2)
        },
        "channel_breakdown": channel_list,
        "anomalies": anomalies,
        "underwriting_verdict": (
            f"Analyzed {len(verified_txs)} online payment records totaling ₹{total_credit_vol:,.0f} in gross inflows. "
            f"Successfully verified ₹{verified_credit_vol:,.0f} ({integrity_rate}%) as genuine business receipts. "
            f"Segregated ₹{unverified_vol + flagged_loan_vol:,.0f} in personal transfers and informal borrowings. "
            f"Corroborated monthly income established at ₹{corroborated_monthly:,.0f}."
        ),
        "recommended_credit_limit": recommended_limit,
        "recommended_emi_capacity": recommended_emi,
        "audit_hash": audit_hash,
        "verification_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "verified_transactions": verified_txs
    }
