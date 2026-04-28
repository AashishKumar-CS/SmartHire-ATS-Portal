package com.smarthire.model;

public class EducationDetail {
    private int id;
    private int candidateId;
    private String level;
    private String institutionName;
    private String boardUniversity;
    private int yearOfPassing;
    private String percentageCgpa;

    public EducationDetail() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getCandidateId() { return candidateId; }
    public void setCandidateId(int candidateId) { this.candidateId = candidateId; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getInstitutionName() { return institutionName; }
    public void setInstitutionName(String institutionName) { this.institutionName = institutionName; }
    public String getBoardUniversity() { return boardUniversity; }
    public void setBoardUniversity(String boardUniversity) { this.boardUniversity = boardUniversity; }
    public int getYearOfPassing() { return yearOfPassing; }
    public void setYearOfPassing(int yearOfPassing) { this.yearOfPassing = yearOfPassing; }
    public String getPercentageCgpa() { return percentageCgpa; }
    public void setPercentageCgpa(String percentageCgpa) { this.percentageCgpa = percentageCgpa; }
}
