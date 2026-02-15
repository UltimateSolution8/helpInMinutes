package com.helpinminutes.payment.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8084}")
    private String serverPort;

    @Bean
    public OpenAPI paymentServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HelpInMinutes Payment Service API")
                        .description("Payment Processing Service with Razorpay Integration")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("HelpInMinutes Support")
                                .email("support@helpinminutes.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://helpinminutes.com")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local server"),
                        new Server().url("https://api.helpinminutes.com").description("Production server")
                ));
    }
}
