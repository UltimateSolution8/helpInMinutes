const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;
let rabbitmqStatus = 'disconnected';

async function connectRabbitMQ() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 
    `amqp://${process.env.RABBITMQ_USER || 'helpinminutes'}:${process.env.RABBITMQ_PASSWORD || 'helpinminutes123'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || 5672}`;

  try {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    rabbitmqStatus = 'connected';

    logger.info('RabbitMQ connected successfully');

    // Handle connection events
    connection.on('error', (err) => {
      rabbitmqStatus = 'error';
      logger.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      rabbitmqStatus = 'disconnected';
      logger.warn('RabbitMQ connection closed');
      // Attempt to reconnect after 5 seconds
      setTimeout(connectRabbitMQ, 5000);
    });

    // Assert queues
    await assertQueues();

    return { connection, channel };
  } catch (error) {
    rabbitmqStatus = 'error';
    logger.error('Failed to connect to RabbitMQ:', error);
    // Attempt to reconnect after 5 seconds
    setTimeout(connectRabbitMQ, 5000);
    throw error;
  }
}

async function assertQueues() {
  const queues = [
    'task.notifications',
    'chat.messages',
    'user.status'
  ];

  for (const queue of queues) {
    await channel.assertQueue(queue, { durable: true });
  }

  logger.info('RabbitMQ queues asserted');
}

function getChannel() {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized. Call connectRabbitMQ() first.');
  }
  return channel;
}

function getRabbitMQStatus() {
  return rabbitmqStatus;
}

module.exports = {
  connectRabbitMQ,
  getChannel,
  getRabbitMQStatus
};