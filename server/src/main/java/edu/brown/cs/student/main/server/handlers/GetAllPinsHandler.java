package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class GetAllPinsHandler implements Route {
  private final StorageInterface storageHandler;

  public GetAllPinsHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      // Get all pins from all users
      List<Map<String, Object>> pins = this.storageHandler.getAllPins();

      responseMap.put("response_type", "success");
      responseMap.put("pins", pins);

    } catch (Exception e) {
      // Handle any errors that occur
      e.printStackTrace();
      responseMap.put("response_type", "error");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
