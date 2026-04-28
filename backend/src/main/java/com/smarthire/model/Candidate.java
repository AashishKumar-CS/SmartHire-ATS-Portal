package com.smarthire.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// ===================== CANDIDATE =====================
public class Candidate {
    private int id;
    private String fullName;
    private String email;
    private String mobile;
    private String gender;
    private String address;
    private LocalDate dateOfBirth;
    private String domain;
    private String certifications;
    private String internshipStatus;
    private String githubLink;
    private String resumePath;
    private String profileImage;
    private String username;
    private String password;
    private double atsScore;
    private boolean mobileVerified;
    private LocalDateTime createdAt;
    private List<EducationDetail> educationDetails;
    private List<String> skills;

    public Candidate() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getCertifications() { return certifications; }
    public void setCertifications(String certifications) { this.certifications = certifications; }
    public String getInternshipStatus() { return internshipStatus; }
    public void setInternshipStatus(String internshipStatus) { this.internshipStatus = internshipStatus; }
    public String getGithubLink() { return githubLink; }
    public void setGithubLink(String githubLink) { this.githubLink = githubLink; }
    public String getResumePath() { return resumePath; }
    public void setResumePath(String resumePath) { this.resumePath = resumePath; }
    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public double getAtsScore() { return atsScore; }
    public void setAtsScore(double atsScore) { this.atsScore = atsScore; }
    public boolean isMobileVerified() { return mobileVerified; }
    public void setMobileVerified(boolean mobileVerified) { this.mobileVerified = mobileVerified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<EducationDetail> getEducationDetails() { return educationDetails; }
    public void setEducationDetails(List<EducationDetail> educationDetails) { this.educationDetails = educationDetails; }
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }
}
