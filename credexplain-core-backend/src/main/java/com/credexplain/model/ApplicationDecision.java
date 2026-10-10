package com.credexplain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "application_decisions")
public class ApplicationDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String applicantRefId;

    private Integer modelScore;
    private Double probabilityOfDefault;
    private String modelDecisionBand;
    private String modelRecommendation;

    @Column(nullable = false)
    private String humanDecision; // APPROVED, REFERRED_MANUAL_REVIEW, DECLINED

    @Column(nullable = false)
    private String loanOfficerName;

    @Column(length = 2000)
    private String decisionNotes;

    @Column(length = 2000)
    private String adverseActionReasons;

    private Double approvedAmount;
    private LocalDateTime decisionTimestamp = LocalDateTime.now();

    public ApplicationDecision() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplicantRefId() { return applicantRefId; }
    public void setApplicantRefId(String applicantRefId) { this.applicantRefId = applicantRefId; }

    public Integer getModelScore() { return modelScore; }
    public void setModelScore(Integer modelScore) { this.modelScore = modelScore; }

    public Double getProbabilityOfDefault() { return probabilityOfDefault; }
    public void setProbabilityOfDefault(Double probabilityOfDefault) { this.probabilityOfDefault = probabilityOfDefault; }

    public String getModelDecisionBand() { return modelDecisionBand; }
    public void setModelDecisionBand(String modelDecisionBand) { this.modelDecisionBand = modelDecisionBand; }

    public String getModelRecommendation() { return modelRecommendation; }
    public void setModelRecommendation(String modelRecommendation) { this.modelRecommendation = modelRecommendation; }

    public String getHumanDecision() { return humanDecision; }
    public void setHumanDecision(String humanDecision) { this.humanDecision = humanDecision; }

    public String getLoanOfficerName() { return loanOfficerName; }
    public void setLoanOfficerName(String loanOfficerName) { this.loanOfficerName = loanOfficerName; }

    public String getDecisionNotes() { return decisionNotes; }
    public void setDecisionNotes(String decisionNotes) { this.decisionNotes = decisionNotes; }

    public String getAdverseActionReasons() { return adverseActionReasons; }
    public void setAdverseActionReasons(String adverseActionReasons) { this.adverseActionReasons = adverseActionReasons; }

    public Double getApprovedAmount() { return approvedAmount; }
    public void setApprovedAmount(Double approvedAmount) { this.approvedAmount = approvedAmount; }

    public LocalDateTime getDecisionTimestamp() { return decisionTimestamp; }
    public void setDecisionTimestamp(LocalDateTime decisionTimestamp) { this.decisionTimestamp = decisionTimestamp; }
}
