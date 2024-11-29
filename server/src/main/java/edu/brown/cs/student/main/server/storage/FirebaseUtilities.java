package edu.brown.cs.student.main.server.storage;

import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public class FirebaseUtilities implements StorageInterface {

  public FirebaseUtilities() throws IOException {

    // https://docs.google.com/document/d/10HuDtBWjkUoCaVj_A53IFm5torB_ws06fW3KYFZqKjc/edit?usp=sharing
    String workingDirectory = System.getProperty("user.dir");
    Path firebaseConfigPath =
        Paths.get(workingDirectory, "src", "main", "resources", "firebase_config.json");
    // ^-- if your /resources/firebase_config.json exists but is not found,
    // try printing workingDirectory and messing around with this path.

    FileInputStream serviceAccount = new FileInputStream(firebaseConfigPath.toString());

    FirebaseOptions options =
        new FirebaseOptions.Builder()
            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
            .build();

    FirebaseApp.initializeApp(options);
  }

  @Override
  public List<Map<String, Object>> getCollection(String uid, String collection_id)
      throws InterruptedException, ExecutionException, IllegalArgumentException {
    if (uid == null || collection_id == null) {
      throw new IllegalArgumentException("getCollection: uid and/or collection_id cannot be null");
    }

    // gets all documents in the collection 'collection_id' for user 'uid'

    Firestore db = FirestoreClient.getFirestore();
    // 1: Make the data payload to add to your collection
    CollectionReference dataRef = db.collection("users").document(uid).collection(collection_id);

    // 2: Get pin documents
    QuerySnapshot dataQuery = dataRef.get().get();

    // 3: Get data from document queries
    List<Map<String, Object>> data = new ArrayList<>();
    for (QueryDocumentSnapshot doc : dataQuery.getDocuments()) {
      data.add(doc.getData());
    }

    return data;
  }

  @Override
  public void addDocument(String uid, String collection_id, String doc_id, Map<String, Object> data)
      throws IllegalArgumentException {
    if (uid == null || collection_id == null || doc_id == null || data == null) {
      throw new IllegalArgumentException(
          "addDocument: uid, collection_id, doc_id, or data cannot be null");
    }

    Firestore db = FirestoreClient.getFirestore();

    // 1: Get a ref to the collection
    CollectionReference colRef = db.collection("users").document(uid).collection(collection_id);

    // 2: Write data to the collection ref
    colRef.document(doc_id).set(data);
  }

  // clears the collections inside of a specific user.
  @Override
  public void clearUser(String uid) throws IllegalArgumentException {
    if (uid == null) {
      throw new IllegalArgumentException("removeUser: uid cannot be null");
    }
    try {
      // removes all data for user 'uid'
      Firestore db = FirestoreClient.getFirestore();
      // 1: Get a ref to the user document
      DocumentReference userDoc = db.collection("users").document(uid);
      // 2: Delete the user document
      deleteDocument(userDoc);
    } catch (Exception e) {
      System.err.println("Error removing user : " + uid);
      System.err.println(e.getMessage());
    }
  }

  private void deleteDocument(DocumentReference doc) {
    // for each subcollection, run deleteCollection()
    Iterable<CollectionReference> collections = doc.listCollections();
    for (CollectionReference collection : collections) {
      deleteCollection(collection);
    }
    // then delete the document
    doc.delete();
  }

  // recursively removes all the documents and collections inside a collection
  // https://firebase.google.com/docs/firestore/manage-data/delete-data#collections
  private void deleteCollection(CollectionReference collection) {
    try {

      // get all documents in the collection
      ApiFuture<QuerySnapshot> future = collection.get();
      List<QueryDocumentSnapshot> documents = future.get().getDocuments();

      // delete each document
      for (QueryDocumentSnapshot doc : documents) {
        doc.getReference().delete();
      }

      // NOTE: the query to documents may be arbitrarily large. A more robust
      // solution would involve batching the collection.get() call.
    } catch (Exception e) {
      System.err.println("Error deleting collection : " + e.getMessage());
    }
  }

  @Override
  public void addPin(String uid, double latitude, double longitude)
      throws InterruptedException, ExecutionException {
    if (uid == null) {
      throw new IllegalArgumentException("addPin: uid cannot be null");
    }

    Firestore db = FirestoreClient.getFirestore();

    // Create pin data
    Map<String, Object> pinData = new HashMap<>();
    pinData.put("Lat", latitude);
    pinData.put("Long", longitude);
    pinData.put("TS", System.currentTimeMillis());
    pinData.put("UID", uid);

    // Add to Firebase under users/[uid]/pins/[pinId]
    String pinId = "pin-" + System.currentTimeMillis();
    // List<Map<String, Object>> pins = getAllPins();
    // pins.add(pinData);
    // db.collection("users").document(uid).update(pinData);

    // collect parameters from the request

    // get the current word count to make a unique word_id by index.
    int wordCount = this.getCollection(uid, "pins").size();
    String wordId = "pin-" + wordCount;

    // use the storage handler to add the document to the database
    this.addDocument(uid, "pins", wordId, pinData);

    // responseMap.put("word", word);
  }

  @Override
  public List<Map<String, Object>> getAllPins() throws InterruptedException, ExecutionException {
    Firestore db = FirestoreClient.getFirestore();
    List<Map<String, Object>> allPins = new ArrayList<>();

    // // Get all users
    // QuerySnapshot userDocs = db.collection("users").get().get();
    // For each user, get their pins
    Iterable<DocumentReference> dataRef = db.collection("users").listDocuments();

    List<Map<String, Object>> data = new ArrayList<>();
    for (DocumentReference doc : dataRef) {
      Iterable<DocumentReference> pins =
          db.collection("users").document(doc.getId()).collection("pins").listDocuments();
      for (DocumentReference p : pins) {
        DocumentSnapshot pinObj = p.get().get();
        allPins.add(pinObj.getData());
        // allPins.add
      }
    }

    // for (QueryDocumentSnapshot doc : userDocs.getDocuments()) {

    //   System.out.println("Hello");
    //   Iterable<DocumentReference> pins =
    //       db.collection("users").document(doc.getId()).collection("pins").listDocuments();
    //   for (DocumentReference p : pins) {
    //     DocumentSnapshot pinObj = p.get().get();
    //     System.out.println(pinObj);
    //     // allPins.add
    //   }

    //   // data.add(doc.getData());

    // }
    // for (DocumentSnapshot userDoc : userDocs.getDocuments()) {
    //   // Get pins subcollection
    //   System.out.println(userDoc.getData());
    //   QuerySnapshot pinDocs = userDoc.getReference().collection("pins").get().get();

    //   // Add each pin to our result list
    //   System.out.println(pinDocs.getDocuments().size());
    //   for (QueryDocumentSnapshot pinDoc : pinDocs.getDocuments()) {
    //     Map<String, Object> pinData = pinDoc.getData();
    //     pinData.put("id", pinDoc.getId());
    //     allPins.add(pinData);
    //   }
    // }

    // return allPins;

    // get all the words for the user
    // List<Map<String, Object>> vals = this.getCollection(uid, "words");

    // convert the key,value map to just a list of the words.
    // List<String> words = vals.stream().map(word -> word.get("word").toString()).toList();

    return allPins;
  }

  @Override
  public void clearUserPins(String uid) throws InterruptedException, ExecutionException {
    if (uid == null) {
      throw new IllegalArgumentException("clearUserPins: uid cannot be null");
    }

    Firestore db = FirestoreClient.getFirestore();

    // Get all pins for user
    QuerySnapshot pinDocs = db.collection("users").document(uid).collection("pins").get().get();

    // Delete each pin
    for (QueryDocumentSnapshot pinDoc : pinDocs.getDocuments()) {
      pinDoc.getReference().delete();
    }
  }
}
