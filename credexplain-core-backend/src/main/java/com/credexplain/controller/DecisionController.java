package com.credexplain.controller;

import com.credexplain.model.ApplicationDecision;
import com.credexplain.repository.ApplicationDecisionRepository;
import com.credexplain.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/decisions")
public class DecisionController {

    private final ApplicationDecisionRepository decisionRepository;
    private final AuditService auditService;

    public DecisionController(ApplicationDecisionRepository decisionRepository, AuditService auditService) {
        this.decisionRepository = decisionRepository;
        this.auditService = auditService;
    }

    @GetMapping("/applicant/{refId}")
    public ResponseEntity<List<ApplicationDecision>> getDecisionsForApplicant(@PathVariable String refId) {
        return ResponseEntity.ok(decisionRepository.findByApplicantRefId(refId));
    }

    @PostMapping
    public ResponseEntity<ApplicationDecision> recordDecision(@RequestBody ApplicationDecision decision) {
        ApplicationDecision saved = decisionRepository.save(decision);
        auditService.logEvent(
                decision.getLoanOfficerName(),
                "DECISION_RECORDED",
                "APPLICATION",
                decision.getApplicantRefId(),
                "Recorded human decision: " + decision.getHumanDecision() + " (Model Score: " + decision.getModelScore() + "). Notes: " + decision.getDecisionNotes()
        );
        return ResponseEntity.ok(saved);
    }
}
