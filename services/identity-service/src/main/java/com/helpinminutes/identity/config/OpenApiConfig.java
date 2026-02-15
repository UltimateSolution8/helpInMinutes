package com.helpinminutes.identity.config;

import io.swagger.v3.oas.models.Components;
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

    @Value("${server.port:8081}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        
        return new OpenAPI()
                .info(new Info()
                        .title("HelpInMinutes Identity Service API")
                        .version("1.0.0")
                        .description("Authentication and identity management API for HelpInMinutes platform")
                        .contact(new Contact()
                                .name("HelpInMinutes Support")
                                .email("support@helpinminutes.com")
                                .url("https://helpinminutes.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://helpinminutes.com/terms")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local Development"),
                        new Server().url("https://api.helpinminutes.com").description("Production"),
                        new Server().url("https://api-staging.helpinminutes.com").description("Staging")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
