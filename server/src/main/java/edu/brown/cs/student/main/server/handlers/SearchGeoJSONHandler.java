package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.handlers.GeoMap.GeoMap;
import edu.brown.cs.student.main.server.handlers.GeoMap.GeoMapAdapter;
import edu.brown.cs.student.main.server.handlers.GeoMap.GeoMapCollection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class SearchGeoJSONHandler implements Route {
  private GeoMapCollection data;
  private GeoMapAdapter adapter;

  public SearchGeoJSONHandler(GeoJSONHandler geo) {
    this.data = geo.data;
    this.adapter = geo.adapter;
  }

  @Override
  public Object handle(Request request, Response response) {
    String query = request.queryParams("query");
    //
    List<GeoMap> results = new ArrayList<GeoMap>();

    for (GeoMap feature : this.data.features) {
      for (String key : feature.getProperty().area_description_data.keySet()) {
        if (feature.getProperty().area_description_data.get(key).contains(query)) {
          // add
          results.add(feature);
          break;
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
  }
}
