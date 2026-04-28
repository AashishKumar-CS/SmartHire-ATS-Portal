package com.smarthire.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OtpDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void saveOtp(String mobile, String otp) {
        jdbcTemplate.update("DELETE FROM otp_verification WHERE mobile = ?", mobile);
        jdbcTemplate.update(
            "INSERT INTO otp_verification (mobile, otp, expires_at) VALUES (?, ?, NOW() + INTERVAL 10 MINUTE)",
            mobile, otp
        );
    }

    public boolean verifyOtp(String mobile, String otp) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM otp_verification WHERE mobile = ? AND otp = ? AND expires_at > NOW() AND verified = FALSE",
                Integer.class, mobile, otp
            );
            if (count != null && count > 0) {
                jdbcTemplate.update("UPDATE otp_verification SET verified = TRUE WHERE mobile = ? AND otp = ?",mobile, otp );
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
