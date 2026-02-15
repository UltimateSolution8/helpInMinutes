/**
 * Controllers index
 * Export all controllers for easy importing
 */

const locationController = require('./locationController');
const taskController = require('./taskController');
const notificationController = require('./notificationController');
const chatController = require('./chatController');
const presenceController = require('./presenceController');
const healthController = require('./healthController');

module.exports = {
  locationController,
  taskController,
  notificationController,
  chatController,
  presenceController,
  healthController
};
