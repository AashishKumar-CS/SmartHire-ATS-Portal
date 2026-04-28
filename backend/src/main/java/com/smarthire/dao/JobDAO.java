package com.smarthire.dao;

import com.smarthire.model.Job;
import com.smarthire.model.ThirdPartyJob;
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
public class JobDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private RowMapper<Job> jobMapper = (rs, rowNum) -> {
        Job j = new Job();
        j.setId(rs.getInt("id"));
        j.setTitle(rs.getString("title"));
        j.setDescription(rs.getString("description"));
        j.setRequiredSkills(rs.getString("required_skills"));
        j.setExperience(rs.getString("experience"));
        j.setSalary(rs.getString("salary"));
        j.setStatus(rs.getString("status"));
        j.setCreatedBy(rs.getInt("created_by"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) j.setCreatedAt(ts.toLocalDateTime());
        return j;
    };

    public int save(Job job) {
        String sql = "INSERT INTO jobs (title, description, required_skills, experience, salary, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, job.getTitle());
            ps.setString(2, job.getDescription());
            ps.setString(3, job.getRequiredSkills());
            ps.setString(4, job.getExperience());
            ps.setString(5, job.getSalary());
            ps.setString(6, job.getStatus() != null ? job.getStatus() : "Open");
            ps.setInt(7, job.getCreatedBy());
            return ps;
        }, keyHolder);
        return keyHolder.getKey().intValue();
    }

    public List<Job> findAll() {
        return jdbcTemplate.query("SELECT * FROM jobs ORDER BY created_at DESC", jobMapper);
    }

    public List<Job> findOpen() {
        return jdbcTemplate.query("SELECT * FROM jobs WHERE status = 'Open' ORDER BY created_at DESC", jobMapper);
    }

    public Optional<Job> findById(int id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("SELECT * FROM jobs WHERE id = ?", jobMapper, id));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public void updateStatus(int jobId, String status) {
        jdbcTemplate.update("UPDATE jobs SET status = ? WHERE id = ?", status, jobId);
    }

    public void update(Job job) {
        jdbcTemplate.update("UPDATE jobs SET title=?, description=?, required_skills=?, experience=?, salary=?, status=? WHERE id=?",
                job.getTitle(), job.getDescription(), job.getRequiredSkills(),
                job.getExperience(), job.getSalary(), job.getStatus(), job.getId());
    }

    // Third Party Jobs
    public List<ThirdPartyJob> findAllThirdPartyJobs() {
        String sql = "SELECT * FROM third_party_jobs ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            ThirdPartyJob t = new ThirdPartyJob();
            t.setId(rs.getInt("id"));
            t.setTitle(rs.getString("title"));
            t.setCompany(rs.getString("company"));
            t.setDescription(rs.getString("description"));
            t.setRequiredSkills(rs.getString("required_skills"));
            t.setExternalUrl(rs.getString("external_url"));
            t.setSalary(rs.getString("salary"));
            t.setLocation(rs.getString("location"));
            t.setSource(rs.getString("source"));
            Timestamp ts = rs.getTimestamp("created_at");
            if (ts != null) t.setCreatedAt(ts.toLocalDateTime());
            return t;
        });
    }

    public Optional<ThirdPartyJob> findThirdPartyJobById(int id) {
        try {
            String sql = "SELECT * FROM third_party_jobs WHERE id = ?";
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
                ThirdPartyJob t = new ThirdPartyJob();
                t.setId(rs.getInt("id"));
                t.setTitle(rs.getString("title"));
                t.setCompany(rs.getString("company"));
                t.setRequiredSkills(rs.getString("required_skills"));
                t.setExternalUrl(rs.getString("external_url"));
                t.setSalary(rs.getString("salary"));
                t.setLocation(rs.getString("location"));
                t.setSource(rs.getString("source"));
                return t;
            }, id));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
