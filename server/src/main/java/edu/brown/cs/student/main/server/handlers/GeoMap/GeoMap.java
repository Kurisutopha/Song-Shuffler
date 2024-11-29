package edu.brown.cs.student.main.server.handlers.GeoMap;

public class GeoMap {
  public String type;
  public Geometry geometry;
  public Property properties;

  public Geometry getGeometry() {
    return this.geometry;
  }

  public Property getProperty() {
    return this.properties;
  }
}
