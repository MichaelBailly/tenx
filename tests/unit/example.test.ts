import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import IndexPage from "../../pages/index.vue";

describe("Index Page", () => {
  it("renders properly", () => {
    const wrapper = mount(IndexPage);
    expect(wrapper.find("div").classes()).toContain("bg-red-500");
    expect(wrapper.text()).toContain("Hello");
  });
});
