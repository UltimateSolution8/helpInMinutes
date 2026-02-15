package com.helpinminutes.matching.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration for matching service.
 */
@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange.tasks:tasks.exchange}")
    private String tasksExchange;

    @Value("${app.rabbitmq.exchange.events:events.exchange}")
    private String eventsExchange;

    // Queues for listening
    @Bean
    public Queue taskCreatedQueue() {
        return QueueBuilder.durable("matching.task.created.queue")
                .withArgument("x-dead-letter-exchange", "matching.dlx")
                .withArgument("x-dead-letter-routing-key", "matching.task.created.dlq")
                .build();
    }

    @Bean
    public Queue helperStatusQueue() {
        return QueueBuilder.durable("matching.helper.status.queue")
                .withArgument("x-dead-letter-exchange", "matching.dlx")
                .withArgument("x-dead-letter-routing-key", "matching.helper.status.dlq")
                .build();
    }

    @Bean
    public Queue helperLocationQueue() {
        return QueueBuilder.durable("matching.helper.location.queue")
                .withArgument("x-dead-letter-exchange", "matching.dlx")
                .withArgument("x-dead-letter-routing-key", "matching.helper.location.dlq")
                .build();
    }

    // Exchanges
    @Bean
    public TopicExchange tasksExchange() {
        return ExchangeBuilder.topicExchange(tasksExchange)
                .durable(true)
                .build();
    }

    @Bean
    public TopicExchange eventsExchange() {
        return ExchangeBuilder.topicExchange(eventsExchange)
                .durable(true)
                .build();
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return ExchangeBuilder.directExchange("matching.dlx")
                .durable(true)
                .build();
    }

    // Dead Letter Queues
    @Bean
    public Queue taskCreatedDLQ() {
        return QueueBuilder.durable("matching.task.created.dlq").build();
    }

    @Bean
    public Queue helperStatusDLQ() {
        return QueueBuilder.durable("matching.helper.status.dlq").build();
    }

    @Bean
    public Queue helperLocationDLQ() {
        return QueueBuilder.durable("matching.helper.location.dlq").build();
    }

    // Bindings
    @Bean
    public Binding taskCreatedBinding() {
        return BindingBuilder.bind(taskCreatedQueue())
                .to(tasksExchange())
                .with("task.created");
    }

    @Bean
    public Binding helperStatusBinding() {
        return BindingBuilder.bind(helperStatusQueue())
                .to(eventsExchange())
                .with("helper.status.changed");
    }

    @Bean
    public Binding helperLocationBinding() {
        return BindingBuilder.bind(helperLocationQueue())
                .to(eventsExchange())
                .with("helper.location.update");
    }

    // DLQ Bindings
    @Bean
    public Binding taskCreatedDLQBinding() {
        return BindingBuilder.bind(taskCreatedDLQ())
                .to(deadLetterExchange())
                .with("matching.task.created.dlq");
    }

    @Bean
    public Binding helperStatusDLQBinding() {
        return BindingBuilder.bind(helperStatusDLQ())
                .to(deadLetterExchange())
                .with("matching.helper.status.dlq");
    }

    @Bean
    public Binding helperLocationDLQBinding() {
        return BindingBuilder.bind(helperLocationDLQ())
                .to(deadLetterExchange())
                .with("matching.helper.location.dlq");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
