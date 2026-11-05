package com.xiaoying.imageedit.config;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String storageRoot = "./data";
    private String sessionCookieName = "IMAGEEDIT_SESSION";
    private boolean recoverInterruptedTasks = true;
    private Map<String, String> demoUsers = new LinkedHashMap<>();

    public String getStorageRoot() {
        return storageRoot;
    }

    public void setStorageRoot(String storageRoot) {
        this.storageRoot = storageRoot;
    }

    public String getSessionCookieName() {
        return sessionCookieName;
    }

    public void setSessionCookieName(String sessionCookieName) {
        this.sessionCookieName = sessionCookieName;
    }

    public boolean isRecoverInterruptedTasks() {
        return recoverInterruptedTasks;
    }

    public void setRecoverInterruptedTasks(boolean recoverInterruptedTasks) {
        this.recoverInterruptedTasks = recoverInterruptedTasks;
    }

    public Map<String, String> getDemoUsers() {
        return demoUsers;
    }

    public void setDemoUsers(Map<String, String> demoUsers) {
        this.demoUsers = demoUsers;
    }
}
