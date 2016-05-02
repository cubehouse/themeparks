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
   * @returns {string} String formatted as: ([longitude], [latitude])
   */
  toString() {
    return "(" + this.longitude + ", " + this.latitude + ")";
  }

  /**
   * Return a URL to this park on Google Maps
   * @returns {string} URL to this park on Google Maps
   */
  toGoogleMaps() {
    return "http://maps.google.com/?ll=" + this.longitude + "," + this.latitude;
  }
}