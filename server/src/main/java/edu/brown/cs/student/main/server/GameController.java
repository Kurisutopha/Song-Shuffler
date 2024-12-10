package edu.brown.cs.student.main.server;

import com.squareup.moshi.Moshi;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
public class GameController {

  private final SimpMessagingTemplate messagingTemplate;
  private final Map<String, Integer> scores = new ConcurrentHashMap<>();

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

  @Autowired
  public GameController(SimpMessagingTemplate messagingTemplate) {
    this.messagingTemplate = messagingTemplate;
  }

  @MessageMapping("/start")
  @SendTo("/topic/game")
  public GameMessage startGame() {
    if (currentQuestionIndex < questions.size()) {
      Question question = questions.get(currentQuestionIndex);

      Map<String, Object> questionMessage = new HashMap<>();
      questionMessage.put("type", "QUESTION");
      questionMessage.put("questionText", question.getQuestionText());
      questionMessage.put("options", question.getOptions());

      currentQuestionIndex++;
      return new GameMessage("QUESTION", questionMessage);
    } else {
      Map<String, Object> gameOverMessage = new HashMap<>();
      gameOverMessage.put("type", "GAME_OVER");
      gameOverMessage.put("finalScores", scores);

      return new GameMessage("GAME_OVER", gameOverMessage);
    }
  }

  @MessageMapping("/submit")
  public void submitResponse(PlayerSubmission submission) {
    String playerId = submission.getPlayerId();
    String answer = submission.getAnswer();

    if (playerId != null && answer != null) {
      Question currentQuestion = questions.get(currentQuestionIndex - 1);
      if (currentQuestion.getCorrectAnswer().equals(answer)) {
        scores.put(playerId, scores.getOrDefault(playerId, 0) + 10);

        Map<String, Object> scoreMessage = new HashMap<>();
        scoreMessage.put("type", "SCORE_UPDATE");
        scoreMessage.put("playerId", playerId);
        scoreMessage.put("score", scores.get(playerId));

        // Broadcast score update to all clients
        messagingTemplate.convertAndSend(
            "/topic/game", new GameMessage("SCORE_UPDATE", scoreMessage));
      }
    }
  }

  // Supporting classes for STOMP messaging
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
