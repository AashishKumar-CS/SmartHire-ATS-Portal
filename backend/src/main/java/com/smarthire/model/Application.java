package com.smarthire.model;

import java.time.LocalDateTime;

public class Application {
    private int id;
    private int candidateId;
    private Integer jobId;
    private Integer thirdPartyJobId;
    private String jobType;
    private String status;
    private double matchScore;
    private String skillGap;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    // Extra fields for display
    private String candidateName;
    private String candidateEmail;
    private String jobTitle;
    private double atsScore;

    public Application() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getCandidateId() { return candidateId; }
    public void setCandidateId(int candidateId) { this.candidateId = candidateId; }
    public Integer getJobId() { return jobId; }
    public void setJobId(Integer jobId) { this.jobId = jobId; }
    public Integer getThirdPartyJobId() { return thirdPartyJobId; }
    public void setThirdPartyJobId(Integer thirdPartyJobId) { this.thirdPartyJobId = thirdPartyJobId; }
    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public double getMatchScore() { return matchScore; }
    public void setMatchScore(double matchScore) { this.matchScore = matchScore; }
    public String getSkillGap() { return skillGap; }
    public void setSkillGap(String skillGap) { this.skillGap = skillGap; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public String getCandidateEmail() { return candidateEmail; }
    public void setCandidateEmail(String candidateEmail) { this.candidateEmail = candidateEmail; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public double getAtsScore() { return atsScore; }
    public void setAtsScore(double atsScore) { this.atsScore = atsScore; }
}
