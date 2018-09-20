import { TestWindow } from "@stencil/core/testing";
import { PlasticChat } from "./plastic-chat";

describe("plastic-chat", () => {
  it("should build", () => {
    expect(new PlasticChat()).toBeTruthy();
  });

  describe("rendering", () => {
    let element: HTMLPlasticChatElement;
    let testWindow: TestWindow;

    beforeEach(async () => {
      testWindow = new TestWindow();
      element = await testWindow.load({
        components: [PlasticChat],
        html: "<plastic-chat></plastic-chat>"
      });
    });

    it("should work without parameters", () => {
      expect(element.textContent.trim()).toEqual("Hello World!");
    });

    it("should work with a name", async () => {
      element.name = "Charles";
      await testWindow.flush();
      expect(element.textContent.trim()).toEqual("Hello Charles!");
    });
  });
});
