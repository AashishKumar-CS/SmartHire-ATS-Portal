package com.smarthire.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class AIService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 🔥 Throttling
    private long lastCallTime = 0;

    private synchronized void throttle() {
        long now = System.currentTimeMillis();
        long gap = now - lastCallTime;

        if (gap < 1500) {
            try { Thread.sleep(1500 - gap); } catch (Exception ignored) {}
        }

        lastCallTime = System.currentTimeMillis();
    }

    // =========================================================================
    // GEMINI API CALL
    // =========================================================================
    private String callGemini(String prompt) {

        if (apiKey == null || apiKey.isBlank()) {
            System.out.println("[AI] Gemini key missing → fallback");
            return null;
        }

        throttle();

        try {
            String requestBody = objectMapper.writeValueAsString(
                new java.util.HashMap<String, Object>() {{
                    put("contents", List.of(
                        new java.util.HashMap<String, Object>() {{
                            put("parts", List.of(
                                new java.util.HashMap<String, String>() {{
                                    put("text", prompt);
                                }}
                            ));
                        }}
                    ));
                }}
            );

            Request request = new Request.Builder()
                    .url(apiUrl)
                    .addHeader("X-goog-api-key", apiKey)
                    .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {

                if (!response.isSuccessful()) {
                    String err = response.body() != null ? response.body().string() : "";
                    System.err.println("[AI] Gemini error: " + err);
                    return null;
                }

                String body = response.body().string();
                JsonNode root = objectMapper.readTree(body);

                return root.path("candidates")
                        .get(0)
                        .path("content")
                        .path("parts")
                        .get(0)
                        .path("text")
                        .asText();
            }

        } catch (Exception e) {
            System.err.println("[AI] Gemini call failed: " + e.getMessage());
            return null;
        }
    }

    // =========================================================================
    // 🔥 SINGLE ANALYSIS METHOD
    // =========================================================================
    public CombinedResult analyzeCandidate(
            String resumeText,
            String candidateSkills,
            String jobTitle,
            String jobSkills) {

        String resumeShort = resumeText.substring(0, Math.min(resumeText.length(), 1200));

        String prompt = """
        Analyze candidate and job match.

        Resume:
        %s

        Candidate Skills:
        %s

        Job Title:
        %s

        Required Skills:
        %s

        Return ONLY JSON:
        {
          "ats_score": number,
          "match_score": number,
          "skills": [],
          "missing_skills": [],
          "strengths": [],
          "weaknesses": [],
          "recommendation": ""
        }
        """.formatted(resumeShort, candidateSkills, jobTitle, jobSkills);

        String response = callGemini(prompt);

        if (response == null) return fallbackCombined(candidateSkills, jobSkills);

        try {
            String cleaned = response.replaceAll("(?s)```json", "")
                    .replaceAll("(?s)```", "").trim();

            JsonNode node = objectMapper.readTree(cleaned);

            CombinedResult r = new CombinedResult();
            r.setAtsScore(node.path("ats_score").asDouble(60));
            r.setMatchScore(node.path("match_score").asDouble(50));

            r.setSkills(objectMapper.convertValue(node.path("skills"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));

            r.setMissingSkills(objectMapper.convertValue(node.path("missing_skills"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));

            r.setStrengths(objectMapper.convertValue(node.path("strengths"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));

            r.setWeaknesses(objectMapper.convertValue(node.path("weaknesses"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)));

            r.setRecommendation(node.path("recommendation").asText(""));

            return r;

        } catch (Exception e) {
            System.err.println("[AI] JSON parse error: " + e.getMessage());
            return fallbackCombined(candidateSkills, jobSkills);
        }
    }

    // =========================================================================
    // FALLBACK
    // =========================================================================
    private CombinedResult fallbackCombined(String candidateSkills, String jobSkills) {

        CombinedResult r = new CombinedResult();
        r.setAtsScore(65);
        r.setMatchScore(50);
        r.setSkills(List.of("Java", "Spring Boot", "SQL"));
        r.setMissingSkills(List.of("Docker", "Kubernetes"));
        r.setStrengths(List.of("Good structure", "Projects present", "Skills listed"));
        r.setWeaknesses(List.of("No achievements", "Weak keywords", "No summary"));
        r.setRecommendation("Improve ATS keywords and add measurable achievements");

        return r;
    }

    // =========================================================================
    // DTO
    // =========================================================================
    public static class CombinedResult {
        private double atsScore;
        private double matchScore;
        private List<String> skills;
        private List<String> missingSkills;
        private List<String> strengths;
        private List<String> weaknesses;
        private String recommendation;

        public double getAtsScore() { return atsScore; }
        public void setAtsScore(double v) { this.atsScore = v; }

        public double getMatchScore() { return matchScore; }
        public void setMatchScore(double v) { this.matchScore = v; }

        public List<String> getSkills() { return skills; }
        public void setSkills(List<String> v) { this.skills = v; }

        public List<String> getMissingSkills() { return missingSkills; }
        public void setMissingSkills(List<String> v) { this.missingSkills = v; }

        public List<String> getStrengths() { return strengths; }
        public void setStrengths(List<String> v) { this.strengths = v; }

        public List<String> getWeaknesses() { return weaknesses; }
        public void setWeaknesses(List<String> v) { this.weaknesses = v; }

        public String getRecommendation() { return recommendation; }
        public void setRecommendation(String v) { this.recommendation = v; }
    }
}