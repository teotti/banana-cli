export type ManualCheck = {
  id: string;
  title: string;
  steps: string;
};

/** These need a person. The suite reports them and never marks them passed. */
export const MANUAL_CHECKS: ManualCheck[] = [
  {
    id: "manual:browser-login",
    title: "Browser login",
    steps:
      "Run bun run e2e login, approve the device code in the browser, and confirm the next command's banana me --json is the staging test account.",
  },
  {
    id: "manual:login-cancel",
    title: "Login cancellation",
    steps:
      "Start bun run e2e login and press Ctrl-C before approving. The command exits 130 and a later bun run e2e run still asks you to log in.",
  },
  {
    id: "manual:refresh",
    title: "Refresh after expiry",
    steps:
      "After an access token expires, run banana me --json with the staging env. It refreshes and prints the account. A revoked refresh token asks for banana login instead of looping.",
  },
  {
    id: "manual:keychain",
    title: "Keychain across binary replacement",
    steps:
      "On a disposable macOS account, log in without BANANASPLIT_NO_KEYCHAIN, replace the binary with another ad-hoc build, and run banana me. It must not block on a keychain prompt.",
  },
  {
    id: "manual:terminal",
    title: "Terminal navigation, search and pagination",
    steps:
      "In a terminal, open banana groups, banana friends and banana expenses list. Type to search, move through a page, and confirm the next page loads at the end of the list.",
  },
  {
    id: "manual:notification",
    title: "Notification delivery",
    steps:
      "The suite sends one expense with --notify-me. Confirm the staging account receives BananaSplit's expense-created push.",
  },
  {
    id: "manual:upgrade",
    title: "Upgrade and update",
    steps:
      "Install the CLI into a disposable directory with its own credentials. Run banana upgrade and banana update there. Do not point them at a real install.",
  },
  {
    id: "manual:uninstall",
    title: "Uninstall",
    steps:
      "In that same disposable install, run banana uninstall --yes. Confirm the binary is gone and the disposable login was revoked. Leave the real install alone.",
  },
  {
    id: "manual:logout",
    title: "Logout",
    steps:
      "Log in as a disposable user and run banana logout. Confirm banana me then asks for login. Do not log out the staging suite account.",
  },
];
