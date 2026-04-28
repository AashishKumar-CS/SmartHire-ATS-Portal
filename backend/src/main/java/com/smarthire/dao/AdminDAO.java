package com.smarthire.dao;

import com.smarthire.model.Admin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public class AdminDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public Optional<Admin> findByUsername(String username) {
        try {
            String sql = "SELECT * FROM admin WHERE username = ?";
            Admin a = jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
                Admin admin = new Admin();
                admin.setId(rs.getInt("id"));
                admin.setUsername(rs.getString("username"));
                admin.setPassword(rs.getString("password"));
                admin.setEmail(rs.getString("email"));
                admin.setFullName(rs.getString("full_name"));
                return admin;
            }, username);
            return Optional.ofNullable(a);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public String findPasswordByUsername(String username) {
        try {
            return jdbcTemplate.queryForObject("SELECT password FROM admin WHERE username = ?", String.class, username);
        } catch (Exception e) {
            return null;
        }
    }
}
