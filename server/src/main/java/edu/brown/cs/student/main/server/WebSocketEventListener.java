package edu.brown.cs.student.main.server;

import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

  private final ConcurrentHashMap<String, String> activeSessions = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, String> sessionToPlayerMap = new ConcurrentHashMap<>();

  private final GameService gameService;

  @Autowired
  public WebSocketEventListener(GameService gameService) {
    this.gameService = gameService;
  }

  public ConcurrentHashMap<String, String> getActiveSessions() {
    return activeSessions;
  }

  public void registerPlayerSession(String sessionId, String playerId) {
    sessionToPlayerMap.put(sessionId, playerId);
  }

  @EventListener
  public void handleWebSocketConnectListener(SessionConnectEvent event) {
    StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
    String sessionId = headerAccessor.getSessionId();

    if (sessionId != null) {
      activeSessions.put(sessionId, sessionId);

      System.out.println("New connection: " + sessionId);
      System.out.println("Currently connected clients: " + activeSessions.size());
    }
  }

  @EventListener
  public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
    StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
    String sessionId = headerAccessor.getSessionId();

    if (sessionId != null) {
      activeSessions.remove(sessionId);

      String playerId = sessionToPlayerMap.remove(sessionId);

      if (playerId != null) {
        gameService.removeReadyPlayer(playerId);
        System.out.println("Removed playerId on disconnect: " + playerId);
      }

      System.out.println("Disconnected session: " + sessionId);
      System.out.println("Currently connected clients: " + activeSessions.size());
    }
  }
}
