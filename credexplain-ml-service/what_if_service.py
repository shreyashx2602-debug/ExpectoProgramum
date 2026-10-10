from typing import Dict, Any
from model_service import credit_engine
from explainability_service import explain_service

def simulate_counterfactual(base_features: Dict[str, float], scenario_deltas: Dict[str, float]) -> Dict[str, Any]:
    """
    Simulates a 'What-If' hypothetical financial trajectory by applying reviewer/applicant
    modifications (e.g. improved utility payment discipline, increased month-end buffer,
    reduced volatility, or higher business revenue).
    Recalculates Illustrative Score, Probability of Default, and identifies factor drivers.
    """
    simulated_features = dict(base_features)

    # Allowed what-if levers
    valid_levers = [
        "on_time_utility_ratio",
        "avg_monthly_income",
        "income_volatility_cv",
        "buffer_ratio",
        "distinct_payers_count",
        "uncertain_inflow_pct",
        "neg_surplus_months"
    ]

    applied_changes = []
    for lever in valid_levers:
        if lever in scenario_deltas:
            old_val = simulated_features.get(lever, 0.0)
            new_val = float(scenario_deltas[lever])
            simulated_features[lever] = new_val
            applied_changes.append({
                "lever": lever,
                "original_value": old_val,
                "simulated_value": new_val,
                "delta": round(new_val - old_val, 4)
            })

    # Recalculate dependent features if income or surplus modified
    if "avg_monthly_income" in scenario_deltas:
        new_inc = simulated_features["avg_monthly_income"]
        exp = simulated_features.get("avg_monthly_expenses", new_inc * 0.6)
        simulated_features["estimated_surplus"] = max(0.0, new_inc - exp)
        simulated_features["surplus_ratio"] = simulated_features["estimated_surplus"] / (new_inc + 1e-5)
        simulated_features["affordable_emi_indicative"] = round(simulated_features["estimated_surplus"] * 0.38, 0)

    # Score base and simulated
    base_result = credit_engine.score_features(base_features)
    sim_result = credit_engine.score_features(simulated_features)

    score_delta = sim_result["credit_score"] - base_result["credit_score"]
    pd_delta = sim_result["probability_of_default"] - base_result["probability_of_default"]

    # Explain the delta drivers
    sim_explanation = explain_service.explain_prediction(simulated_features)

    return {
        "original_score": base_result["credit_score"],
        "simulated_score": sim_result["credit_score"],
        "score_delta": score_delta,
        "original_pd": base_result["probability_of_default"],
        "simulated_pd": sim_result["probability_of_default"],
        "pd_delta": round(pd_delta, 4),
        "original_decision_band": base_result["decision_band"],
        "simulated_decision_band": sim_result["decision_band"],
        "applied_changes": applied_changes,
        "simulated_features": simulated_features,
        "disclaimer": "This scenario is purely hypothetical and intended for financial empowerment guidance. It does not constitute a guaranteed credit commitment."
    }
