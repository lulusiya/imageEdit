package com.xiaoying.imageedit.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "simulation")
public class SimulationProperties {

    private int checkDelayMs = 1200;
    private int generateDelayMs = 2000;
    private int finalizeDelayMs = 1200;
    private String failStage = "";

    public int getCheckDelayMs() {
        return checkDelayMs;
    }

    public void setCheckDelayMs(int checkDelayMs) {
        this.checkDelayMs = checkDelayMs;
    }

    public int getGenerateDelayMs() {
        return generateDelayMs;
    }

    public void setGenerateDelayMs(int generateDelayMs) {
        this.generateDelayMs = generateDelayMs;
    }

    public int getFinalizeDelayMs() {
        return finalizeDelayMs;
    }

    public void setFinalizeDelayMs(int finalizeDelayMs) {
        this.finalizeDelayMs = finalizeDelayMs;
    }

    public String getFailStage() {
        return failStage;
    }

    public void setFailStage(String failStage) {
        this.failStage = failStage;
    }
}
