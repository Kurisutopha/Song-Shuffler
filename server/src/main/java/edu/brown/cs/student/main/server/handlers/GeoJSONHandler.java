package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.handlers.GeoMap.GeoMapAdapter;
import edu.brown.cs.student.main.server.handlers.GeoMap.GeoMapCollection;
import java.io.BufferedReader;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class GeoJSONHandler implements Route {
  public GeoMapCollection data;
  public GeoMapAdapter adapter;

  // private String data;

  public GeoJSONHandler(String filepath) {
    try {
      // ****************** GETTING JSON DATA // ***********
      FileReader jsonReader = new FileReader(filepath);
      BufferedReader br = new BufferedReader(jsonReader);
      String fileString = "";
      String line = br.readLine();
      while (line != null) {
        fileString = fileString + line;
        line = br.readLine();
      }
      jsonReader.close();
      // ****************** CREATING THE ADAPTER ***********
      this.adapter = new GeoMapAdapter();
      this.data = this.adapter.fromJson(fileString);
      // this.data = fileString;
    } catch (Exception e) {
      System.out.println("Could not properly start up GeoJSON Handler. error: " + e.getMessage());
    }
    ;
  }

  @Override
  public Object handle(Request request, Response response) {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      responseMap.put("response_type", "success");
      responseMap.put("geo_json", this.adapter.toJson(this.data));
      // responseMap.put("geo_json", this.data);
    } catch (Exception e) {
      // Handle any errors that occur
      e.printStackTrace();
      responseMap = new HashMap<>();
      responseMap.put("response_type", "error");
      responseMap.put("error", e.getMessage());
    }
    return Utils.toMoshiJson(responseMap);
  }
}
