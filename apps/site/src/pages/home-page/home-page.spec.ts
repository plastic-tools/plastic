// import { TestWindow } from "@stencil/core/testing";
import { HomePage } from "./home-page";

describe("home-page", () => {
  it("should build", () => {
    expect(new HomePage()).toBeTruthy();
  });
});
