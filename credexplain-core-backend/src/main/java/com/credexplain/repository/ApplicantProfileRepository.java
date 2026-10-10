package com.credexplain.repository;

import com.credexplain.model.ApplicantProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ApplicantProfileRepository extends JpaRepository<ApplicantProfile, Long> {
    Optional<ApplicantProfile> findByApplicantRefId(String applicantRefId);
    Optional<ApplicantProfile> findByDemoSlug(String demoSlug);
    Optional<ApplicantProfile> findByUserId(Long userId);
}
