package com.helpinminutes.task.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8082}")
    private String serverPort;

    @Bean
    public OpenAPI taskServiceOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        
        return new OpenAPI()
                .info(new Info()
                        .title("HelpInMinutes Task Service API")
                        .description("Task Lifecycle Management Service - Handles task creation, state management, and coordination with matching engine")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("HelpInMinutes Team")
                                .email("support@helpinminutes.com"))
                        .license(new License()
                                .name("Private")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local server"),
                        new Server().url("/").description("Default server")
                ))
                .addSecurityItem(new SecurityRequirement()
                        .addList(securitySchemeName))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}