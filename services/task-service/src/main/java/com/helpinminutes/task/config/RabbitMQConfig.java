package com.helpinminutes.task.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange.tasks:tasks.exchange}")
    private String tasksExchange;

    @Value("${app.rabbitmq.exchange.events:events.exchange}")
    private String eventsExchange;

    // Queues
    @Bean
    public Queue taskCreatedQueue() {
        return QueueBuilder.durable("task.created.queue")
                .withArgument("x-dead-letter-exchange", "tasks.dlx")
                .withArgument("x-dead-letter-routing-key", "task.created.dlq")
                .build();
    }

    @Bean
    public Queue taskAssignedQueue() {
        return QueueBuilder.durable("task.assigned.queue")
                .withArgument("x-dead-letter-exchange", "tasks.dlx")
                .withArgument("x-dead-letter-routing-key", "task.assigned.dlq")
                .build();
    }

    @Bean
    public Queue taskStatusChangedQueue() {
        return QueueBuilder.durable("task.status.changed.queue")
                .withArgument("x-dead-letter-exchange", "tasks.dlx")
                .withArgument("x-dead-letter-routing-key", "task.status.changed.dlq")
                .build();
    }

    @Bean
    public Queue taskCancelledQueue() {
        return QueueBuilder.durable("task.cancelled.queue")
                .withArgument("x-dead-letter-exchange", "tasks.dlx")
                .withArgument("x-dead-letter-routing-key", "task.cancelled.dlq")
                .build();
    }

    @Bean
    public Queue helperLocationQueue() {
        return QueueBuilder.durable("helper.location.queue")
                .withArgument("x-dead-letter-exchange", "tasks.dlx")
                .withArgument("x-dead-letter-routing-key", "helper.location.dlq")
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
        return ExchangeBuilder.directExchange("tasks.dlx")
                .durable(true)
                .build();
    }

    // Dead Letter Queues
    @Bean
    public Queue taskCreatedDLQ() {
        return QueueBuilder.durable("task.created.dlq").build();
    }

    @Bean
    public Queue taskAssignedDLQ() {
        return QueueBuilder.durable("task.assigned.dlq").build();
    }

    @Bean
    public Queue taskStatusChangedDLQ() {
        return QueueBuilder.durable("task.status.changed.dlq").build();
    }

    @Bean
    public Queue taskCancelledDLQ() {
        return QueueBuilder.durable("task.cancelled.dlq").build();
    }

    @Bean
    public Queue helperLocationDLQ() {
        return QueueBuilder.durable("helper.location.dlq").build();
    }

    // Bindings
    @Bean
    public Binding taskCreatedBinding() {
        return BindingBuilder.bind(taskCreatedQueue())
                .to(tasksExchange())
                .with("task.created");
    }

    @Bean
    public Binding taskAssignedBinding() {
        return BindingBuilder.bind(taskAssignedQueue())
                .to(tasksExchange())
                .with("task.assigned");
    }

    @Bean
    public Binding taskStatusChangedBinding() {
        return BindingBuilder.bind(taskStatusChangedQueue())
                .to(tasksExchange())
                .with("task.status.changed");
    }

    @Bean
    public Binding taskCancelledBinding() {
        return BindingBuilder.bind(taskCancelledQueue())
                .to(tasksExchange())
                .with("task.cancelled");
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
                .with("task.created.dlq");
    }

    @Bean
    public Binding taskAssignedDLQBinding() {
        return BindingBuilder.bind(taskAssignedDLQ())
                .to(deadLetterExchange())
                .with("task.assigned.dlq");
    }

    @Bean
    public Binding taskStatusChangedDLQBinding() {
        return BindingBuilder.bind(taskStatusChangedDLQ())
                .to(deadLetterExchange())
                .with("task.status.changed.dlq");
    }

    @Bean
    public Binding taskCancelledDLQBinding() {
        return BindingBuilder.bind(taskCancelledDLQ())
                .to(deadLetterExchange())
                .with("task.cancelled.dlq");
    }

    @Bean
    public Binding helperLocationDLQBinding() {
        return BindingBuilder.bind(helperLocationDLQ())
                .to(deadLetterExchange())
                .with("helper.location.dlq");
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