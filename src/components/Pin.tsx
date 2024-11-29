// import React, { useState, useEffect } from "react";
// import { Marker, Source } from "react-map-gl";
// import { MapPin } from "lucide-react";
// import { LatLong } from "./Mapbox";
// import { PinStorageManager } from "../utils/pin-storage";
// // import { Button } from "@/components/ui/button";
// import { useUser } from "@clerk/clerk-react";

// export interface Pin {
//   id: string;
//   location: LatLong;
//   userId: string;
//   timestamp: number;
// }

// interface MapPinManagerProps {
//   onPinAdd?: (pin: Pin) => void;
//   onPinsClear?: () => void;
// }

// const MapPinManager = ({ onPinAdd, onPinsClear }: MapPinManagerProps) => {
//   const [pins, setPins] = useState<Pin[]>([]);
//   const { isSignedIn, user } = useUser(); // Load pins on component mount
//   if (!isSignedIn) {
//     // not signed in case -> temporary?
//   }
//   // useEffect(() => {
//   //   setPins(PinStorageManager.getPins());
//   // }, []); // Handle adding a new pin

//   // const handleAddPin = (location: LatLong) => {
//   //   if (!user) return;
//   //   const newPin: Pin = {
//   //     id: `pin-${Date.now()}`,
//   //     location,
//   //     userId: user.id,
//   //     timestamp: Date.now(),
//   //   };
//   //   PinStorageManager.addPin(newPin);
//   //   setPins(PinStorageManager.getPins());
//   //   if (onPinAdd) onPinAdd(newPin);
//   // }; // Handle clearing user's pins
//   // const handleClearPins = () => {
//   //   if (!user) return;
//   //   PinStorageManager.clearUserPins(user.id);
//   //   setPins(PinStorageManager.getPins());
//   //   if (onPinsClear) onPinsClear();
//   // };

//   return (
//     <>
//       {/* Render all pins */}
      
//       {pins.map((pin) => (
//         <Marker
//           key={pin.id}
//           latitude={pin.location.lat}
//           longitude={pin.location.long}
//         >
          
//           <MapPin
//             className={"text-red-500"//`${ 
//               // pin.userId === user?.id ? "text-red-500" : "text-blue-500"
//             } cursor-pointer//`}
//             size={24}
//           />
//         </Marker>
//       ))}
//       {/* Clear pins button */}
      
//       <div className="absolute top-4 right-4 z-10">
        
//         <button
//           // onClick={handleClearPins}
//           className="bg-white hover:bg-gray-100 text-gray-800"
//           aria-label="clear-pins"
//         >
//           Clear My Pins 
//         </button>
        
//       </div>
      
//     </>
//   );
// };

// export default MapPinManager;