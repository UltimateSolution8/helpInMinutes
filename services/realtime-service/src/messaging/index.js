/**
 * Messaging index
 * Export all messaging components for easy importing
 */

const eventHandlers = require('./eventHandlers');
const rabbitmqListeners = require('./rabbitmqListeners');

module.exports = {
  ...eventHandlers,
  ...rabbitmqListeners
};
