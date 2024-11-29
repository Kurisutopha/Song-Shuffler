// src/services/types/pinService.ts
export interface Pin {
    id: string;
    latitude: number;
    longitude: number;
    userId: string;
    userName: string;
    timestamp: number;
  }
  
  export interface PinService {
    addPin: (pin: Pin) => Pin[];
    getPins: () => Pin[];
    clearUserPins: (userId: string) => Pin[];
  }