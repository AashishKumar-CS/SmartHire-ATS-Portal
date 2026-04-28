package com.smarthire.dao;

import com.smarthire.model.Candidate;
import com.smarthire.model.EducationDetail;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.List;
import java.util.Optional;

@Repository
public class CandidateDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private RowMapper<Candidate> candidateMapper = (rs, rowNum) -> {
        Candidate c = new Candidate();
        c.setId(rs.getInt("id"));
        c.setFullName(rs.getString("full_name"));
        c.setEmail(rs.getString("email"));
        c.setMobile(rs.getString("mobile"));
        c.setGender(rs.getString("gender"));
        c.setAddress(rs.getString("address"));
        c.setDateOfBirth(rs.getDate("date_of_birth") != null ? rs.getDate("date_of_birth").toLocalDate() : null);
        c.setDomain(rs.getString("domain"));
        c.setCertifications(rs.getString("certifications"));
        c.setInternshipStatus(rs.getString("internship_status"));
        c.setGithubLink(rs.getString("github_link"));
        c.setResumePath(rs.getString("resume_path"));
        c.setProfileImage(rs.getString("profile_image"));
        c.setUsername(rs.getString("username"));
        c.setAtsScore(rs.getDouble("ats_score"));
        c.setMobileVerified(rs.getBoolean("mobile_verified"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) c.setCreatedAt(ts.toLocalDateTime());
        return c;
    };

    public int save(Candidate candidate) {
        String sql = "INSERT INTO candidates (full_name, email, mobile, gender, address, date_of_birth, domain, " +
                "certifications, internship_status, github_link, username, password, mobile_verified) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, candidate.getFullName());
            ps.setString(2, candidate.getEmail());
            ps.setString(3, candidate.getMobile());
            ps.setString(4, candidate.getGender());
            ps.setString(5, candidate.getAddress());
            ps.setDate(6, candidate.getDateOfBirth() != null ? Date.valueOf(candidate.getDateOfBirth()) : null);
            ps.setString(7, candidate.getDomain());
            ps.setString(8, candidate.getCertifications());
            ps.setString(9, candidate.getInternshipStatus());
            ps.setString(10, candidate.getGithubLink());
            ps.setString(11, candidate.getUsername());
            ps.setString(12, candidate.getPassword());
            ps.setBoolean(13, candidate.isMobileVerified());
            return ps;
        }, keyHolder);
        return keyHolder.getKey().intValue();
    }

    public Optional<Candidate> findByUsername(String username) {
        try {
            String sql = "SELECT * FROM candidates WHERE username = ?";
            Candidate c = jdbcTemplate.queryForObject(sql, candidateMapper, username);
            return Optional.ofNullable(c);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Optional<Candidate> findByEmail(String email) {
        try {
            String sql = "SELECT * FROM candidates WHERE email = ?";
            Candidate c = jdbcTemplate.queryForObject(sql, candidateMapper, email);
            return Optional.ofNullable(c);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Optional<Candidate> findById(int id) {
        try {
            String sql = "SELECT * FROM candidates WHERE id = ?";
            Candidate c = jdbcTemplate.queryForObject(sql, candidateMapper, id);
            return Optional.ofNullable(c);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<Candidate> findAll() {
        return jdbcTemplate.query("SELECT * FROM candidates ORDER BY created_at DESC", candidateMapper);
    }

    public void updateAtsScore(int candidateId, double score) {
        jdbcTemplate.update("UPDATE candidates SET ats_score = ? WHERE id = ?", score, candidateId);
    }

    public void updateResumePath(int candidateId, String path) {
        jdbcTemplate.update("UPDATE candidates SET resume_path = ? WHERE id = ?", path, candidateId);
    }

    public void updateProfileImage(int candidateId, String path) {
        jdbcTemplate.update("UPDATE candidates SET profile_image = ? WHERE id = ?", path, candidateId);
    }

    public void updateProfile(Candidate candidate) {
        String sql = "UPDATE candidates SET full_name=?, gender=?, address=?, date_of_birth=?, domain=?, " +
                "certifications=?, internship_status=?, github_link=? WHERE id=?";
        jdbcTemplate.update(sql,
                candidate.getFullName(), candidate.getGender(), candidate.getAddress(),
                candidate.getDateOfBirth() != null ? Date.valueOf(candidate.getDateOfBirth()) : null,
                candidate.getDomain(), candidate.getCertifications(),
                candidate.getInternshipStatus(), candidate.getGithubLink(), candidate.getId());
    }

    public void verifyMobile(int candidateId) {
        jdbcTemplate.update("UPDATE candidates SET mobile_verified = TRUE WHERE id = ?", candidateId);
    }

    // Education
    public void saveEducation(EducationDetail edu) {
        String sql = "INSERT INTO education_details (candidate_id, level, institution_name, board_university, year_of_passing, percentage_cgpa) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, edu.getCandidateId(), edu.getLevel(), edu.getInstitutionName(),
                edu.getBoardUniversity(), edu.getYearOfPassing(), edu.getPercentageCgpa());
    }

    public List<EducationDetail> findEducationByCandidateId(int candidateId) {
        String sql = "SELECT * FROM education_details WHERE candidate_id = ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            EducationDetail e = new EducationDetail();
            e.setId(rs.getInt("id"));
            e.setCandidateId(rs.getInt("candidate_id"));
            e.setLevel(rs.getString("level"));
            e.setInstitutionName(rs.getString("institution_name"));
            e.setBoardUniversity(rs.getString("board_university"));
            e.setYearOfPassing(rs.getInt("year_of_passing"));
            e.setPercentageCgpa(rs.getString("percentage_cgpa"));
            return e;
        }, candidateId);
    }

    // Skills
    public void saveSkills(int candidateId, List<String> skills) {
        jdbcTemplate.update("DELETE FROM skills WHERE candidate_id = ?", candidateId);
        for (String skill : skills) {
            jdbcTemplate.update("INSERT INTO skills (candidate_id, skill_name) VALUES (?, ?)", candidateId, skill.trim());
        }
    }

    public List<String> findSkillsByCandidateId(int candidateId) {
        return jdbcTemplate.queryForList("SELECT skill_name FROM skills WHERE candidate_id = ?", String.class, candidateId);
    }

    public boolean existsByEmail(String email) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM candidates WHERE email = ?", Integer.class, email);
        return count != null && count > 0;
    }

    public boolean existsByMobile(String mobile) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM candidates WHERE mobile = ?", Integer.class, mobile);
        return count != null && count > 0;
    }

    public String findPasswordByUsername(String username) {
        try {
            return jdbcTemplate.queryForObject("SELECT password FROM candidates WHERE username = ?", String.class, username);
        } catch (Exception e) {
            return null;
        }
    }
}
