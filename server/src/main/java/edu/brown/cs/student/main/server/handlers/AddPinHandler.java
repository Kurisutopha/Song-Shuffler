package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

// src/main/java/edu/brown/cs/student/main/server/handlers/AddPinHandler.java

public class AddPinHandler implements Route {
  private final StorageInterface storageHandler;

  public AddPinHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) {
    Map<String, Object> responseMap = new HashMap<>();

    try {
      String uid = request.queryParams("uid");
      System.out.println(
          "Adding pin: Latitude: "
              + request.queryParams("lat")
              + " Longitude: "
              + request.queryParams("lng"));
      double lat = Double.parseDouble(request.queryParams("lat"));
      double lng = Double.parseDouble(request.queryParams("lng"));

      storageHandler.addPin(uid, lat, lng);

      responseMap.put("response_type", "success");
    } catch (Exception e) {
      System.out.println("Error adding pin: " + e.getMessage());
      responseMap.put("response_type", "error");
      responseMap.put("error", e.getMessage());
    }
    return Utils.toMoshiJson(responseMap);
  }
}
