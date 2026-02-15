/**
 * Services index
 * Export all services for easy importing
 */

const socketService = require('./socketService');
const locationService = require('./locationService');
const taskEventService = require('./taskEventService');
const notificationService = require('./notificationService');
const presenceService = require('./presenceService');

module.exports = {
  socketService,
  locationService,
  taskEventService,
  notificationService,
  presenceService
};
