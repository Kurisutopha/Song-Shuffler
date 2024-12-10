package edu.brown.cs.student.main.server;

import java.util.List;

public class Question {
  private String questionText;
  private List<String> options;
  private String correctAnswer;

  public Question(String questionText, List<String> options, String correctAnswer) {
    this.questionText = questionText;
    this.options = options;
    this.correctAnswer = correctAnswer;
  }

  public String getQuestionText() {
    return questionText;
  }

  public List<String> getOptions() {
    return options;
  }

  public String getCorrectAnswer() {
    return correctAnswer;
  }

  public void setQuestionText(String questionText) {
    this.questionText = questionText;
  }

  public void setOptions(List<String> options) {
    this.options = options;
  }

  public void setCorrectAnswer(String correctAnswer) {
    this.correctAnswer = correctAnswer;
  }
}
