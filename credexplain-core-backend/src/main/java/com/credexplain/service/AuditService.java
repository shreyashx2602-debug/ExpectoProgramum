package com.credexplain.service;

import com.credexplain.model.AuditEvent;
import com.credexplain.repository.AuditEventRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    public AuditService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
        seedInitialAuditEvents();
    }

    public void seedInitialAuditEvents() {
        if (auditEventRepository.count() == 0) {
            auditEventRepository.saveAll(Arrays.asList(
                new AuditEvent("System", "MODEL_INITIALIZED", "MODEL", "v1.4.2", "Platt calibrated scoring model initialized with 24 behavioral features. Baseline AUC-ROC 0.7994 verified."),
                new AuditEvent("System", "PLATFORM_INITIALIZED", "SYSTEM", "SYS-001", "Core underwriting engine and explainable AI pipelines active.")
            ));
        }
    }

    public AuditEvent logEvent(String actor, String action, String resourceType, String resourceId, String details) {
        AuditEvent event = new AuditEvent(actor, action, resourceType, resourceId, details);
        return auditEventRepository.save(event);
    }

    public List<AuditEvent> getRecentEvents() {
        return auditEventRepository.findTop50ByOrderByEventTimestampDesc();
    }
}
