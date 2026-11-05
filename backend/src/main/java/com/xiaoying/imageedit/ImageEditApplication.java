package com.xiaoying.imageedit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ImageEditApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImageEditApplication.class, args);
    }
}
