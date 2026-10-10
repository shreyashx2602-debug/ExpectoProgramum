package com.credexplain;

import com.credexplain.model.ApplicantProfile;
import com.credexplain.model.DocumentRecord;
import com.credexplain.service.ApplicantService;
import com.credexplain.service.AuthService;
import com.credexplain.service.DocumentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CredExplainApplicationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private ApplicantService applicantService;

    @Autowired
    private DocumentService documentService;

    @Test
    void contextLoads() {
        assertNotNull(authService);
        assertNotNull(applicantService);
        assertNotNull(documentService);
    }

    @Test
    void testAuthRegistrationAndVerification() {
        Map<String, Object> reg = authService.register("officer.test@credexplain.com", "secure123", "Authorized Underwriter", "LOAN_OFFICER");
        assertNotNull(reg);
        assertEquals("LOAN_OFFICER", reg.get("role"));
        assertEquals("Authorized Underwriter", reg.get("fullName"));

        Map<String, Object> auth = authService.authenticate("officer.test@credexplain.com", "secure123");
        assertNotNull(auth);
        assertEquals("Authorized Underwriter", auth.get("fullName"));
    }

    @Test
    void testApplicantServiceInitialState() {
        List<ApplicantProfile> list = applicantService.getAllApplicants();
        assertNotNull(list);
    }

    @Test
    void testDocumentIngestionRule() {
        List<DocumentRecord> docs = documentService.getDocumentsByApplicant("APP-NONEXISTENT");
        assertTrue(docs.isEmpty());
    }
}
