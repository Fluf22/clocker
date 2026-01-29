import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

export function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  Bun.spawn([cmd, url]);
}

export async function promptForInput(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}
