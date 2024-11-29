import { FeatureCollection } from "geojson";
import { FillLayer } from "react-map-gl";
import { geojson } from "./api";

const propertyName = "holc_grade";
export const geoLayer: FillLayer = {
  id: "geo_data",
  type: "fill",
  paint: {
    "fill-color": [
      "match",
      ["get", propertyName],
      "A",
      "#5bcc04",
      "B",
      "#04b8cc",
      "C",
      "#e9ed0e",
      "D",
      "#d11d1d",
      "#ccc",
    ],
    "fill-opacity": 0.2,
  },
};
export const geoSearch: FillLayer = {
  id: "geo_search",
  type: "fill",
  paint: {
    "fill-color": [
      "match",
      ["get", propertyName],
      "A",
      "#ffffff",
      "B",
      "#ffffff",
      "C",
      "#ffffff",
      "D",
      "#ffffff",
      "#ccc",
    ],
    "fill-opacity": 0.5,
  },
};


// TODO: MAPS PART 4:
// - Download and import the geojson file
// - Implement the two functions below.


// Import the raw JSON file
// import rl_data from "../geodata/fullDownload.json";

export const rl_data = geojson();
// you may need to rename the downloaded .geojson to .json

function isFeatureCollection(json: any): json is FeatureCollection {
  return json["type"] === "FeatureCollection";
}




export function overlayData(data: any): GeoJSON.FeatureCollection | undefined {
  return isFeatureCollection(data) ? data : undefined;
}