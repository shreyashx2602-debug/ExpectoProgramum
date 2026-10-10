package com.credexplain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_records")
public class DocumentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String applicantRefId;

    @Column(nullable = false)
    private String documentType; // INCOME_CERT, RENT_AGREEMENT, ELECTRICITY_BILL, PASSBOOK, EMI_HISTORY

    @Column(nullable = false)
    private String fileName;

    private String fileFormat;
    private Long fileSizeBytes;
    private LocalDateTime uploadDate = LocalDateTime.now();

    @Column(nullable = false)
    private String verificationStatus; // VERIFIED, NEEDS_MANUAL_REVIEW, SUSPECTED_ISSUE

    @Column(length = 2000)
    private String ocrExtractedData;

    @Column(length = 1000)
    private String consistencyNotes;

    @Column(length = 1000)
    private String reviewerNotes;

    private String verifiedBy;

    public DocumentRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplicantRefId() { return applicantRefId; }
    public void setApplicantRefId(String applicantRefId) { this.applicantRefId = applicantRefId; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileFormat() { return fileFormat; }
    public void setFileFormat(String fileFormat) { this.fileFormat = fileFormat; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public LocalDateTime getUploadDate() { return uploadDate; }
    public void setUploadDate(LocalDateTime uploadDate) { this.uploadDate = uploadDate; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getOcrExtractedData() { return ocrExtractedData; }
    public void setOcrExtractedData(String ocrExtractedData) { this.ocrExtractedData = ocrExtractedData; }

    public String getConsistencyNotes() { return consistencyNotes; }
    public void setConsistencyNotes(String consistencyNotes) { this.consistencyNotes = consistencyNotes; }

    public String getReviewerNotes() { return reviewerNotes; }
    public void setReviewerNotes(String reviewerNotes) { this.reviewerNotes = reviewerNotes; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
}
