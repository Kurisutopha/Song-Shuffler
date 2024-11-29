
export interface Pin {
    id: string;
    latitude: number;
    longitude: number;
    userId: string;
    userName: string;  // For displaying who dropped the pin
    timestamp: number;
  }