package edu.brown.cs.student.main.server;

import com.squareup.moshi.Moshi;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
public class GameController {

  private final WebSocketEventListener webSocketEventListener;

  private final SimpMessagingTemplate messagingTemplate;
  private final GameService gameService;
  private final Map<String, Integer> playerScores = new ConcurrentHashMap<>();
  private final Set<String> submittedPlayers = ConcurrentHashMap.newKeySet();

  //  private final Set<String> readyPlayers = ConcurrentHashMap.newKeySet();
  private Set<String> activePlayers = ConcurrentHashMap.newKeySet();

  private List<Question> questions =
      List.of(
          new Question("What is 2 + 2?", List.of("3", "4", "5", "6"), "4"),
          new Question(
              "What is the capital of France?",
              List.of("Paris", "London", "Berlin", "Rome"),
              "Paris"),
          new Question(
              "Which color is created by mixing red and yellow?",
              List.of("Green", "Orange", "Blue", "Purple"),
              "Orange"));

  private int currentQuestionIndex = 0;
  private final Moshi moshi = new Moshi.Builder().build();
  private boolean gameStarted = false;

  @MessageMapping("/set-questions")
  public void setQuestions(List<Question> newQuestions) {
    // if (newQuestions != null && !newQuestions.isEmpty()) {

    this.questions = newQuestions;
    System.out.println(newQuestions);
    // console.log(newQuestions);
    // Reset game state when new questions are set
    currentQuestionIndex = 0;
    playerScores.clear();
    submittedPlayers.clear();
  }

  @Autowired
  public GameController(
      SimpMessagingTemplate messagingTemplate,
      WebSocketEventListener webSocketEventListener,
      GameService gameService) {
    this.messagingTemplate = messagingTemplate;
    this.webSocketEventListener = webSocketEventListener;
    this.gameService = gameService;
  }

  public void removeReadyPlayer(String playerId) {
    gameService.removeReadyPlayer(playerId);

    // Broadcast updated ready players count
    Map<String, Object> readyMessage = new HashMap<>();
    readyMessage.put("type", "PLAYERS_READY");
    readyMessage.put("readyCount", gameService.getReadyPlayers().size());

    messagingTemplate.convertAndSend("/topic/game", new GameMessage("PLAYERS_READY", readyMessage));
  }

  // System.out.println("before songs received");
  public class SongSubmission {
    private List<String> songs;

    // Getters and setters
    public List<String> getSongs() {
      return songs;
    }

    public void setSongs(List<String> songs) {
      this.songs = songs;
    }
  }

  @MessageMapping("/set-songs")
  @SendTo("/topic/game")
  public void setSongs(@Payload List<String> songs) {
    // Convert incoming songs to Question objects
    // List<String> songs = submission.getSongs();
    System.out.println("Recieved songs in GameController: " + songs);
    if (songs == null || songs.isEmpty()) {
      System.err.println("Recieved empty or null songs list");
      return;
    }
    try {

      List<Question> songQuestions =
          songs.stream()
              .map(song -> new Question("What is the name of this song?", songs, song))
              .collect(Collectors.toList());

      System.out.println("Created song questions: " + songQuestions);

      // Update the questions list
      this.questions = songQuestions;

      // Reset game state
      currentQuestionIndex = 0;
      playerScores.clear();
      submittedPlayers.clear();

      // Broadcast that songs have been updated
      Map<String, Object> songsUpdateMessage = new HashMap<>();
      songsUpdateMessage.put("type", "SONGS_UPDATED");
      songsUpdateMessage.put("songCount", songQuestions.size());

      messagingTemplate.convertAndSend(
          "/topic/game", new GameMessage("SONGS_UPDATED", songsUpdateMessage));

      if (!songQuestions.isEmpty() || songQuestions.size() == 3) {
        Question firstQuestion = songQuestions.get(0);
        Map<String, Object> questionMessage = new HashMap<>();
        questionMessage.put("type", "QUESTION");
        questionMessage.put("questionText", firstQuestion.getQuestionText());
        questionMessage.put("options", firstQuestion.getOptions());

        messagingTemplate.convertAndSend(
            "/topic/game", new GameMessage("QUESTION", questionMessage));
      }

    } catch (Exception e) {
      System.err.println("Error processing songs: " + e.getMessage());
      e.printStackTrace();
    }
  }

  @MessageMapping("/start")
  @SendTo("/topic/game")
  public GameMessage startGame() {

    if (questions == null || questions.isEmpty() || questions.size() == 3) {
      Map<String, Object> errorMessage = new HashMap<>();
      errorMessage.put("type", "ERROR");
      errorMessage.put("message", "No questions available. Please set questions first.");
      return new GameMessage("ERROR", errorMessage);
    }
    /*
        public void setQuestions(List<Question> newQuestions) {
        if (newQuestions != null && !newQuestions.isEmpty()) {
            this.questions = newQuestions;
            // Reset game state when new questions are set
            currentQuestionIndex = 0;
            playerScores.clear();
            submittedPlayers.clear();
        }
    }
    */
    if (!gameService.getReadyPlayers().isEmpty()
        && gameService.getReadyPlayers().size() == getActivePlayerCount()) {
      System.out.println("resetting game");
      // Reset game state
      // this.questions = newQuestions;
      currentQuestionIndex = 0;
      playerScores.clear();
      submittedPlayers.clear();
      activePlayers.clear();
      gameStarted = true;

      if (currentQuestionIndex < questions.size()) {
        System.out.println("in questions index stuff ");
        Question question = questions.get(currentQuestionIndex);

        Map<String, Object> questionMessage = new HashMap<>();
        System.out.println("in questions mapping function ");

        questionMessage.put("type", "QUESTION");
        questionMessage.put("questionText", question.getQuestionText());
        questionMessage.put("options", question.getOptions());

        currentQuestionIndex++;
        return new GameMessage("QUESTION", questionMessage);
      } else {
        Map<String, Object> gameOverMessage = new HashMap<>();
        gameOverMessage.put("type", "GAME_OVER");
        gameOverMessage.put("finalScores", playerScores);

        return new GameMessage("GAME_OVER", gameOverMessage);
      }
    } else {
      // Not enough players ready
      Map<String, Object> waitingMessage = new HashMap<>();
      waitingMessage.put("type", "WAITING_FOR_PLAYERS");
      waitingMessage.put("readyCount", gameService.getReadyPlayers().size());
      waitingMessage.put("totalPlayers", getActivePlayerCount());

      return new GameMessage("WAITING_FOR_PLAYERS", waitingMessage);
    }
  }

  @MessageMapping("/submit")
  public void submitResponse(PlayerSubmission submission) {
    String playerId = submission.getPlayerId();
    String answer = submission.getAnswer();

    if (playerId != null && answer != null) {
      submittedPlayers.add(playerId);

      Question currentQuestion = questions.get(currentQuestionIndex - 1);
      if (currentQuestion.getCorrectAnswer().equals(answer)) {
        playerScores.put(playerId, playerScores.getOrDefault(playerId, 0) + 10);

        Map<String, Object> scoreMessage = new HashMap<>();
        scoreMessage.put("type", "SCORE_UPDATE");
        scoreMessage.put("playerId", playerId);
        scoreMessage.put("score", playerScores.get(playerId));

        // Broadcast score update to all clients
        messagingTemplate.convertAndSend(
            "/topic/game", new GameMessage("SCORE_UPDATE", scoreMessage));
      }
      if (submittedPlayers.size() >= getActivePlayerCount()) {
        // Move to next question
        sendNextQuestion();
      }
    }
  }

  @MessageMapping("/player-ready")
  @SendTo("/topic/game")
  public GameMessage playerReady(
      PlayerReadySubmission submission, SimpMessageHeaderAccessor headerAccessor) {
    String playerId = submission.getPlayerId();
    String sessionId = headerAccessor.getSessionId();

    // Get the session ID associated with this WebSocket connection

    System.out.println("Received player ready request for playerId: " + playerId);

    if (playerId != null) {
      gameService.addReadyPlayer(playerId);

      webSocketEventListener.registerPlayerSession(sessionId, playerId);
      gameService.addReadyPlayer(playerId);

      // Broadcast current ready players count
      Map<String, Object> readyMessage = new HashMap<>();
      readyMessage.put("type", "PLAYERS_READY");
      readyMessage.put("readyCount", gameService.getReadyPlayers().size());

      return new GameMessage("PLAYERS_READY", readyMessage);
    }

    return null;
  }

  private void sendNextQuestion() {
    submittedPlayers.clear();

    if (currentQuestionIndex < questions.size()) {

      Question question = questions.get(currentQuestionIndex);

      Map<String, Object> questionMessage = new HashMap<>();
      questionMessage.put("type", "QUESTION");
      questionMessage.put("questionText", question.getQuestionText());
      questionMessage.put("options", question.getOptions());

      messagingTemplate.convertAndSend("/topic/game", new GameMessage("QUESTION", questionMessage));
      currentQuestionIndex++;

    } else {
      // If there are no more questions, end the game
      Map<String, Object> gameOverMessage = new HashMap<>();
      gameOverMessage.put("type", "GAME_OVER");
      gameOverMessage.put("finalScores", playerScores);

      messagingTemplate.convertAndSend(
          "/topic/game", new GameMessage("GAME_OVER", gameOverMessage));
    }
  }

  private int getActivePlayerCount() {
    // In a real-world scenario, you might want to track active players more robustly
    // This is a simple placeholder that assumes all players who have joined are active
    return this.webSocketEventListener.getActiveSessions().size();
  } // Supporting classes for STOMP messaging

  public static class GameMessage {
    private String type;
    private Object payload;

    public GameMessage() {}

    public GameMessage(String type, Object payload) {
      this.type = type;
      this.payload = payload;
    }

    // Getters and setters
    public String getType() {
      return type;
    }

    public void setType(String type) {
      this.type = type;
    }

    public Object getPayload() {
      return payload;
    }

    public void setPayload(Object payload) {
      this.payload = payload;
    }
  }

  public static class PlayerReadySubmission {
    private String playerId;

    public String getPlayerId() {
      return playerId;
    }

    public void setPlayerId(String playerId) {
      this.playerId = playerId;
    }
  }

  public static class PlayerSubmission {
    private String playerId;
    private String answer;

    // Getters and setters
    public String getPlayerId() {
      return playerId;
    }

    public void setPlayerId(String playerId) {
      this.playerId = playerId;
    }

    public String getAnswer() {
      return answer;
    }

    public void setAnswer(String answer) {
      this.answer = answer;
    }
  }
}
