package edu.brown.cs.student.main.server;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class GameService {
  private final Set<String> readyPlayers = ConcurrentHashMap.newKeySet();

  public void addReadyPlayer(String playerId) {
    readyPlayers.add(playerId);
  }

  public void removeReadyPlayer(String playerId) {
    readyPlayers.remove(playerId);
  }

  public Set<String> getReadyPlayers() {
    return readyPlayers;
  }
}
