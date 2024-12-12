package edu.brown.cs.student.main.server;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler {

  private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
  private final Object sessionsLock = new Object();

  @Override
  public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    if (session != null) {
      synchronized (sessionsLock) {
        if (session.isOpen()) {
          sessions.put(session.getId(), session);
          System.out.println(
              "Connection Established - Session ID: "
                  + session.getId()
                  + ", URI: "
                  + session.getUri()
                  + ", Is Open: "
                  + session.isOpen());
          logSessionState("Connection Established");
        } else {
          System.out.println("Session is not open: " + session.getId());
        }
      }
    } else {
      System.out.println("Null session received");
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
    synchronized (sessionsLock) {
      if (sessions.containsKey(session.getId())) {
        sessions.remove(session.getId());
        logSessionState("Connection Closed");
      }
    }
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    // Log received message
    System.out.println(
        "Message received from session " + session.getId() + ": " + message.getPayload());
  }

  public void broadcastMessage(String message) {
    synchronized (sessionsLock) {
      // Additional logging to track session state before broadcast
      System.out.println("Broadcast Attempt Details:");
      System.out.println("Total Sessions: " + sessions.size());
      sessions.forEach(
          (id, session) -> System.out.println("Session ID: " + id + ", Open: " + session.isOpen()));

      if (sessions.isEmpty()) {
        System.out.println("NO ACTIVE SESSIONS - BROADCAST FAILED");
        return;
      }

      for (WebSocketSession session : sessions.values()) {
        try {
          if (session.isOpen()) {
            session.sendMessage(new TextMessage(message));
            System.out.println("Successfully sent message to session: " + session.getId());
          } else {
            System.out.println("Session not open, cannot send: " + session.getId());
            sessions.remove(session.getId());
          }
        } catch (IOException e) {
          System.err.println("Error sending message to session: " + session.getId());
          e.printStackTrace();
          sessions.remove(session.getId());
        }
      }

      logSessionState("After Broadcast");
    }
  }

  private void logSessionState(String context) {
    System.out.println("===== " + context + " =====");
    System.out.println("Active Sessions: " + sessions.size());
    sessions.forEach(
        (id, session) -> System.out.println("Session ID: " + id + ", Open: " + session.isOpen()));
    System.out.println("====================");
  }

  public int getActiveSessionCount() {
    return sessions.size();
  }
}
