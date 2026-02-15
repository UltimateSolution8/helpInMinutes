package com.helpinminutes.matching.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI configuration for matching service.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8083}")
    private String serverPort;

    @Bean
    public OpenAPI matchingServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HelpInMinutes Matching Service API")
                        .description("H3 Geospatial Matching Service - Uber-like matching engine with hexagonal grid indexing")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("HelpInMinutes Team")
                                .email("support@helpinminutes.com"))
                        .license(new License()
                                .name("Proprietary")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local server"),
                        new Server().url("/").description("Default server")
                ));
    }
}
