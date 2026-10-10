package com.credexplain.repository;

import com.credexplain.model.DocumentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentRecordRepository extends JpaRepository<DocumentRecord, Long> {
    List<DocumentRecord> findByApplicantRefId(String applicantRefId);
}
