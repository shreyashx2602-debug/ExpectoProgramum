package com.credexplain.repository;

import com.credexplain.model.ApplicationDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationDecisionRepository extends JpaRepository<ApplicationDecision, Long> {
    List<ApplicationDecision> findByApplicantRefId(String applicantRefId);
    Optional<ApplicationDecision> findTopByApplicantRefIdOrderByDecisionTimestampDesc(String applicantRefId);
}
