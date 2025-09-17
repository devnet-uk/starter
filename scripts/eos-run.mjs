#!/usr/bin/env node
import process from "node:process";
import fs from "node:fs";
import { query } from "@anthropic-ai/claude-code";

const COMMANDS = [
  {
    label: "create-spec",
    buildPrompt: (spec) => {
      if (!spec || !spec.trim()) {
        throw new Error("Spec text is required for /create-spec.");
      }
      const escaped = spec.replace(/"/g, '\\"');
      return `/create-spec "${escaped}"`;
    },
  },
  {
    label: "create-tasks",
    buildPrompt: () => "/create-tasks",
  },
  {
    label: "execute-tasks",
    buildPrompt: () => "/execute-tasks",
  },
];

function parseArgs(argv) {
  const args = {
    spec: undefined,
    session: undefined,
    dryRun: false,
    pauseAfterSpec: false,
    outputPath: undefined,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--spec" && i + 1 < argv.length) {
      args.spec = argv[i + 1];
      i += 1;
      continue;
    }
    if (current.startsWith("--spec=")) {
      args.spec = current.slice("--spec=".length);
      continue;
    }
    if (current === "--session" && i + 1 < argv.length) {
      args.session = argv[i + 1];
      i += 1;
      continue;
    }
    if (current.startsWith("--session=")) {
      args.session = current.slice("--session=".length);
      continue;
    }
    if (current === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (current === "--pause-after-spec") {
      args.pauseAfterSpec = true;
      continue;
    }
    if (current === "--output" && i + 1 < argv.length) {
      args.outputPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (current.startsWith("--output=")) {
      args.outputPath = current.slice("--output=".length);
      continue;
    }
    if (current === "--help" || current === "-h") {
      args.help = true;
      continue;
    }
    console.error(`Unknown argument: ${current}`);
    args.error = true;
  }

  return args;
}

function showHelp() {
  const lines = [
    "Usage: pnpm eos:run --spec \"<description>\" [options]",
    "",
    "Options:",
    "  --spec <text>            Specification text used with /create-spec (required)",
    "  --session <id>           Resume an existing Claude Code session",
    "  --pause-after-spec       Wait for Enter before sending /create-tasks",
    "  --dry-run                Print the slash commands without sending them",
    "  --output <file>          Write a JSONL log of the conversation steps",
    "  -h, --help               Show this help message",
    "",
    "Environment:",
    "  Requires Claude Code CLI access (e.g. signed in with a Claude subscription via 'claude login').",
  ];
  console.log(lines.join("\n"));
}

function sanitizeMessage(message) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const base = {
    type: message.type,
    subtype: message.subtype,
    sessionId: message.session_id,
    uuid: message.uuid,
  };

  if (message.type === "assistant" || message.type === "user") {
    const blocks = message.message?.content;
    if (Array.isArray(blocks)) {
      base.content = blocks.map((block) => {
        if (block?.type === "text") {
          return { type: "text", text: block.text };
        }
        if (block?.type === "tool_use") {
          return { type: "tool_use", name: block.name, input: block.input };
        }
        if (block?.type === "tool_result") {
          return {
            type: "tool_result",
            name: block.name,
            output: block.outputs ?? block.output ?? block.text ?? null,
          };
        }
        return { type: block?.type ?? "unknown" };
      });
    }
  }

  if (message.type === "result") {
    base.result = message.result;
    base.totalCostUsd = message.total_cost_usd;
    base.durationMs = message.duration_ms;
    base.numTurns = message.num_turns;
    base.isError = Boolean(message.is_error);
    base.permissionDenials = message.permission_denials;
  }

  return base;
}

function extractText(message) {
  if (!message?.message?.content) {
    return "";
  }
  const blocks = message.message.content;
  if (!Array.isArray(blocks)) {
    return "";
  }

  return blocks
    .map((block) => {
      if (block?.type === "text" && typeof block.text === "string") {
        return block.text;
      }
      if (block?.type === "tool_use") {
        return `\n[tool:${block.name}]`;
      }
      if (block?.type === "tool_result") {
        return `\n[tool-result:${block.name}]`;
      }
      return "";
    })
    .join("");
}

async function sendSlashCommand({ prompt, sessionId, label }) {
  const transcript = [];
  let currentSession = sessionId;
  let resultMessage;

  const queryOptions = currentSession ? { resume: currentSession } : {};

  try {
    for await (const message of query({ prompt, options: queryOptions })) {
      const sanitized = sanitizeMessage(message);
      if (sanitized) {
        transcript.push(sanitized);
      }

      if (message.type === "system" && message.subtype === "init") {
        currentSession = message.session_id;
        console.log(`\n[claude] session ${currentSession}`);
      }

      if (message.type === "assistant") {
        const text = extractText(message);
        if (text) {
          process.stdout.write(text);
        }
      }

      if (message.type === "result") {
        resultMessage = message;
        break;
      }
    }
  } catch (error) {
    throw new Error(`/${label} failed: ${error.message ?? String(error)}`);
  }

  if (!resultMessage) {
    throw new Error(`/${label} did not return a result message.`);
  }

  if (resultMessage.is_error || resultMessage.subtype?.startsWith("error")) {
    const summary = resultMessage.result ?? resultMessage.subtype ?? "unknown error";
    throw new Error(`/${label} reported an error: ${summary}`);
  }

  return {
    sessionId: currentSession,
    transcript,
    result: sanitizeMessage(resultMessage),
  };
}

async function waitForEnter(message) {
  return new Promise((resolve) => {
    process.stdout.write(`\n${message}`);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", () => {
      process.stdin.pause();
      resolve();
    });
  });
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    return;
  }

  if (args.error) {
    process.exitCode = 1;
    return;
  }

  if (!args.spec && !args.dryRun) {
    console.error("Error: --spec is required.");
    showHelp();
    process.exitCode = 1;
    return;
  }

  const log = {
    startedAt: new Date().toISOString(),
    commands: [],
  };

  if (args.dryRun) {
    const specPrompt = COMMANDS[0].buildPrompt(args.spec ?? "<spec>");
    console.log("Dry run – planned commands:\n");
    console.log(specPrompt);
    console.log(COMMANDS[1].buildPrompt());
    console.log(COMMANDS[2].buildPrompt());
    return;
  }

  let sessionId = args.session;

  for (let i = 0; i < COMMANDS.length; i += 1) {
    const command = COMMANDS[i];
    const prompt = command.buildPrompt(args.spec);
    console.log(`\n--- Running ${prompt} ---\n`);

    const { sessionId: newSessionId, transcript, result } = await sendSlashCommand({
      prompt,
      sessionId,
      label: command.label,
    });

    sessionId = newSessionId;
    log.commands.push({
      command: command.label,
      prompt,
      transcript,
      result,
    });

    if (command.label === "create-spec" && args.pauseAfterSpec) {
      await waitForEnter("\nPress Enter to continue with /create-tasks... ");
    }
  }

  log.sessionId = sessionId;
  log.completedAt = new Date().toISOString();

  console.log(`\nEOS run complete. Session ID: ${sessionId}`);

  const finalResult = log.commands[log.commands.length - 1]?.result;
  if (finalResult?.totalCostUsd !== undefined) {
    console.log(`Total cost (USD): ${finalResult.totalCostUsd}`);
  }
  if (finalResult?.durationMs !== undefined) {
    console.log(`Duration (ms): ${finalResult.durationMs}`);
  }

  if (args.outputPath) {
    try {
      const jsonl = log.commands
        .map((entry) => JSON.stringify({
          sessionId: log.sessionId,
          command: entry.command,
          prompt: entry.prompt,
          result: entry.result,
          transcript: entry.transcript,
          timestamp: log.completedAt,
        }))
        .join("\n");
      fs.writeFileSync(args.outputPath, `${jsonl}\n`, "utf8");
      console.log(`Saved log to ${args.outputPath}`);
    } catch (error) {
      console.error(`Failed to write log file: ${error.message ?? String(error)}`);
    }
  }
}

main().catch((error) => {
  console.error(`\nEOS run failed: ${error.message ?? String(error)}`);
  process.exitCode = 1;
});
