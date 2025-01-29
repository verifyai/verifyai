import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();

export type AlertMessage = {
  type: string;
  message: string;
  timestamp: number;
};

export function broadcastAlert(alert: AlertMessage) {
  eventEmitter.emit('alert', alert);
}

export default eventEmitter;
