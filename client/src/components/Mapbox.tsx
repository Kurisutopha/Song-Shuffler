import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useState } from "react";
import Map, {
  Layer,
  MapLayerMouseEvent,
  Source,
  ViewStateChangeEvent,
  Marker,
} from "react-map-gl";
import { geoLayer, geoSearch, overlayData, rl_data } from "../utils/overlay";
import { FeatureCollection } from "geojson";
import { useUser } from "@clerk/clerk-react";
import { MapPin } from "lucide-react";
import { addPin, getAllPins, clearPins } from "../utils/pinApi"; // Add this import
import { SearchMap } from "./SearchMap";


const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_TOKEN;
if (!MAPBOX_API_KEY) {
  console.error("Mapbox API key not found. Please add it to your .env file.");
}

export interface LatLong {
  lat: number;
  long: number;
}

export interface Pin {
  location: LatLong;
  userId: string;
}

const ProvidenceLatLong: LatLong = {
  long: -71.403008,
  lat: 41.826493,
};
const initialZoom = 10;

export default function Mapbox() {
  const [viewState, setViewState] = useState({
    longitude: ProvidenceLatLong.long,
    latitude: ProvidenceLatLong.lat,
    zoom: initialZoom,
  });
  
  const [overlay, setOverlay] = useState<GeoJSON.FeatureCollection | undefined>(
    undefined
  );
  const [overlays, setOverlays] = useState<{
    main: GeoJSON.FeatureCollection | undefined;
    search: GeoJSON.FeatureCollection | undefined;
  }>({main: undefined, search: undefined});
  const [searchOverlay, setSearchOverlay] = useState<GeoJSON.FeatureCollection | undefined>(
    undefined
  );
  const [loadingOverlay, setLoading] = useState<boolean>(true);
  const [doneSearching, setDoneSearching] = useState<boolean>(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const { isSignedIn, user } = useUser();

  // Load initial data
  useEffect(() => {
    const geojson = async () => {
      try {
        const obj = await rl_data
        const typed = await overlayData(obj)
        if (typed !== undefined){
          setOverlay(typed);
          let state = overlays
          overlays.main = typed
          setOverlays(state);
        }
        
      } catch (e) {
        console.log("Error loading overlay: " + e)
      } finally {
        setLoading(false)
      }
    }
    geojson()

    
    // Load pins from backend
    const loadPins = async () => {
      try {
        const response = await getAllPins();
        if (response.response_type === "success") {
          const transformedPins = response.pins.map((pin: any) => ({
            location: {
              lat: pin["Lat"],
              long: pin["Long"]
            },
            userId: pin["UID"]
          }));
          setPins(transformedPins);
        }
      } catch (error) {
        console.error("Failed to load pins:", error);
      }
    };

    if (isSignedIn) {
      loadPins();
    }
  }, [isSignedIn]);

  async function handleAddPins(e: MapLayerMouseEvent) {
    if (!user) return;

    try {
      // Add pin to backend
      await addPin(user.id, e.lngLat.lat, e.lngLat.lng);
      
      // Refresh pins
      // const response = await getAllPins();
      getAllPins().then((response) => {
        if (response["response_type"] === "success") {
          const transformedPins = response.pins.map((pin: any) => ({
            location: {
              lat: pin["Lat"],
              long: pin["Long"],
            },
            userId: pin["UID"],
          }));
          setPins(transformedPins);
        }
      });
      
      
      
    } catch (error) {
      console.error("Failed to add pin:", error);
    }
  }

  async function handleClearPins() {
    if (!user) return;

    try {
      // Clear pins in backend
      await clearPins(user.id);
      await rl_data
      // Refresh pins
      const response = await getAllPins();
      if (response.response_type === "success") {
        const transformedPins = response.pins.map((pin: any) => ({
          location: {
            lat: pin.latitude,
            long: pin.longitude
          },
          userId: pin.userId
        }));
        setPins(transformedPins);
      }
    } catch (error) {
      console.error("Failed to clear pins:", error);
    }
  }
  // console.log(overlay)
   
  return (
    <div className="map">
      <Map
        mapboxAccessToken={MAPBOX_API_KEY}
        {...viewState}
        style={{
          width: window.innerWidth,
          height: 0.75 * window.innerHeight,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onMove={(ev: ViewStateChangeEvent) => setViewState(ev.viewState)}
        onClick={(ev: MapLayerMouseEvent) => handleAddPins(ev)}
      >
        {doneSearching && searchOverlay && (
          <Source id="search" type="geojson" data={searchOverlay}>
            <Layer
              id={geoSearch.id}
              type={geoSearch.type}
              paint={geoSearch.paint}
            />
          </Source>
        )}

        {!loadingOverlay && overlay && (
          <Source id="geo_data" type="geojson" data={overlay}>
            <Layer
              id={geoLayer.id}
              type={geoLayer.type}
              paint={geoLayer.paint}
            />
          </Source>
        )}

        {/* {true && overlays.search && (
          <Source id="search" type="geojson" data={overlays.search}>
            <Layer
              id={geoSearch.id}
              type={geoSearch.type}
              paint={geoSearch.paint}
            />
          </Source>
        )}

        {!loadingOverlay && overlays.main && (
          <Source id="geo_data" type="geojson" data={overlays.main}>
            <Layer
              id={geoLayer.id}
              type={geoLayer.type}
              paint={geoLayer.paint}
            />
          </Source>
        )} */}

        {pins.map((pin, index) => (
          <Marker
            key={index}
            latitude={pin.location.lat}
            longitude={pin.location.long}
          >
            <MapPin
              className={`${
                pin.userId === user?.id ? "text-red-500" : "text-blue-500"
              } cursor-pointer`}
              size={24}
            />
          </Marker>
        ))}
      </Map>
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleClearPins}
          className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded"
          aria-label="clear-pins"
        >
          Clear My Pins
        </button>
      </div>
      <SearchMap
        onSearch={setSearchOverlay}
        setDoneSearching={setDoneSearching}
        onSearches={setOverlays}
        overlays={overlays}
      ></SearchMap>
    </div>
  );
}