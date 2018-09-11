const Responder = Parent =>
  class extends Parent {
    // some properties go here
  };

class Foo {}
class Bar extends Responder(Foo) {}
