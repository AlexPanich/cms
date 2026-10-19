import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("can", () => {
  const editor = { permissions: new Set(["view_admin", "edit_pages"] as const) };

  it("разрешает действие при наличии права", () => {
    expect(can(editor, "edit_pages")).toBe(true);
  });

  it("запрещает действие без права", () => {
    expect(can(editor, "edit_users")).toBe(false);
  });

  it("запрещает всё гостю", () => {
    expect(can(null, "view_admin")).toBe(false);
  });
});
