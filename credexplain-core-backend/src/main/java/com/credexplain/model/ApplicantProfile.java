package com.credexplain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "applicant_profiles")
public class ApplicantProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String applicantRefId;

    private Long userId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String occupation;

    private String businessName;
    private String businessType;
    private String businessVintage;
    private Double businessAgeYears = 3.0;
    private String contactPhone;
    private String location;
    private Boolean hasInventory = false;
    private String identityVerificationStatus = "UNVERIFIED";
    private String rentTenancyStatus = "UNVERIFIED";
    private String verificationStatus = "PENDING_DOCUMENTS";
    private Integer profileCompletionPct = 50;
    private String demoSlug;

    private String governmentIdType = "AADHAAR";
    private String governmentIdNumber;
    private String idVerificationDetails;
    private String aadhaarFileName;

    private String landlordName;
    private Double monthlyRentAmount;
    private String premisesAddress;
    private String leaseTenure;
    private String rentAgreementFileName;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public ApplicantProfile() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplicantRefId() { return applicantRefId; }
    public void setApplicantRefId(String applicantRefId) { this.applicantRefId = applicantRefId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }

    public String getBusinessVintage() { return businessVintage; }
    public void setBusinessVintage(String businessVintage) { this.businessVintage = businessVintage; }

    public Double getBusinessAgeYears() { return businessAgeYears; }
    public void setBusinessAgeYears(Double businessAgeYears) { this.businessAgeYears = businessAgeYears; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Boolean getHasInventory() { return hasInventory; }
    public void setHasInventory(Boolean hasInventory) { this.hasInventory = hasInventory; }

    public String getIdentityVerificationStatus() { return identityVerificationStatus; }
    public void setIdentityVerificationStatus(String identityVerificationStatus) { this.identityVerificationStatus = identityVerificationStatus; }

    public String getRentTenancyStatus() { return rentTenancyStatus; }
    public void setRentTenancyStatus(String rentTenancyStatus) { this.rentTenancyStatus = rentTenancyStatus; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public Integer getProfileCompletionPct() { return profileCompletionPct; }
    public void setProfileCompletionPct(Integer profileCompletionPct) { this.profileCompletionPct = profileCompletionPct; }

    public String getDemoSlug() { return demoSlug; }
    public void setDemoSlug(String demoSlug) { this.demoSlug = demoSlug; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getGovernmentIdType() { return governmentIdType; }
    public void setGovernmentIdType(String governmentIdType) { this.governmentIdType = governmentIdType; }

    public String getGovernmentIdNumber() { return governmentIdNumber; }
    public void setGovernmentIdNumber(String governmentIdNumber) { this.governmentIdNumber = governmentIdNumber; }

    public String getIdVerificationDetails() { return idVerificationDetails; }
    public void setIdVerificationDetails(String idVerificationDetails) { this.idVerificationDetails = idVerificationDetails; }

    public String getAadhaarFileName() { return aadhaarFileName; }
    public void setAadhaarFileName(String aadhaarFileName) { this.aadhaarFileName = aadhaarFileName; }

    public String getLandlordName() { return landlordName; }
    public void setLandlordName(String landlordName) { this.landlordName = landlordName; }

    public Double getMonthlyRentAmount() { return monthlyRentAmount; }
    public void setMonthlyRentAmount(Double monthlyRentAmount) { this.monthlyRentAmount = monthlyRentAmount; }

    public String getPremisesAddress() { return premisesAddress; }
    public void setPremisesAddress(String premisesAddress) { this.premisesAddress = premisesAddress; }

    public String getLeaseTenure() { return leaseTenure; }
    public void setLeaseTenure(String leaseTenure) { this.leaseTenure = leaseTenure; }

    public String getRentAgreementFileName() { return rentAgreementFileName; }
    public void setRentAgreementFileName(String rentAgreementFileName) { this.rentAgreementFileName = rentAgreementFileName; }
}
