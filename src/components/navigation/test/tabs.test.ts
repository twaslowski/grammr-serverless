import { isTabActive, TABS } from "@/components/navigation/tabs";

describe("isTabActive", () => {
  /**
   * The Study tab is `/dashboard`, which is a prefix of every other route in
   * the app. Matching it on prefix would leave it lit on every page.
   */
  it("matches the Study tab only on an exact path", () => {
    expect(isTabActive("/dashboard", "/dashboard")).toBe(true);
    expect(isTabActive("/dashboard", "/dashboard/dictionary")).toBe(false);
    expect(isTabActive("/dashboard", "/dashboard/settings")).toBe(false);
  });

  it("keeps a tab active on its nested routes", () => {
    expect(isTabActive("/dashboard/flashcards", "/dashboard/flashcards")).toBe(
      true,
    );
    expect(
      isTabActive("/dashboard/flashcards", "/dashboard/flashcards/42"),
    ).toBe(true);
  });

  /** `/dashboard/translated` must not activate `/dashboard/translate`. */
  it("does not match a sibling route that merely shares a prefix", () => {
    expect(isTabActive("/dashboard/translate", "/dashboard/translated")).toBe(
      false,
    );
  });

  it("leaves every tab inactive on a page that is not one", () => {
    const active = TABS.filter((tab) =>
      isTabActive(tab.href, "/dashboard/settings/account"),
    );
    expect(active).toHaveLength(0);
  });

  it("activates exactly one tab per tab route", () => {
    for (const tab of TABS) {
      const active = TABS.filter((candidate) =>
        isTabActive(candidate.href, tab.href),
      );
      expect(active).toEqual([tab]);
    }
  });
});
