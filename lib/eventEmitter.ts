import { EventEmitter } from 'events';

// Create a singleton event emitter instance
const eventEmitter = new EventEmitter();

// Type for our alert messages
export type AlertMessage = {
  type: string;
  message: string;
  timestamp: number;
};

// Helper function to broadcast alerts
export function broadcastAlert(alert: AlertMessage) {
  eventEmitter.emit('alert', alert);
}

export default eventEmitter;
