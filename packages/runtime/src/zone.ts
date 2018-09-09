/**
 * Zones hold top level references to various system resources and are how you
 * access different services in different runtimes.
 *
 * For now, this one just creates a default zone, exposing globals.
 */

export default class Zone {
  /** The root element your application can hook onto. */
  ui = { root: document && document.body, document };
  static currentZone = new Zone();
}
