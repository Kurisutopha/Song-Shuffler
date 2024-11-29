import { PinService } from './types/pinService';
import { mockPinService } from './mock/mockPinService';

// In 5.1, always use mock service
export const pinService: PinService = mockPinService;