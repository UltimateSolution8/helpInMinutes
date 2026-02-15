package com.helpinminutes.matching.config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.config.MeterFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

/**
 * Configuration for metrics and monitoring.
 */
@Configuration
@EnableAspectJAutoProxy
public class MetricsConfig {

    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    @Bean
    public MeterFilter customMeterFilter() {
        return MeterFilter.deny(id -> {
            String name = id.getName();
            // Filter out some noisy metrics
            return name.startsWith("jvm.threads") || name.startsWith("jvm.gc");
        });
    }
}
