package com.smarthire.service;

import com.smarthire.dao.*;
import com.smarthire.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class JobService {

    @Autowired private JobDAO jobDAO;
    @Autowired private ApplicationDAO applicationDAO;
    @Autowired private CandidateDAO candidateDAO;
    @Autowired private AIService aiService;
    @Autowired private EmailService emailService;

    // ✅ CREATE JOB
    public Map<String, Object> createJob(Job job) {
        int id = jobDAO.save(job);
        return Map.of("success", true, "message", "Job created", "jobId", id);
    }

    // ✅ UPDATE JOB
    public Map<String, Object> updateJob(Job job) {
        jobDAO.update(job);
        return Map.of("success", true, "message", "Job updated");
    }

    // ✅ FETCH JOBS
    public List<Job> getOpenJobs() {
        return jobDAO.findOpen();
    }

    public List<Job> getAllJobs() {
        return jobDAO.findAll();
    }

    public List<ThirdPartyJob> getThirdPartyJobs() {
        return jobDAO.findAllThirdPartyJobs();
    }

    public Optional<Job> getJobById(int id) {
        return jobDAO.findById(id);
    }

    // ✅ APPLY JOB (UPDATED FOR GEMINI)
    public Map<String, Object> applyJob(int candidateId, Integer jobId, Integer thirdPartyJobId, String jobType) {

        if (applicationDAO.alreadyApplied(candidateId, jobId, thirdPartyJobId))
            return Map.of("success", false, "message", "Already applied");

        List<String> skills = candidateDAO.findSkillsByCandidateId(candidateId);
        String candidateSkillsStr = String.join(", ", skills);

        String jobTitle = "";
        String jobSkills = "";

        if (jobId != null) {
            Optional<Job> jobOpt = jobDAO.findById(jobId);
            if (jobOpt.isPresent()) {
                jobTitle = jobOpt.get().getTitle();
                jobSkills = jobOpt.get().getRequiredSkills();
            }
        } else if (thirdPartyJobId != null) {
            Optional<ThirdPartyJob> tpOpt = jobDAO.findThirdPartyJobById(thirdPartyJobId);
            if (tpOpt.isPresent()) {
                jobTitle = tpOpt.get().getTitle();
                jobSkills = tpOpt.get().getRequiredSkills();
            }
        }

        // 🔥 Gemini AI
        AIService.CombinedResult result = aiService.analyzeCandidate(
                "",
                candidateSkillsStr,
                jobTitle,
                jobSkills
        );

        double matchScore = result.getMatchScore();
        String skillGap = result.getMissingSkills() != null
                ? String.join(", ", result.getMissingSkills())
                : "";

        Application app = new Application();
        app.setCandidateId(candidateId);
        app.setJobId(jobId);
        app.setThirdPartyJobId(thirdPartyJobId);
        app.setJobType(jobType != null ? jobType : (jobId != null ? "internal" : "external"));
        app.setMatchScore(matchScore);
        app.setSkillGap(skillGap);

        int appId = applicationDAO.save(app);

        return Map.of(
                "success", true,
                "message", "Application submitted",
                "applicationId", appId,
                "matchScore", matchScore,
                "skillGap", skillGap
        );
    }

    // ✅ APPLICATION FETCH
    public List<Application> getCandidateApplications(int candidateId) {
        return applicationDAO.findByCandidateId(candidateId);
    }

    public List<Application> getJobApplications(int jobId) {
        List<Application> apps = applicationDAO.findByJobId(jobId);
        apps.sort(Comparator.comparingDouble(Application::getMatchScore).reversed());
        return apps;
    }

    public List<Application> getAllApplications() {
        return applicationDAO.findAll();
    }

    // ✅ STATUS UPDATE
    public Map<String, Object> updateApplicationStatus(int appId, String status, String feedback) {

        Optional<Application> appOpt = applicationDAO.findById(appId);
        if (appOpt.isEmpty())
            return Map.of("success", false, "message", "Application not found");

        applicationDAO.updateStatus(appId, status);

        Application app = appOpt.get();

        Optional<Candidate> candidateOpt = candidateDAO.findById(app.getCandidateId());

        if (candidateOpt.isPresent()) {
            Candidate c = candidateOpt.get();
            try {
                if ("Selected".equalsIgnoreCase(status)) {
                    emailService.sendSelectionEmail(c.getEmail(), c.getFullName(), "the position");
                } else if ("Rejected".equalsIgnoreCase(status)) {
                    emailService.sendRejectionEmail(c.getEmail(), c.getFullName(), "the position", feedback);
                }
            } catch (Exception e) {
                System.err.println("Email failed: " + e.getMessage());
            }
        }

        return Map.of("success", true, "message", "Status updated");
    }

    // ✅ CLOSE JOB
    public Map<String, Object> closeJob(int jobId) {
        jobDAO.updateStatus(jobId, "Closed");
        return Map.of("success", true, "message", "Job closed");
    }

    // ✅ DASHBOARD
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCandidates", candidateDAO.findAll().size());
        stats.put("totalJobs", jobDAO.findAll().size());
        stats.put("openJobs", jobDAO.findOpen().size());
        stats.put("totalApplications", applicationDAO.findAll().size());
        return Map.of("success", true, "data", stats);
    }
}