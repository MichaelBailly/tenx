import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import SongEditForm from "~/components/review/SongEditForm.vue";
import type { ApiSong } from "~/types/api";

const mockSong: ApiSong = {
  _id: "aa14d71kp5ghk2i9fqd7v27v1ua2vp1pb62",
  title: "Test Song",
  artist: "Test Artist",
  genre: "Rock",
  album: "Test Album",
  date: 2020,
  tracknumber: 1,
  duration: 180,
  filename: "test.mp3",
  hits: 0,
  reviewed: false,
  sha1: "1234567890abcdef1234567890abcdef12345678",
  tokenartists: ["test-artist-token"],
  tokentitle: "test-song-token",
  canEdit: true,
  ts_creation: 1609459200000, // Jan 1, 2021
  valid: true,
};

describe("SongEditForm", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    wrapper = mount(SongEditForm, {
      props: { song: { ...mockSong } },
    });
  });

  it("renders required and optional fields", () => {
    expect(wrapper.find("input#title").exists()).toBe(true);
    expect(wrapper.find("input#artist").exists()).toBe(true);
    expect(wrapper.find("input#genre").exists()).toBe(true);
    expect(wrapper.find("input#album").exists()).toBe(true);
    expect(wrapper.find("input#year").exists()).toBe(true);
    expect(wrapper.find("input#tracknumber").exists()).toBe(true);
  });

  it("disables Save button if required fields are empty", async () => {
    await wrapper.find("input#title").setValue("");
    await wrapper.find("input#artist").setValue("");
    await wrapper.find("input#genre").setValue("");
    const saveBtn = wrapper.find('button[type="submit"]');
    expect(saveBtn.attributes("disabled")).toBeDefined();
  });

  it("enables Save button when required fields are filled", async () => {
    await wrapper.find("input#title").setValue("A");
    await wrapper.find("input#artist").setValue("B");
    await wrapper.find("input#genre").setValue("C");
    const saveBtn = wrapper.find('button[type="submit"]');
    expect(saveBtn.attributes("disabled")).toBeUndefined();
  });

  it("emits save event with edited song on submit", async () => {
    await wrapper.find("input#title").setValue("New Title");
    await wrapper.find("form").trigger("submit.prevent");
    const emitted = wrapper.emitted() as Record<string, unknown[][]>;
    expect(emitted.save).toBeTruthy();
    const savePayload = emitted.save?.[0]?.[0] as ApiSong;
    expect(savePayload.title).toBe("New Title");
  });

  it("emits cancel event and resets form on cancel", async () => {
    await wrapper.find("input#title").setValue("Changed");
    await wrapper.find('button[type="button"]').trigger("click");
    const emitted = wrapper.emitted();
    expect(emitted.cancel).toBeTruthy();
    // After cancel, the form should reset to original song title
    const input = wrapper.find("input#title").element as HTMLInputElement;
    expect(input.value).toBe(mockSong.title);
  });
});
