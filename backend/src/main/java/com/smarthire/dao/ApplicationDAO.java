package com.smarthire.dao;

import com.smarthire.model.Application;
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
public class ApplicationDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private RowMapper<Application> appMapper = (rs, rowNum) -> {
        Application a = new Application();
        a.setId(rs.getInt("id"));
        a.setCandidateId(rs.getInt("candidate_id"));
        a.setJobType(rs.getString("job_type"));
        a.setStatus(rs.getString("status"));
        a.setMatchScore(rs.getDouble("match_score"));
        a.setSkillGap(rs.getString("skill_gap"));
        try { a.setJobId(rs.getInt("job_id")); } catch (Exception e) {}
        try { a.setThirdPartyJobId(rs.getInt("third_party_job_id")); } catch (Exception e) {}
        Timestamp ts = rs.getTimestamp("applied_at");
        if (ts != null) a.setAppliedAt(ts.toLocalDateTime());
        return a;
    };

    public int save(Application app) {
        String sql = "INSERT INTO applications (candidate_id, job_id, third_party_job_id, job_type, status, match_score, skill_gap) VALUES (?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, app.getCandidateId());
            if (app.getJobId() != null) ps.setInt(2, app.getJobId()); else ps.setNull(2, Types.INTEGER);
            if (app.getThirdPartyJobId() != null) ps.setInt(3, app.getThirdPartyJobId()); else ps.setNull(3, Types.INTEGER);
            ps.setString(4, app.getJobType());
            ps.setString(5, "Applied");
            ps.setDouble(6, app.getMatchScore());
            ps.setString(7, app.getSkillGap());
            return ps;
        }, keyHolder);
        return keyHolder.getKey().intValue();
    }

    public List<Application> findByCandidateId(int candidateId) {
        String sql = "SELECT a.*, " +
            "COALESCE(j.title, tp.title) AS job_title, " +
            "c.full_name AS candidate_name, c.email AS candidate_email, c.ats_score " +
            "FROM applications a " +
            "LEFT JOIN jobs j ON a.job_id = j.id " +
            "LEFT JOIN third_party_jobs tp ON a.third_party_job_id = tp.id " +
            "JOIN candidates c ON a.candidate_id = c.id " +
            "WHERE a.candidate_id = ? ORDER BY a.applied_at DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Application a = appMapper.mapRow(rs, rowNum);
            a.setJobTitle(rs.getString("job_title"));
            a.setCandidateName(rs.getString("candidate_name"));
            a.setCandidateEmail(rs.getString("candidate_email"));
            a.setAtsScore(rs.getDouble("ats_score"));
            return a;
        }, candidateId);
    }

    public List<Application> findByJobId(int jobId) {
        String sql = "SELECT a.*, c.full_name AS candidate_name, c.email AS candidate_email, c.ats_score, j.title AS job_title " +
            "FROM applications a " +
            "JOIN candidates c ON a.candidate_id = c.id " +
            "JOIN jobs j ON a.job_id = j.id " +
            "WHERE a.job_id = ? ORDER BY a.match_score DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Application a = appMapper.mapRow(rs, rowNum);
            a.setCandidateName(rs.getString("candidate_name"));
            a.setCandidateEmail(rs.getString("candidate_email"));
            a.setAtsScore(rs.getDouble("ats_score"));
            a.setJobTitle(rs.getString("job_title"));
            return a;
        }, jobId);
    }

    public List<Application> findAll() {
        String sql = "SELECT a.*, c.full_name AS candidate_name, c.email AS candidate_email, c.ats_score, " +
            "COALESCE(j.title, tp.title) AS job_title " +
            "FROM applications a " +
            "JOIN candidates c ON a.candidate_id = c.id " +
            "LEFT JOIN jobs j ON a.job_id = j.id " +
            "LEFT JOIN third_party_jobs tp ON a.third_party_job_id = tp.id " +
            "ORDER BY a.match_score DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Application a = appMapper.mapRow(rs, rowNum);
            a.setCandidateName(rs.getString("candidate_name"));
            a.setCandidateEmail(rs.getString("candidate_email"));
            a.setAtsScore(rs.getDouble("ats_score"));
            a.setJobTitle(rs.getString("job_title"));
            return a;
        });
    }

    public void updateStatus(int appId, String status) {
        jdbcTemplate.update("UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?", status, appId);
    }

    public boolean alreadyApplied(int candidateId, Integer jobId, Integer thirdPartyJobId) {
        if (jobId != null) {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM applications WHERE candidate_id = ? AND job_id = ?", Integer.class, candidateId, jobId);
            return count != null && count > 0;
        } else {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM applications WHERE candidate_id = ? AND third_party_job_id = ?", Integer.class, candidateId, thirdPartyJobId);
            return count != null && count > 0;
        }
    }

    public Optional<Application> findById(int id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                "SELECT * FROM applications WHERE id = ?", appMapper, id));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
