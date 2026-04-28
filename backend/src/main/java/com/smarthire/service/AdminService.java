package com.smarthire.service;

import com.smarthire.dao.AdminDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    @Autowired
    private AdminDAO adminDAO;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public boolean login(String username, String password) {
        String dbPassword = adminDAO.findPasswordByUsername(username);

        if (dbPassword == null) return false;

        return passwordEncoder.matches(password, dbPassword);
    }
}