/** Runs a task again after a short wait if it fails, up to `attempts` times in all. */
export async function retry<T>(task: () => Promise<T>, attempts = 3, delayMs = 300): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
