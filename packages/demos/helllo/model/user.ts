import { tracked } from "@plastic/reactor";
import { Zone } from "@plastic/runtime";

export default class User {
  constructor(readonly zone = Zone.currentZone) {}

  @tracked
  firstName: string;
  @tracked
  lastName: string;

  get fullName() {
    const { firstName, lastName } = this;
    return firstName && lastName
      ? [firstName, lastName].join(" ")
      : firstName || lastName || "Anonymous";
  }

  @tracked
  static get currentUser() {
    return new User(Zone.currentZone);
  }
}
