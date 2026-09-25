import { KEYBOARD_SHORTCUTS } from "../keyboard-shortcuts.mjs";

export default function createScenario({
  createPairedAnalysis,
  fillVisibleQuickInput,
  hideDemoCaption,
  installDemoCursorOverlay,
  pause,
  pointDemoCursorAt,
  removeDemoCursorOverlay,
  showDemoCaption,
}) {
  return {
    recordingFile: "explore-menus-and-tree.webm",

    async prepareWorkspace({ workspaceDirectory }) {
      const pair = await createPairedAnalysis(workspaceDirectory);
      return pair.pythonFile;
    },

    async run({ page }) {
      // -----------------------------------------------------------------------
      // Explorer context menu
      // -----------------------------------------------------------------------

      await pause(2_500);

      await showDemoCaption({
        page,
        caption: {
          placement: "top-right",
          title: "Notebook tools where you work",
          description:
            "Right-click a file in Explorer, then open JotebookSync to find pairing, sync, conversion, and notebook commands.",
        },
      });

      await installDemoCursorOverlay({
        page,
      });

      // -----------------------------------------------------------------------
      // Find analysis.py
      // -----------------------------------------------------------------------

      const explorerFile = page
        .locator(".explorer-viewlet .monaco-list-row")
        .filter({
          hasText: "analysis.py",
        })
        .first();

      await explorerFile.waitFor({
        state: "visible",
        timeout: 15_000,
      });

      await explorerFile.scrollIntoViewIfNeeded();

      const explorerFileLabel = explorerFile.locator(".label-name").first();

      await explorerFileLabel.waitFor({
        state: "visible",
        timeout: 10_000,
      });

      // Put the demo cursor directly over analysis.py.
      await pointDemoCursorAt({
        page,
        locator: explorerFileLabel,
      });

      await pause(700);

      // -----------------------------------------------------------------------
      // Right-click analysis.py
      // -----------------------------------------------------------------------

      await explorerFileLabel.click({
        button: "right",
      });

      // Wait for VS Code's custom HTML context menu.
      const explorerContextMenu = page.locator(".monaco-menu:visible").first();

      await explorerContextMenu.waitFor({
        state: "visible",
        timeout: 10_000,
      });

      await pause(500);

      // -----------------------------------------------------------------------
      // Find JotebookSync in the Explorer context menu
      // -----------------------------------------------------------------------

      const jotebookSyncMenuItem = explorerContextMenu
        .locator(".action-item")
        .filter({
          hasText: "JotebookSync",
        })
        .first();

      await jotebookSyncMenuItem.waitFor({
        state: "visible",
        timeout: 10_000,
      });

      await pointDemoCursorAt({
        page,
        locator: jotebookSyncMenuItem,
      });

      await pause(500);

      // -----------------------------------------------------------------------
      // Open JotebookSync submenu
      // -----------------------------------------------------------------------

      await jotebookSyncMenuItem.hover();

      // Wait until both the parent menu and submenu are visible.
      await page.waitForFunction(
        () => {
          const visibleMenus = [
            ...document.querySelectorAll(".monaco-menu"),
          ].filter((menu) => {
            const bounds = menu.getBoundingClientRect();
            const style = window.getComputedStyle(menu);

            return (
              bounds.width > 0 &&
              bounds.height > 0 &&
              style.display !== "none" &&
              style.visibility !== "hidden"
            );
          });

          return visibleMenus.length >= 2;
        },
        undefined,
        {
          timeout: 10_000,
        },
      );

      await pause(500);

      // -----------------------------------------------------------------------
      // Locate JotebookSync submenu
      // -----------------------------------------------------------------------

      const visibleMenus = page.locator(".monaco-menu:visible");

      const jotebookSyncSubmenu = visibleMenus.last();

      await jotebookSyncSubmenu.waitFor({
        state: "visible",
        timeout: 10_000,
      });

      // -----------------------------------------------------------------------
      // Find Run Pre-commit Workflow
      // -----------------------------------------------------------------------

      const runPreCommitMenuItem = jotebookSyncSubmenu
        .locator(".action-item")
        .filter({
          hasText: "Run Pre-commit Workflow",
        })
        .first();

      await runPreCommitMenuItem.waitFor({
        state: "visible",
        timeout: 10_000,
      });

      console.log("[explore-menus-and-tree] Run Pre-commit Workflow found");

      // Move the demo cursor onto the submenu option.
      await pointDemoCursorAt({
        page,
        locator: runPreCommitMenuItem,
      });

      await runPreCommitMenuItem.hover();

      // Leave both menus visible long enough for the recording.
      await pause(4_000);

      await hideDemoCaption({
        page,
      });

      await removeDemoCursorOverlay({
        page,
      });

      // -----------------------------------------------------------------------
      // Close submenu + Explorer context menu
      // -----------------------------------------------------------------------

      await page.keyboard.press("Escape");

      await pause(200);

      await page.keyboard.press("Escape");

      await pause(700);

      // -----------------------------------------------------------------------
      // Command Palette
      // -----------------------------------------------------------------------

      await showDemoCaption({
        page,
        caption: {
          placement: "bottom-right",
          title: "All commands in the Command Palette",
          description:
            "Search for JotebookSync to reach the complete command set without leaving the editor.",
        },
      });

      await page.keyboard.press(KEYBOARD_SHORTCUTS.commandPalette);

      await fillVisibleQuickInput({
        page,
        value: "JotebookSync",
        readingPause: 3_800,
      });

      await hideDemoCaption({
        page,
      });

      await page.keyboard.press("Escape");

      await pause(700);

      // -----------------------------------------------------------------------
      // Paired Files tree
      // -----------------------------------------------------------------------

      const pairedFilesHeader = page
        .locator(".explorer-viewlet .pane-header")
        .filter({
          hasText: "JotebookSync: Paired Files",
        })
        .first();

      await pairedFilesHeader.scrollIntoViewIfNeeded();

      await pairedFilesHeader.waitFor({
        state: "visible",
        timeout: 10_000,
      });

      if ((await pairedFilesHeader.getAttribute("aria-expanded")) !== "true") {
        await pairedFilesHeader.click();
      }

      const pairedFilesPane = pairedFilesHeader.locator("..");

      const pairGroup = pairedFilesPane
        .locator(".monaco-list-row")
        .filter({
          hasText: "analysis",
        })
        .first();

      await pairGroup.waitFor({
        state: "visible",
        timeout: 20_000,
      });

      if ((await pairGroup.getAttribute("aria-expanded")) !== "true") {
        await pairGroup.click();
      }

      await showDemoCaption({
        page,
        caption: {
          placement: "bottom-right",
          title: "Every pair in one place",
          description:
            "The Paired Files tree groups existing representations and provides open, review, sync, detach, and remove actions.",
        },
      });

      await installDemoCursorOverlay({
        page,
      });

      const notebookItem = pairedFilesPane
        .locator(".monaco-list-row")
        .filter({
          hasText: "analysis.ipynb",
        })
        .first();

      await notebookItem.waitFor({
        state: "visible",
        timeout: 10_000,
      });

      await pointDemoCursorAt({
        page,
        locator: notebookItem,
      });

      await notebookItem.hover();

      await pause(4_000);

      await hideDemoCaption({
        page,
      });

      await removeDemoCursorOverlay({
        page,
      });
    },

    async verify({ page }) {
      await page
        .locator(".explorer-viewlet .monaco-list-row")
        .filter({
          hasText: "analysis.ipynb",
        })
        .first()
        .waitFor({
          state: "visible",
          timeout: 10_000,
        });
    },
  };
}
