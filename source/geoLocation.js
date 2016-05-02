export default class GeoLocation {
  /**
   * GeoLocation class to store theme park locations and supply helper functions
   * @param longitude
   * @param latitude
   */
  constructor({
    longitude = 0,
    latitude = 0
  }) {
    this.longitude = longitude;
    this.latitude = latitude;
  }

  /**
   * Return this GeoLocation safe for printing
   * @returns {string} String formatted as: ([latitude], [longitude])
   */
  toString() {
    return "(" + (this.latitude < 0 ? -this.latitude + "°S" : this.latitude + "°N") + ", " + (this.longitude < 0 ? -this.longitude + "°W" : this.longitude + "°E") + ")";
  }

  /**
   * Return a URL to this park on Google Maps
   * @returns {string} URL to this park on Google Maps
   */
  toGoogleMaps() {
    return "http://maps.google.com/?ll=" + this.latitude + "," + this.longitude;
  }
}