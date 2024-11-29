// import { Pin } from "../components/Pin";
import { Pin } from "../components/Mapbox";

// Mock storage to persist pins during session
let pinStorage: Pin[] = [];

export const PinStorageManager = {
  addPin: (pin: Pin) => {
    pinStorage.push(pin);
  },

  getPins: () => {
    return [...pinStorage];
  },

  clearUserPins: (userId: string) => {
    pinStorage = pinStorage.filter((pin) => pin.userId !== userId);
  },

  clearAllPins: () => {
    pinStorage = [];
  },
};
