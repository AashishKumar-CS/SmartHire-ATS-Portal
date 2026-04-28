package com.smarthire;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SmartHireApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartHireApplication.class, args);
        System.out.println("🚀 SmartHire Backend Started on http://localhost:8080");
    }
}
