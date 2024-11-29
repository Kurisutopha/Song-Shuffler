package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.handlers.GeoMap.GeoMap;
import edu.brown.cs.student.main.server.handlers.GeoMap.GeoMapAdapter;
import edu.brown.cs.student.main.server.handlers.GeoMap.GeoMapCollection;
import edu.brown.cs.student.main.server.handlers.GeoMap.Geometry;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class GeoJSONBoundedHandler implements Route {
  GeoMapCollection data;
  GeoMapAdapter adapter;

  public GeoJSONBoundedHandler(GeoJSONHandler g) {
    this.data = g.data;
    this.adapter = g.adapter;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Double minLong = Double.parseDouble(request.queryParams("minlong"));
    Double maxLong = Double.parseDouble(request.queryParams("maxlong"));
    Double minLat = Double.parseDouble(request.queryParams("minlat"));
    Double maxLat = Double.parseDouble(request.queryParams("maxlat"));

    List<GeoMap> results = new ArrayList<GeoMap>();
    try {
      for (GeoMap feature : this.data.features) {
        Geometry g = feature.getGeometry();
        if (g == null) {
          continue;
        }
        for (List<List<List<Double>>> list1 : g.getCoordinates()) {
          // System.out.println("Checking out");
          for (List<List<Double>> list2 : list1) {
            for (List<Double> points : list2) {
              Double lat = points.get(1);
              Double lng = points.get(0);
              if ((lat >= minLat && lat <= maxLat) && (lng >= minLong && lng <= maxLong)) {
                results.add(feature);
                break;
              }
            }
          }
        }
      }
      GeoMapCollection coll = new GeoMapCollection();
      coll.type = "FeatureCollection";
      coll.features = results;

      Map<String, Object> res = new HashMap<>();
      res.put("response_type", "success");
      res.put("geo_data", this.adapter.toJson(coll));
      return Utils.toMoshiJson(res);
    } catch (Exception e) {
      System.out.println("Error: " + e.getMessage());
      return null;
    }
  }
}
