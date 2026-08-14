export function ensureNotDemoMutation() {
  if (process.env.DEMO_MODE === "true") {
    throw new Error("Read-only demo");
  }
}
