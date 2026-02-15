/**
 * RabbitMQ Listeners
 * Setup and manage RabbitMQ consumers for the realtime service
 */

const logger = require('../config/logger');
const { getChannel } = require('../config/rabbitmq');
const eventHandlers = require('./eventHandlers');

// Consumer tags for cleanup
const consumerTags = [];

/**
 * Setup all RabbitMQ listeners
 */
async function setupRabbitMQListeners() {
  try {
    const channel = getChannel();

    // Assert exchanges
    await assertExchanges(channel);

    // Assert queues
    await assertQueues(channel);

    // Bind queues to exchanges
    await bindQueues(channel);

    // Start consumers
    await startConsumers(channel);

    logger.info('RabbitMQ listeners setup complete');
  } catch (error) {
    logger.error('Failed to setup RabbitMQ listeners:', error);
    throw error;
  }
}

/**
 * Assert exchanges
 */
async function assertExchanges(channel) {
  const exchanges = [
    { name: 'task.events', type: 'topic' },
    { name: 'matching.events', type: 'topic' },
    { name: 'payment.events', type: 'topic' },
    { name: 'location.events', type: 'topic' },
    { name: 'broadcast.events', type: 'fanout' }
  ];

  for (const exchange of exchanges) {
    await channel.assertExchange(exchange.name, exchange.type, {
      durable: true
    });
    logger.info(`Exchange asserted: ${exchange.name} (${exchange.type})`);
  }
}

/**
 * Assert queues
 */
async function assertQueues(channel) {
  const queues = [
    'realtime.task.assigned',
    'realtime.task.status',
    'realtime.location.updates',
    'realtime.payment.completed',
    'realtime.payment.failed',
    'realtime.matching.failed',
    'realtime.matching.declined',
    'realtime.task.expired',
    'realtime.broadcast'
  ];

  for (const queue of queues) {
    await channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000, // 24 hours
        'x-max-length': 10000
      }
    });
    logger.info(`Queue asserted: ${queue}`);
  }
}

/**
 * Bind queues to exchanges
 */
async function bindQueues(channel) {
  const bindings = [
    { queue: 'realtime.task.assigned', exchange: 'matching.events', pattern: 'task.assigned' },
    { queue: 'realtime.task.status', exchange: 'task.events', pattern: 'task.status.*' },
    { queue: 'realtime.location.updates', exchange: 'location.events', pattern: 'location.update' },
    { queue: 'realtime.payment.completed', exchange: 'payment.events', pattern: 'payment.completed' },
    { queue: 'realtime.payment.failed', exchange: 'payment.events', pattern: 'payment.failed' },
    { queue: 'realtime.matching.failed', exchange: 'matching.events', pattern: 'match.failed' },
    { queue: 'realtime.matching.declined', exchange: 'matching.events', pattern: 'helper.declined' },
    { queue: 'realtime.task.expired', exchange: 'task.events', pattern: 'task.expired' },
    { queue: 'realtime.broadcast', exchange: 'broadcast.events', pattern: '' }
  ];

  for (const binding of bindings) {
    await channel.bindQueue(binding.queue, binding.exchange, binding.pattern);
    logger.info(`Bound: ${binding.queue} -> ${binding.exchange} (${binding.pattern})`);
  }
}

/**
 * Start consumers
 */
async function startConsumers(channel) {
  // Task Assigned Consumer
  const { consumerTag: tag1 } = await channel.consume(
    'realtime.task.assigned',
    async (message) => {
      if (message) {
        const success = await eventHandlers.handleTaskAssignedEvent(message);
        if (success) {
          channel.ack(message);
        } else {
          channel.nack(message, false, true);
        }
      }
    },
    { prefetch: 10 }
  );
  consumerTags.push(tag1);
  logger.info('Started consumer: realtime.task.assigned');

  // Task Status Consumer
  const { consumerTag: tag2 } = await channel.consume(
    'realtime.task.status',
    async (message) => {
      if (message) {
        const success = await eventHandlers.handleTaskStatusChangedEvent(message);
        if (success) {
          channel.ack(message);
        } else {
          channel.nack(message, false, true);
        }
      }
    },
    { prefetch: 10 }
  );
  consumerTags.push(tag2);
  logger.info('Started consumer: realtime.task.status');

  // Location Updates Consumer
  const { consumerTag: tag3 } = await channel.consume(
    'realtime.location.updates',
    async (message) => {
      if (message) {
        const success = await eventHandlers.handleHelperLocationUpdateEvent(message);
        if (success) {
          channel.ack(message);
        } else {
          channel.nack(message, false, true);
        }
      }
    },
    { prefetch: 50 }
  );
  consumerTags.push(tag3);
  logger.info('Started consumer: realtime.location.updates');

  // Payment Completed Consumer
  const { consumerTag: tag4 } = await channel.consume(
    'realtime.payment.completed',
    async (message) => {
      if (message) {
        const success = await eventHandlers.handlePaymentCompletedEvent(message);
        if (success) {
          channel.ack(message);
        } else {
          channel.nack(message, false, true);
        }
      }
    },
    { prefetch: 10 }
  );
  consumerTags.push(tag4);
  logger.info('Started consumer: realtime.payment.completed');

  // Payment Failed Consumer
  const { consumerTag: tag5 } = await channel.consume(
    'realtime.payment.failed',
    async (message) => {
      if (message) {
        const success = await eventHandlers.handlePaymentFailedEvent(message);
        if (success) {
          channel.ack(message);
        } else {
          channel.nack(message, false, true);
        }
      }
    },
    { prefetch: 10 }
  );
  consumerTags.push(tag5);
  logger.info('Started consumer: realtime.payment.failed');

  // Match Failed Consumer
  const { consumerTag: tag6 } = await channel.consume(
    'realtime.matching.failed',
    async (message) => {
      if (message) {
        const success = await eventHandlers.handleMatchFailedEvent(message);
        if (success) {
          channel.ack(message);
        } else {
          channel.nack(message, false, true);
        }
      }
    },
    { prefetch: 10 }
  );
  consumerTags.push(tag6);
  logger.info('Started consumer: realtime.matching.failed');

  // Helper Declined Consumer
  const { consumerTag: tag7 } = await channel.consume(
    'realtime.matching.declined',
    async (message) => {
      if (message) {
        const success = await eventHandlers.handleHelperDeclinedEvent(message);
        if (success) {
          channel.ack(message);
        } else {
          channel.nack(message, false, true);
        }
      }
    },
    { prefetch: 10 }
  );
  consumerTags.push(tag7);
  logger.info('Started consumer: realtime.matching.declined');

  // Task Expired Consumer
  const { consumerTag: tag8 } = await channel.consume(
    'realtime.task.expired',
    async (message) => {
      if (message) {
        const success = await eventHandlers.handleTaskExpiredEvent(message);
        if (success) {
          channel.ack(message);
        } else {
          channel.nack(message, false, true);
        }
      }
    },
    { prefetch: 10 }
  );
  consumerTags.push(tag8);
  logger.info('Started consumer: realtime.task.expired');

  // Broadcast Consumer
  const { consumerTag: tag9 } = await channel.consume(
    'realtime.broadcast',
    async (message) => {
      if (message) {
        const success = await eventHandlers.handleBroadcastEvent(message);
        if (success) {
          channel.ack(message);
        } else {
          channel.nack(message, false, true);
        }
      }
    },
    { prefetch: 10 }
  );
  consumerTags.push(tag9);
  logger.info('Started consumer: realtime.broadcast');
}

/**
 * Stop all consumers
 */
async function stopConsumers() {
  try {
    const channel = getChannel();
    
    for (const tag of consumerTags) {
      await channel.cancel(tag);
      logger.info(`Cancelled consumer: ${tag}`);
    }
    
    consumerTags.length = 0;
    logger.info('All RabbitMQ consumers stopped');
  } catch (error) {
    logger.error('Error stopping consumers:', error);
  }
}

/**
 * Publish event to RabbitMQ
 */
async function publishEvent(exchange, routingKey, data) {
  try {
    const channel = getChannel();
    
    const message = Buffer.from(JSON.stringify({
      ...data,
      publishedAt: new Date().toISOString(),
      source: 'realtime-service'
    }));

    const result = channel.publish(exchange, routingKey, message, {
      persistent: true,
      timestamp: Date.now()
    });

    if (result) {
      logger.debug(`Published to ${exchange}:${routingKey}`);
    } else {
      logger.warn(`Failed to publish to ${exchange}:${routingKey}`);
    }

    return result;
  } catch (error) {
    logger.error('Error publishing event:', error);
    return false;
  }
}

module.exports = {
  setupRabbitMQListeners,
  stopConsumers,
  publishEvent
};
