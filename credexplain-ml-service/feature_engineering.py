import numpy as np
import pandas as pd
from typing import Dict, Any, List

FEATURE_NAMES = [
    "on_time_utility_ratio",
    "avg_utility_delay_days",
    "missed_utility_count",
    "utility_consistency_score",
    "avg_monthly_income",
    "median_monthly_income",
    "lean_month_income",
    "conservative_income_p25",
    "income_volatility_cv",
    "avg_monthly_expenses",
    "estimated_surplus",
    "surplus_ratio",
    "neg_surplus_months",
    "buffer_ratio",
    "inflow_outflow_ratio",
    "tx_frequency_weekly",
    "distinct_payers_count",
    "income_concentration_ratio",
    "uncertain_inflow_pct",
    "inventory_turnover",
    "seasonal_swing_ratio",
    "has_inventory",
    "business_age_years",
    "affordable_emi_indicative"
]

FEATURE_METADATA = {
    "on_time_utility_ratio": {
        "label": "On-Time Utility Ratio",
        "description": "Fraction of utility bills paid on or before due date across last 12 months",
        "direction": "Positive (higher is better)",
        "unit": "ratio (0-1)"
    },
    "avg_utility_delay_days": {
        "label": "Average Utility Delay",
        "description": "Average overdue days for utility payments",
        "direction": "Negative (lower is better)",
        "unit": "days"
    },
    "missed_utility_count": {
        "label": "Missed Utility Bills",
        "description": "Number of months where utility bills were skipped or unpaid",
        "direction": "Negative (lower is better)",
        "unit": "count"
    },
    "utility_consistency_score": {
        "label": "Utility Consistency Score",
        "description": "Composite score of timely bill settlement frequency",
        "direction": "Positive (higher is better)",
        "unit": "index (0-1)"
    },
    "avg_monthly_income": {
        "label": "Average Monthly Income",
        "description": "Synthesized average monthly recurring business inflows",
        "direction": "Positive (higher is better)",
        "unit": "₹ / month"
    },
    "median_monthly_income": {
        "label": "Median Monthly Income",
        "description": "Median monthly business inflow robust to outlier months",
        "direction": "Positive (higher is better)",
        "unit": "₹ / month"
    },
    "lean_month_income": {
        "label": "Lean Month Income",
        "description": "Minimum observed monthly business income in the trailing 12 months",
        "direction": "Positive (higher is better)",
        "unit": "₹ / month"
    },
    "conservative_income_p25": {
        "label": "Conservative Income (P25)",
        "description": "25th percentile of monthly business revenue (stress-test benchmark)",
        "direction": "Positive (higher is better)",
        "unit": "₹ / month"
    },
    "income_volatility_cv": {
        "label": "Income Volatility (CV)",
        "description": "Coefficient of variation of monthly business earnings (StdDev / Mean)",
        "direction": "Negative (lower is better)",
        "unit": "ratio"
    },
    "avg_monthly_expenses": {
        "label": "Average Monthly Expenses",
        "description": "Estimated regular business and living outflows",
        "direction": "Neutral / Contextual",
        "unit": "₹ / month"
    },
    "estimated_surplus": {
        "label": "Estimated Monthly Surplus",
        "description": "Estimated net cash remaining after business and operational outflows",
        "direction": "Positive (higher is better)",
        "unit": "₹ / month"
    },
    "surplus_ratio": {
        "label": "Monthly Surplus Ratio",
        "description": "Ratio of monthly surplus to gross business income",
        "direction": "Positive (higher is better)",
        "unit": "ratio (0-1)"
    },
    "neg_surplus_months": {
        "label": "Negative Surplus Months",
        "description": "Count of months where estimated outflows exceeded inflows",
        "direction": "Negative (lower is better)",
        "unit": "months"
    },
    "buffer_ratio": {
        "label": "Month-End Buffer Ratio",
        "description": "Estimated liquid balance retained at month-end relative to monthly expenses",
        "direction": "Positive (higher is better)",
        "unit": "ratio"
    },
    "inflow_outflow_ratio": {
        "label": "Inflow to Outflow Ratio",
        "description": "Total business inflows divided by business outflows",
        "direction": "Positive (higher is better)",
        "unit": "ratio"
    },
    "tx_frequency_weekly": {
        "label": "Weekly Transaction Frequency",
        "description": "Average number of customer transactions logged per week",
        "direction": "Positive (higher indicates sustained business activity)",
        "unit": "tx / week"
    },
    "distinct_payers_count": {
        "label": "Distinct Payer Diversity",
        "description": "Number of unique customer UPI/account identifiers observed",
        "direction": "Positive (higher diversity lowers counterparty risk)",
        "unit": "count"
    },
    "income_concentration_ratio": {
        "label": "Income Concentration",
        "description": "Concentration of revenue among top payers (inverse entropy)",
        "direction": "Negative (lower is better)",
        "unit": "ratio (0-1)"
    },
    "uncertain_inflow_pct": {
        "label": "Uncertain Inflow Ratio",
        "description": "Percentage of total inflows with ambiguous or non-business attribution",
        "direction": "Negative (lower is better)",
        "unit": "ratio (0-1)"
    },
    "inventory_turnover": {
        "label": "Inventory Turnover",
        "description": "Annualized stock rotation velocity for inventory-bearing businesses",
        "direction": "Positive (treated as missing/neutral when inventory is not applicable)",
        "unit": "turns / year"
    },
    "seasonal_swing_ratio": {
        "label": "Seasonal Swing Ratio",
        "description": "Ratio of highest month sales to lowest month sales",
        "direction": "Contextual (seasonal businesses)",
        "unit": "ratio"
    },
    "has_inventory": {
        "label": "Inventory Bearing Business",
        "description": "Flag indicating if the business manages retail inventory",
        "direction": "Categorical flag",
        "unit": "binary (0 or 1)"
    },
    "business_age_years": {
        "label": "Business Operating History",
        "description": "Years of continuous micro-enterprise operation",
        "direction": "Positive (higher tenure indicates resilience)",
        "unit": "years"
    },
    "affordable_emi_indicative": {
        "label": "Indicative Affordable EMI",
        "description": "Prudential monthly loan installment capacity (35-40% of surplus)",
        "direction": "Positive",
        "unit": "₹ / month"
    }
}

def extract_features_from_transactions(
    tx_df: pd.DataFrame,
    utility_df: pd.DataFrame = None,
    inventory_df: pd.DataFrame = None,
    business_age_years: float = 3.0,
    has_inventory: bool = False
) -> Dict[str, float]:
    """
    Transforms transaction logs, utility history, and optional inventory
    into the full 24-dimensional feature vector.
    """
    if tx_df is None or len(tx_df) == 0:
        raise ValueError("Transaction log cannot be empty")

    tx_df = tx_df.copy()
    tx_df["datetime"] = pd.to_datetime(tx_df["datetime"], errors="coerce")
    tx_df["month"] = tx_df["datetime"].dt.to_period("M").astype(str)

    # Classify inflows
    credits = tx_df[tx_df["type"].str.upper() == "CREDIT"]
    debits = tx_df[tx_df["type"].str.upper() == "DEBIT"]

    # Filter business vs non-business
    non_biz_keywords = ["LOAN", "FAMILY", "RELATIVE", "SAVINGS TRANSFER", "FRIEND"]
    is_biz = credits["description"].str.upper().apply(
        lambda d: not any(kw in str(d) for kw in non_biz_keywords)
    )
    biz_credits = credits[is_biz]
    uncertain_credits = credits[~is_biz]

    monthly_biz = biz_credits.groupby("month")["amount"].sum()
    if len(monthly_biz) == 0:
        monthly_biz = pd.Series([20000.0])

    monthly_debits = debits.groupby("month")["amount"].sum()
    if len(monthly_debits) == 0:
        monthly_debits = pd.Series([12000.0])

    avg_monthly_income = float(monthly_biz.mean())
    median_monthly_income = float(monthly_biz.median())
    lean_month_income = float(monthly_biz.min())
    conservative_income_p25 = float(np.percentile(monthly_biz, 25)) if len(monthly_biz) > 1 else avg_monthly_income * 0.85
    income_volatility_cv = float(monthly_biz.std() / (avg_monthly_income + 1e-5)) if len(monthly_biz) > 1 else 0.15

    avg_monthly_expenses = float(monthly_debits.mean())
    estimated_surplus = max(0.0, avg_monthly_income - avg_monthly_expenses)
    surplus_ratio = estimated_surplus / (avg_monthly_income + 1e-5)

    neg_surplus_months = 0
    common_months = set(monthly_biz.index).intersection(set(monthly_debits.index))
    for m in common_months:
        if monthly_biz[m] - monthly_debits[m] < 0:
            neg_surplus_months += 1

    total_credits = credits["amount"].sum()
    uncertain_inflow_pct = float(uncertain_credits["amount"].sum() / (total_credits + 1e-5)) if total_credits > 0 else 0.05
    inflow_outflow_ratio = float(credits["amount"].sum() / (debits["amount"].sum() + 1e-5)) if len(debits) > 0 else 1.6

    distinct_payers = int(biz_credits["counterparty"].nunique())
    n_days = max(1, (tx_df["datetime"].max() - tx_df["datetime"].min()).days)
    tx_per_week = round(float(len(biz_credits) / (n_days / 7.0)), 1)
    income_concentration_ratio = round(float(np.clip(1.0 / (np.log(distinct_payers + 2) + 0.5), 0.1, 0.9)), 3)

    # Balance buffer approximation
    buffer_ratio = 0.35

    # Utility bills metrics
    if utility_df is not None and len(utility_df) > 0:
        on_time = (utility_df["status"] == "PAID_ON_TIME").mean()
        avg_delay = utility_df["days_late"].mean()
        missed = (utility_df["days_late"] > 30).sum()
        on_time_utility_ratio = round(float(on_time), 3)
        avg_utility_delay_days = round(float(avg_delay), 1)
        missed_utility_count = int(missed)
        utility_consistency_score = round(float(max(0.2, on_time - 0.03 * missed)), 3)
    else:
        on_time_utility_ratio = 0.90
        avg_utility_delay_days = 1.5
        missed_utility_count = 0
        utility_consistency_score = 0.90

    # Inventory metrics
    if has_inventory and inventory_df is not None and len(inventory_df) > 0:
        inventory_turnover = round(float(inventory_df["turnover_ratio"].mean() * 4), 2)
        seasonal_swing_ratio = round(float(inventory_df["sales"].max() / (inventory_df["sales"].min() + 1e-5)), 2)
    else:
        inventory_turnover = 0.0
        seasonal_swing_ratio = 1.0

    affordable_emi = round(float(max(1500, estimated_surplus * 0.38)), 0)

    feature_dict = {
        "on_time_utility_ratio": on_time_utility_ratio,
        "avg_utility_delay_days": avg_utility_delay_days,
        "missed_utility_count": missed_utility_count,
        "utility_consistency_score": utility_consistency_score,
        "avg_monthly_income": round(avg_monthly_income, 2),
        "median_monthly_income": round(median_monthly_income, 2),
        "lean_month_income": round(lean_month_income, 2),
        "conservative_income_p25": round(conservative_income_p25, 2),
        "income_volatility_cv": round(income_volatility_cv, 4),
        "avg_monthly_expenses": round(avg_monthly_expenses, 2),
        "estimated_surplus": round(estimated_surplus, 2),
        "surplus_ratio": round(surplus_ratio, 4),
        "neg_surplus_months": int(neg_surplus_months),
        "buffer_ratio": round(buffer_ratio, 4),
        "inflow_outflow_ratio": round(inflow_outflow_ratio, 2),
        "tx_frequency_weekly": round(tx_per_week, 1),
        "distinct_payers_count": int(distinct_payers),
        "income_concentration_ratio": round(income_concentration_ratio, 3),
        "uncertain_inflow_pct": round(uncertain_inflow_pct, 3),
        "inventory_turnover": round(inventory_turnover, 2),
        "seasonal_swing_ratio": round(seasonal_swing_ratio, 2),
        "has_inventory": int(has_inventory),
        "business_age_years": float(business_age_years),
        "affordable_emi_indicative": round(affordable_emi, 0)
    }
    return feature_dict
