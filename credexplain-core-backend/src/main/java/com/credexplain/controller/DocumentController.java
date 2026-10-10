package com.credexplain.controller;

import com.credexplain.model.DocumentRecord;
import com.credexplain.service.ApplicantService;
import com.credexplain.service.AuditService;
import com.credexplain.service.DocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final AuditService auditService;
    private final ApplicantService applicantService;

    public DocumentController(DocumentService documentService, AuditService auditService, ApplicantService applicantService) {
        this.documentService = documentService;
        this.auditService = auditService;
        this.applicantService = applicantService;
    }

    @GetMapping("/applicant/{refId}")
    public ResponseEntity<List<DocumentRecord>> getDocumentsByApplicant(@PathVariable String refId) {
        return ResponseEntity.ok(documentService.getDocumentsByApplicant(refId));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("applicantRefId") String applicantRefId,
            @RequestParam("documentType") String documentType,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            DocumentRecord doc = documentService.processUploadedDocument(
                    applicantRefId,
                    documentType,
                    file.getOriginalFilename(),
                    file.getSize()
            );
            if ("VERIFIED".equals(doc.getVerificationStatus())) {
                applicantService.getByRefId(applicantRefId).ifPresent(app -> {
                    if ("INCOME_CERT".equals(documentType) || "GOVT_ID".equals(documentType)) {
                        app.setIdentityVerificationStatus("VERIFIED");
                    }
                    if ("RENT_AGREEMENT".equals(documentType)) {
                        app.setRentTenancyStatus("VERIFIED_LEASE");
                    }
                    List<DocumentRecord> docs = documentService.getDocumentsByApplicant(applicantRefId);
                    long verifiedCount = docs.stream()
                            .filter(d -> "VERIFIED".equals(d.getVerificationStatus()))
                            .map(DocumentRecord::getDocumentType)
                            .distinct()
                            .count();
                    if (verifiedCount >= 3) {
                        app.setVerificationStatus("VERIFIED");
                    } else {
                        app.setVerificationStatus("IN_REVIEW");
                    }
                    applicantService.save(app);
                });
            }
            auditService.logEvent("Applicant", "DOCUMENT_UPLOADED", "DOCUMENT", doc.getId().toString(),
                    "Uploaded " + documentType + " (" + file.getOriginalFilename() + ") -> Status: " + doc.getVerificationStatus());
            return ResponseEntity.ok(doc);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload document: " + e.getMessage()));
        }
    }

    @PutMapping("/{docId}/review")
    public ResponseEntity<?> reviewDocument(
            @PathVariable Long docId,
            @RequestBody Map<String, String> payload
    ) {
        String status = payload.get("status");
        String notes = payload.get("reviewerNotes");
        String officerName = payload.getOrDefault("officerName", "Loan Officer");

        DocumentRecord updated = documentService.updateReview(docId, status, notes, officerName);
        auditService.logEvent(officerName, "DOCUMENT_REVIEWED", "DOCUMENT", docId.toString(),
                "Updated status to " + status + " with note: " + notes);
        return ResponseEntity.ok(updated);
    }
}
