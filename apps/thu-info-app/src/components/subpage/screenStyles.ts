/**
 * Canonical sub-page row/card styles (`rounded`/`touchable`/`text`/`version`/
 * `separator`) plus the max content width used by the settings-style sectioned
 * pages.
 *
 * The definition currently lives in the settings root (`ui/settings/settings`).
 * That file is a frozen top-level page, so this module re-exports it rather than
 * moving it: sub-page components and screens import from here instead of
 * reaching into `ui/settings` directly, and relocating the definition later is a
 * one-file move. Single source of truth, so the 18 existing importers keep
 * working unchanged.
 */
export {styles} from "../../ui/settings/settings";
