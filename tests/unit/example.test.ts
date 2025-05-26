import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import IndexPage from "../../pages/index.vue";

describe("Index Page", () => {
  it("renders properly", async () => {
    const wrapper = await mountSuspended(IndexPage);
    expect(wrapper.text()).toContain("Sign in");
  });
});
