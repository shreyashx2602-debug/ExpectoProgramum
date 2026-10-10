package com.credexplain.service;

import com.credexplain.model.ApplicantProfile;
import com.credexplain.repository.ApplicantProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ApplicantService {

    private final ApplicantProfileRepository profileRepository;

    public ApplicantService(ApplicantProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public void seedDemoApplicants() {
        // No hardcoded sample records seeded - database remains empty until user provides data
    }

    public void deleteAllApplicants() {
        profileRepository.deleteAll();
    }

    public void deleteByRefId(String refId) {
        profileRepository.findByApplicantRefId(refId).ifPresent(profileRepository::delete);
    }

    public List<ApplicantProfile> getAllApplicants() {
        return profileRepository.findAll();
    }

    public Optional<ApplicantProfile> getByRefId(String refId) {
        return profileRepository.findByApplicantRefId(refId);
    }

    public Optional<ApplicantProfile> getBySlug(String slug) {
        return profileRepository.findByDemoSlug(slug);
    }

    public ApplicantProfile save(ApplicantProfile profile) {
        if (profile.getApplicantRefId() == null || profile.getApplicantRefId().trim().isEmpty()) {
            profile.setApplicantRefId("APP-" + java.time.Year.now().getValue() + "-" + String.format("%03d", (int)(Math.random() * 900) + 100));
        }
        if (profile.getDemoSlug() == null || profile.getDemoSlug().trim().isEmpty()) {
            String slug = (profile.getFullName() != null ? profile.getFullName().toLowerCase().replaceAll("[^a-z0-9]+", "_") : "applicant");
            profile.setDemoSlug(slug + "_" + (int)(Math.random() * 1000));
        }
        profile.setUpdatedAt(LocalDateTime.now());
        return profileRepository.save(profile);
    }

    public Optional<ApplicantProfile> updateVerification(String refId, String status, Integer completionPct) {
        return profileRepository.findByApplicantRefId(refId).map(existing -> {
            if (status != null) {
                existing.setVerificationStatus(status);
                if ("VERIFIED".equalsIgnoreCase(status)) {
                    existing.setIdentityVerificationStatus("VERIFIED");
                }
            }
            if (completionPct != null) {
                existing.setProfileCompletionPct(completionPct);
            }
            existing.setUpdatedAt(LocalDateTime.now());
            return profileRepository.save(existing);
        });
    }

    public Optional<ApplicantProfile> updateAadhaar(String refId, String aadhaarNum, String fileName, String details) {
        return profileRepository.findByApplicantRefId(refId).map(existing -> {
            existing.setGovernmentIdType("AADHAAR");
            existing.setGovernmentIdNumber(aadhaarNum);
            existing.setAadhaarFileName(fileName);
            existing.setIdentityVerificationStatus("VERIFIED");
            existing.setIdVerificationDetails(details);
            if (existing.getProfileCompletionPct() == null || existing.getProfileCompletionPct() < 75) {
                existing.setProfileCompletionPct(75);
            }
            existing.setUpdatedAt(LocalDateTime.now());
            return profileRepository.save(existing);
        });
    }

    public Optional<ApplicantProfile> updateRentAgreement(String refId, String landlord, Double rent, String address, String tenure, String fileName) {
        return profileRepository.findByApplicantRefId(refId).map(existing -> {
            existing.setLandlordName(landlord);
            existing.setMonthlyRentAmount(rent);
            existing.setPremisesAddress(address);
            existing.setLeaseTenure(tenure);
            existing.setRentAgreementFileName(fileName);
            existing.setRentTenancyStatus("VERIFIED_LEASE");
            int completion = 75;
            if ("VERIFIED".equalsIgnoreCase(existing.getIdentityVerificationStatus())) {
                completion = 90;
            }
            existing.setProfileCompletionPct(Math.max(completion, existing.getProfileCompletionPct() != null ? existing.getProfileCompletionPct() : completion));
            existing.setUpdatedAt(LocalDateTime.now());
            return profileRepository.save(existing);
        });
    }
}
