package edu.brown.cs.student.main.server;

import static spark.Spark.after;

import edu.brown.cs.student.main.server.handlers.AddPinHandler;
import edu.brown.cs.student.main.server.handlers.AddWordHandler;
import edu.brown.cs.student.main.server.handlers.ClearPinsHandler;
import edu.brown.cs.student.main.server.handlers.ClearUserHandler;
import edu.brown.cs.student.main.server.handlers.GeoJSONBoundedHandler;
import edu.brown.cs.student.main.server.handlers.GeoJSONHandler;
import edu.brown.cs.student.main.server.handlers.GetAllPinsHandler;
import edu.brown.cs.student.main.server.handlers.ListWordsHandler;
import edu.brown.cs.student.main.server.handlers.SearchGeoJSONHandler;
import edu.brown.cs.student.main.server.storage.FirebaseUtilities;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.io.IOException;
import spark.Filter;
import spark.Spark;

/** Top Level class for our project, utilizes spark to create and maintain our server. */
public class Server {

  public static void setUpServer() {
    int port = 3232;
    Spark.port(port);

    after(
        (Filter)
            (request, response) -> {
              response.header("Access-Control-Allow-Origin", "*");
              response.header("Access-Control-Allow-Methods", "*");
            });

    StorageInterface firebaseUtils;
    try {
      firebaseUtils = new FirebaseUtilities();

      Spark.get("add-word", new AddWordHandler(firebaseUtils));
      Spark.get("list-words", new ListWordsHandler(firebaseUtils));
      Spark.get("clear-user", new ClearUserHandler(firebaseUtils));

      // New pin endpoints
      Spark.get("add-pin", new AddPinHandler(firebaseUtils));
      Spark.get("get-pins", new GetAllPinsHandler(firebaseUtils));
      Spark.get("clear-pins", new ClearPinsHandler(firebaseUtils));
      GeoJSONHandler gjh =
          new GeoJSONHandler(
              "src/main/java/edu/brown/cs/student/main/server/handlers/GeoMap/geodata/fullDownload.json");
      Spark.get("geojson", gjh);
      Spark.get("search_geojson", new SearchGeoJSONHandler(gjh));
      Spark.get("bounded_geojson", new GeoJSONBoundedHandler(gjh));
      Spark.notFound(
          (request, response) -> {
            response.status(404); // Not Found
            System.out.println("ERROR");
            return "404 Not Found - The requested endpoint does not exist.";
          });
      Spark.init();
      Spark.awaitInitialization();

      System.out.println("Server started at http://localhost:" + port);
    } catch (IOException e) {
      e.printStackTrace();
      System.err.println(
          "Error: Could not initialize Firebase. Likely due to firebase_config.json not being found. Exiting.");
      System.exit(1);
    }
  }

  /**
   * Runs Server.
   *
   * @param args none
   */
  public static void main(String[] args) {
    setUpServer();
  }
}
