import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  // Your project ref, from the Trigger.dev dashboard's project settings.
  project: "proj_cutgepxxpdkyyuvdspoq",
  dirs: ["./src/trigger"],
  // Counts compute time only: while the agent waits for an approval, the clock is stopped.
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
});
