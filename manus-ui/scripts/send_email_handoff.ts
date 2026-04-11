import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveEmailHandoffPathFromSubmissionId, sendPreparedEmail } from "../server/emailSender";

type CliArgs = {
  submissionId?: string;
  handoffPath?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--submission-id" && next) {
      args.submissionId = next;
      i += 1;
      continue;
    }
    if (token === "--handoff" && next) {
      args.handoffPath = next;
      i += 1;
    }
  }
  return args;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..", "..");

  if (!args.submissionId && !args.handoffPath) {
    console.error("Use --submission-id <id> or --handoff <path>.");
    return 1;
  }

  const emailHandoffPath = args.handoffPath
    ? path.resolve(repoRoot, args.handoffPath)
    : resolveEmailHandoffPathFromSubmissionId(repoRoot, String(args.submissionId));

  const sent = await sendPreparedEmail({
    repoRoot,
    emailHandoffPath,
  });

  console.log(
    JSON.stringify(
      {
        submissionId: sent.result.submissionId,
        status: sent.result.status,
        to: sent.result.to,
        language: sent.result.language,
        tier: sent.result.tier,
        messageId: sent.result.messageId,
        error: sent.result.error,
        resultPath: path.relative(repoRoot, sent.resultPath),
      },
      null,
      2,
    ),
  );

  return sent.result.status === "sent" ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
