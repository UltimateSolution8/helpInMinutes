package com.helpinminutes.payment.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class RabbitMQConfig {

    @Value("${rabbitmq.exchange.payment:payment.exchange}")
    private String paymentExchange;

    @Value("${rabbitmq.queue.payment.completed:payment.completed}")
    private String paymentCompletedQueue;

    @Value("${rabbitmq.queue.payout.processed:payout.processed}")
    private String payoutProcessedQueue;

    @Value("${rabbitmq.queue.task.assigned:task.assigned}")
    private String taskAssignedQueue;

    @Value("${rabbitmq.queue.task.completed:task.completed}")
    private String taskCompletedQueue;

    // Exchanges
    @Bean
    public TopicExchange paymentExchange() {
        return new TopicExchange(paymentExchange);
    }

    // Queues
    @Bean
    public Queue paymentCompletedQueue() {
        return QueueBuilder.durable(paymentCompletedQueue).build();
    }

    @Bean
    public Queue payoutProcessedQueue() {
        return QueueBuilder.durable(payoutProcessedQueue).build();
    }

    @Bean
    public Queue taskAssignedQueue() {
        return QueueBuilder.durable(taskAssignedQueue).build();
    }

    @Bean
    public Queue taskCompletedQueue() {
        return QueueBuilder.durable(taskCompletedQueue).build();
    }

    // Bindings
    @Bean
    public Binding paymentCompletedBinding() {
        return BindingBuilder.bind(paymentCompletedQueue())
                .to(paymentExchange())
                .with("payment.completed");
    }

    @Bean
    public Binding payoutProcessedBinding() {
        return BindingBuilder.bind(payoutProcessedQueue())
                .to(paymentExchange())
                .with("payout.processed");
    }
}
