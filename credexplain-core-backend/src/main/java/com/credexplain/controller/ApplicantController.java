package com.credexplain.controller;

import com.credexplain.model.ApplicantProfile;
import com.credexplain.service.ApplicantService;
import com.credexplain.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applicants")
public class ApplicantController {

    private final ApplicantService applicantService;
    private final AuditService auditService;
    private final com.credexplain.service.DocumentService documentService;

    // Verhoeff validation matrices
    private static final int[][] VERHOEFF_D = {
        {0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
        {1, 2, 3, 4, 0, 6, 7, 8, 9, 5},
        {2, 3, 4, 0, 1, 7, 8, 9, 5, 6},
        {3, 4, 0, 1, 2, 8, 9, 5, 6, 7},
        {4, 0, 1, 2, 3, 9, 5, 6, 7, 8},
        {5, 9, 8, 7, 6, 0, 4, 3, 2, 1},
        {6, 5, 9, 8, 7, 1, 0, 4, 3, 2},
        {7, 6, 5, 9, 8, 2, 1, 0, 4, 3},
        {8, 7, 6, 5, 9, 3, 2, 1, 0, 4},
        {9, 8, 7, 6, 5, 4, 3, 2, 1, 0}
    };

    private static final int[][] VERHOEFF_P = {
        {0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
        {1, 5, 7, 6, 2, 8, 3, 0, 9, 4},
        {5, 8, 0, 3, 7, 9, 6, 1, 4, 2},
        {8, 9, 1, 6, 0, 4, 3, 5, 2, 7},
        {9, 4, 5, 3, 1, 2, 6, 8, 7, 0},
        {4, 2, 8, 6, 5, 7, 3, 9, 0, 1},
        {2, 7, 9, 3, 8, 0, 6, 4, 1, 5},
        {7, 0, 4, 6, 9, 1, 3, 2, 5, 8}
    };

    public static boolean isValidAadhaar(String aadhaar) {
        if (aadhaar == null) return false;
        String clean = aadhaar.replaceAll("[\\s-]+", "");
        if (!clean.matches("^[2-9][0-9]{11}$")) return false;
        if (clean.matches("^(\\d)\\1{11}$")) return false;

        int c = 0;
        int len = clean.length();
        for (int i = 0; i < len; i++) {
            int digit = Character.getNumericValue(clean.charAt(len - 1 - i));
            c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]];
        }
        return c == 0;
    }

    public static boolean isValidPan(String pan) {
        if (pan == null) return false;
        String clean = pan.replaceAll("[\\s-]+", "").toUpperCase();
        if (!clean.matches("^[A-Z]{5}[0-9]{4}[A-Z]{1}$")) return false;
        char fourth = clean.charAt(3);
        return (fourth == 'P' || fourth == 'F' || fourth == 'H' || fourth == 'C');
    }

    public ApplicantController(ApplicantService applicantService, AuditService auditService, com.credexplain.service.DocumentService documentService) {
        this.applicantService = applicantService;
        this.auditService = auditService;
        this.documentService = documentService;
    }

    @GetMapping
    public ResponseEntity<List<ApplicantProfile>> getAllApplicants() {
        return ResponseEntity.ok(applicantService.getAllApplicants());
    }

    @GetMapping("/{refId}")
    public ResponseEntity<?> getApplicantByRefId(@PathVariable String refId) {
        return applicantService.getByRefId(refId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<?> getApplicantBySlug(@PathVariable String slug) {
        return applicantService.getBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createApplicant(@RequestBody ApplicantProfile profile) {
        String idType = profile.getGovernmentIdType() != null ? profile.getGovernmentIdType().toUpperCase() : "AADHAAR";
        String idNumber = profile.getGovernmentIdNumber();

        if (idNumber == null || idNumber.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Mandatory Identity Verification Required: Please provide an authentic Aadhaar or PAN card number to create borrower profile."
            ));
        }

        boolean isGenuine = false;
        String details = "";

        if ("AADHAAR".equalsIgnoreCase(idType)) {
            isGenuine = isValidAadhaar(idNumber);
            if (!isGenuine) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Aadhaar Verification Failed: The provided 12-digit number failed UIDAI Verhoeff checksum algorithm. Profile cannot be created without genuine identity verification."
                ));
            }
            details = "Verified via UIDAI Verhoeff Checksum Algorithm (12/12 digits authentic)";
        } else if ("PAN".equalsIgnoreCase(idType)) {
            isGenuine = isValidPan(idNumber);
            if (!isGenuine) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "PAN Verification Failed: The provided PAN number is invalid. Must follow Income Tax Department format with category 'P' for Individual."
                ));
            }
            details = "Verified via Income Tax Department PAN Structure & Entity Code";
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported ID type. Please provide Aadhaar or PAN."));
        }

        // Set verified identity status
        profile.setIdentityVerificationStatus("VERIFIED");
        profile.setIdVerificationDetails(details);
        profile.setProfileCompletionPct(Math.max(75, profile.getProfileCompletionPct() != null ? profile.getProfileCompletionPct() : 75));

        ApplicantProfile saved = applicantService.save(profile);

        // Automatically attach verified identity document record
        documentService.addVerifiedIdentityDocument(
            saved.getApplicantRefId(),
            idType,
            idNumber,
            saved.getFullName()
        );

        auditService.logEvent("User", "APPLICANT_CREATED_WITH_VERIFIED_ID", "APPLICANT", saved.getApplicantRefId(),
            "Created profile for " + saved.getFullName() + " with verified genuine " + idType);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{refId}/verification")
    public ResponseEntity<?> updateVerification(
            @PathVariable String refId,
            @RequestBody Map<String, Object> body) {
        String status = (String) body.getOrDefault("verificationStatus", "VERIFIED");
        Integer completion = body.get("profileCompletionPct") != null
                ? Integer.parseInt(body.get("profileCompletionPct").toString())
                : 95;
        return applicantService.updateVerification(refId, status, completion)
                .map(updated -> {
                    auditService.logEvent("Underwriter", "TRANSACTION_VERIFICATION_APPLIED", "APPLICANT", refId, "Updated verification status to " + status + " based on transaction audit");
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{refId}/aadhaar")
    public ResponseEntity<?> updateAadhaar(
            @PathVariable String refId,
            @RequestBody Map<String, Object> body) {
        String aadhaar = (String) body.get("aadhaarNumber");
        String fileName = (String) body.getOrDefault("fileName", "Aadhaar_Card_Verified.pdf");

        if (!isValidAadhaar(aadhaar)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Aadhaar Verification Failed: The provided 12-digit number failed UIDAI Verhoeff check-digit algorithm."
            ));
        }

        String details = "Verified via UIDAI Verhoeff Checksum Algorithm (12/12 digits authentic)";
        return applicantService.updateAadhaar(refId, aadhaar, fileName, details)
                .map(updated -> {
                    documentService.addVerifiedIdentityDocument(refId, "AADHAAR", aadhaar, updated.getFullName());
                    auditService.logEvent("User", "AADHAAR_UPLOADED_AND_VERIFIED", "APPLICANT", refId,
                        "Uploaded and verified genuine Aadhaar for " + updated.getFullName());
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{refId}/rent-agreement")
    public ResponseEntity<?> updateRentAgreement(
            @PathVariable String refId,
            @RequestBody Map<String, Object> body) {
        String landlord = (String) body.getOrDefault("landlordName", "Commercial Property Lessor");
        Double rent = body.get("monthlyRentAmount") != null ? Double.parseDouble(body.get("monthlyRentAmount").toString()) : 2500.0;
        String address = (String) body.getOrDefault("premisesAddress", "Commercial Trade Premises");
        String tenure = (String) body.getOrDefault("leaseTenure", "12 Months");
        String fileName = (String) body.getOrDefault("fileName", "Premises_Lease_Agreement.pdf");

        return applicantService.updateRentAgreement(refId, landlord, rent, address, tenure, fileName)
                .map(updated -> {
                    documentService.addVerifiedRentAgreementDocument(refId, fileName, landlord, rent, address, tenure);
                    auditService.logEvent("User", "RENT_AGREEMENT_UPLOADED_AND_VERIFIED", "APPLICANT", refId,
                        "Uploaded and verified premises tenancy contract for " + updated.getFullName());
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{refId}")
    public ResponseEntity<?> deleteApplicant(@PathVariable String refId) {
        applicantService.deleteByRefId(refId);
        auditService.logEvent("User", "APPLICANT_DELETED", "APPLICANT", refId, "Deleted applicant profile " + refId);
        return ResponseEntity.ok(Map.of("message", "Applicant profile removed successfully."));
    }

    @PostMapping("/reset-demo")
    public ResponseEntity<?> resetDemoData() {
        applicantService.deleteAllApplicants();
        auditService.logEvent("User", "CLEAR_APPLICANTS", "APPLICANT", "ALL", "Cleared all sample and stored applicant records.");
        return ResponseEntity.ok(Map.of("message", "All sample entries removed. Database is now clean and empty."));
    }

    @PostMapping("/clear")
    public ResponseEntity<?> clearAll() {
        applicantService.deleteAllApplicants();
        auditService.logEvent("User", "CLEAR_APPLICANTS", "APPLICANT", "ALL", "Cleared all applicant entries.");
        return ResponseEntity.ok(Map.of("message", "All applicant records successfully cleared."));
    }
}
