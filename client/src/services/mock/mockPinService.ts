// src/services/mockPinService.ts
import { Pin } from '../types/map-types';

// Mock in-memory storage
let pins: Pin[] = [];

export const mockPinService = {
  // Add a new pin
  addPin: (pin: Pin) => {
    pins.push(pin);
    return pins;
  },

  // Get all pins
  getPins: () => {
    return [...pins];
  },

  // Clear pins for a specific user
  clearUserPins: (userId: string) => {
    pins = pins.filter(pin => pin.userId !== userId);
    return pins;
  }
};