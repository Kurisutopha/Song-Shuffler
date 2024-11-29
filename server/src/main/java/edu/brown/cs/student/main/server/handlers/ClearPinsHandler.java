package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class ClearPinsHandler implements Route {
  private final StorageInterface storageHandler;

  public ClearPinsHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      // Get the user ID from the request parameters
      String uid = request.queryParams("uid");
      if (uid == null || uid.isEmpty()) {
        throw new IllegalArgumentException("Missing required parameter: uid");
      }

      // Clear all pins for the specified user
      this.storageHandler.clearUserPins(uid);

      responseMap.put("response_type", "success");
      responseMap.put("message", "All pins cleared for user: " + uid);

    } catch (Exception e) {
      // Handle any errors that occur
      e.printStackTrace();
      responseMap.put("response_type", "error");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
