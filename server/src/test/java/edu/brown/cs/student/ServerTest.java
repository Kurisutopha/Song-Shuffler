package edu.brown.cs.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import com.squareup.moshi.Moshi;
import com.squareup.moshi.Types;
import edu.brown.cs.student.main.server.handlers.*;
import edu.brown.cs.student.main.server.storage.FirebaseUtilities;
import java.io.IOException;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import okio.Buffer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import spark.Spark;

/** Test the server handlers. */
public class ServerTest {

  private final Type mapStringObject =
      Types.newParameterizedType(Map.class, String.class, Object.class);
  private static FirebaseUtilities firebaseUtils;
  private static final String TEST_USER = "test-user-123";

  private Map<String, Object> deserializeResponse(HttpURLConnection connection) throws IOException {
    assertEquals(200, connection.getResponseCode());
    Moshi moshi = new Moshi.Builder().build();
    return (Map<String, Object>)
        moshi.adapter(mapStringObject).fromJson(new Buffer().readFrom(connection.getInputStream()));
  }

  @BeforeAll
  public static void setup_before_everything() throws IOException {
    Spark.port(0);
    Logger.getLogger("").setLevel(Level.WARNING);
    firebaseUtils = new FirebaseUtilities();
  }

  @BeforeEach
  public void setup() {
    // Initialize handlers
    GeoJSONHandler gjh = new GeoJSONHandler("src/test/resources/testdata/test_geojson.json");

    Spark.get("add-pin", new AddPinHandler(firebaseUtils));
    Spark.get("get-pins", new GetAllPinsHandler(firebaseUtils));
    Spark.get("clear-pins", new ClearPinsHandler(firebaseUtils));
    Spark.get("geojson", gjh);
    Spark.get("search_geojson", new SearchGeoJSONHandler(gjh));
    Spark.get("bounded_geojson", new GeoJSONBoundedHandler(gjh));

    Spark.init();
    Spark.awaitInitialization();
  }

  @AfterEach
  public void teardown() {
    Spark.unmap("add-pin");
    Spark.unmap("get-pins");
    Spark.unmap("clear-pins");
    Spark.unmap("geojson");
    Spark.unmap("search_geojson");
    Spark.unmap("bounded_geojson");
    Spark.awaitStop();
  }

  /**
   * Helper to start a connection to a specific API endpoint/params
   *
   * @param apiCall the call string, including endpoint
   * @return the connection for the given URL, just after connecting
   * @throws IOException if the connection fails for some reason
   */
  private static HttpURLConnection tryRequest(String apiCall) throws IOException {
    URL requestURL = new URL("http://localhost:" + Spark.port() + "/" + apiCall);
    HttpURLConnection clientConnection = (HttpURLConnection) requestURL.openConnection();
    clientConnection.setRequestMethod("GET");
    clientConnection.connect();
    return clientConnection;
  }

  @Test
  public void testBoundedGeoJSONBadRequest() throws IOException {
    HttpURLConnection clientConnection = tryRequest("bounded_geojson");

    Map<String, Object> response = deserializeResponse(clientConnection);
    assertEquals("error", response.get("response_type"));

    clientConnection.disconnect();
  }

  @Test
  public void testBoundedGeoJSONNoResults() throws IOException {
    HttpURLConnection clientConnection =
        tryRequest("bounded_geojson?minlat=0&maxlat=0&minlong=0&maxlong=0");

    Map<String, Object> response = deserializeResponse(clientConnection);
    assertEquals("success", response.get("response_type"));
    Map<String, Object> geoData = (Map<String, Object>) response.get("geo_data");
    List<Map<String, Object>> features = (List<Map<String, Object>>) geoData.get("features");
    assertEquals(0, features.size());

    clientConnection.disconnect();
  }

  @Test
  public void testBoundedGeoJSON() throws IOException {
    // Using Providence area coordinates
    HttpURLConnection clientConnection =
        tryRequest("bounded_geojson?minlat=41.82&maxlat=41.83&minlong=-71.41&maxlong=-71.40");

    Map<String, Object> response = deserializeResponse(clientConnection);
    assertEquals("success", response.get("response_type"));
    assertNotEquals(null, response.get("geo_data"));

    clientConnection.disconnect();
  }

  @Test
  public void testAddingPin() throws IOException {
    // Get initial pin count
    HttpURLConnection getConnection = tryRequest("get-pins");
    Map<String, Object> initialResponse = deserializeResponse(getConnection);
    List<Map<String, Object>> initialPins = (List<Map<String, Object>>) initialResponse.get("pins");
    int initialSize = initialPins != null ? initialPins.size() : 0;

    // Add a pin
    HttpURLConnection clientConnection =
        tryRequest("add-pin?uid=" + TEST_USER + "&lat=41.8268&lng=-71.4025");

    Map<String, Object> response = deserializeResponse(clientConnection);
    assertEquals("success", response.get("response_type"));

    // Verify pin was added
    HttpURLConnection getConnection2 = tryRequest("get-pins");
    Map<String, Object> verifyResponse = deserializeResponse(getConnection2);
    List<Map<String, Object>> allPins = (List<Map<String, Object>>) verifyResponse.get("pins");
    assertEquals(initialSize + 1, allPins.size());

    clientConnection.disconnect();
    getConnection.disconnect();
    getConnection2.disconnect();
  }

  @Test
  public void testClearingPins() throws IOException {
    // Add test pin first
    tryRequest("add-pin?uid=" + TEST_USER + "&lat=41.8268&lng=-71.4025");

    // Clear pins
    HttpURLConnection clientConnection = tryRequest("clear-pins?uid=" + TEST_USER);
    deserializeResponse(clientConnection);

    // Verify pins were cleared
    HttpURLConnection getConnection = tryRequest("get-pins");
    Map<String, Object> response = deserializeResponse(getConnection);
    List<Map<String, Object>> pins = (List<Map<String, Object>>) response.get("pins");

    // Check no pins belong to test user
    for (Map<String, Object> pin : pins) {
      assertNotEquals(TEST_USER, pin.get("uid"));
    }

    clientConnection.disconnect();
    getConnection.disconnect();
  }

  @Test
  public void testSearchGeoJSONBadRequest() throws IOException {
    HttpURLConnection clientConnection = tryRequest("search_geojson");
    Map<String, Object> response = deserializeResponse(clientConnection);
    assertEquals("error", response.get("response_type"));
    clientConnection.disconnect();
  }

  @Test
  public void testSearchGeoJSONNoResults() throws IOException {
    HttpURLConnection clientConnection = tryRequest("search_geojson?query=nonexistenttext123");

    Map<String, Object> response = deserializeResponse(clientConnection);
    assertEquals("success", response.get("response_type"));
    Map<String, Object> geoData = (Map<String, Object>) response.get("geo_data");
    List<Map<String, Object>> features = (List<Map<String, Object>>) geoData.get("features");
    assertEquals(0, features.size());

    clientConnection.disconnect();
  }

  @Test
  public void testSearchGeoJSONWithResults() throws IOException {
    HttpURLConnection clientConnection = tryRequest("search_geojson?query=residential");

    Map<String, Object> response = deserializeResponse(clientConnection);
    assertEquals("success", response.get("response_type"));
    Map<String, Object> geoData = (Map<String, Object>) response.get("geo_data");
    List<Map<String, Object>> features = (List<Map<String, Object>>) geoData.get("features");
    assertNotEquals(0, features.size());

    clientConnection.disconnect();
  }

  @Test
  public void testGetAllPinsEmpty() throws IOException {
    // Clear any existing pins for test user
    tryRequest("clear-pins?uid=" + TEST_USER);

    HttpURLConnection clientConnection = tryRequest("get-pins");
    Map<String, Object> response = deserializeResponse(clientConnection);
    List<Map<String, Object>> pins = (List<Map<String, Object>>) response.get("pins");

    assertEquals("success", response.get("response_type"));
    assertEquals(0, pins.size());

    clientConnection.disconnect();
  }

  @Test
  public void testClearPinsNoUser() throws IOException {
    HttpURLConnection clientConnection = tryRequest("clear-pins");
    Map<String, Object> response = deserializeResponse(clientConnection);
    assertEquals("error", response.get("response_type"));
    clientConnection.disconnect();
  }

  @Test
  public void testAddPinInvalidCoordinates() throws IOException {
    HttpURLConnection clientConnection =
        tryRequest("add-pin?uid=" + TEST_USER + "&lat=invalid&lng=-71.4025");

    Map<String, Object> response = deserializeResponse(clientConnection);
    assertEquals("error", response.get("response_type"));

    clientConnection.disconnect();
  }
}
