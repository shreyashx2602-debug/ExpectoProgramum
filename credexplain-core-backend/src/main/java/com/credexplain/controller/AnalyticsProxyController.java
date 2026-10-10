package com.credexplain.controller;

import com.credexplain.service.MlProxyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsProxyController {

    private final MlProxyService mlProxyService;

    public AnalyticsProxyController(MlProxyService mlProxyService) {
        this.mlProxyService = mlProxyService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getMlHealth() {
        return ResponseEntity.ok(mlProxyService.getHealth());
    }

    @GetMapping("/model-performance")
    public ResponseEntity<Map<String, Object>> getModelPerformance() {
        return ResponseEntity.ok(mlProxyService.getModelPerformance());
    }

    @GetMapping("/global-explanations")
    public ResponseEntity<Map<String, Object>> getGlobalExplanations() {
        return ResponseEntity.ok(mlProxyService.getGlobalExplanations());
    }

    @GetMapping("/fairness")
    public ResponseEntity<Map<String, Object>> getFairnessAudit() {
        return ResponseEntity.ok(mlProxyService.getFairnessAudit());
    }

    @GetMapping("/applicant-analysis/{slug}")
    public ResponseEntity<Map<String, Object>> getApplicantAnalysis(@PathVariable String slug) {
        return ResponseEntity.ok(mlProxyService.getDemoApplicantAnalysis(slug));
    }

    @PostMapping("/score-features")
    public ResponseEntity<Map<String, Object>> scoreFeatures(@RequestBody Map<String, Object> features) {
        return ResponseEntity.ok(mlProxyService.scoreFeatures(features));
    }

    @PostMapping("/what-if")
    public ResponseEntity<Map<String, Object>> simulateWhatIf(@RequestBody Map<String, Object> payload) {
        Map<String, Object> base = (Map<String, Object>) payload.get("base_features");
        Map<String, Object> deltas = (Map<String, Object>) payload.get("scenario_deltas");
        return ResponseEntity.ok(mlProxyService.simulateWhatIf(base, deltas));
    }
}
