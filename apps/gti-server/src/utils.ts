import type { BranchInfo } from "@withgraphite/gti-cli-shared-types";
import type { SmartlogCommits } from "@withgraphite/gti/src/types";
import type { ExecaChildProcess } from "execa";

import os from "os";

export function sleep(timeMs: number): Promise<void> {
  return new Promise((res) => setTimeout(res, timeMs));
}

export function firstOfIterable<T>(
  iterable: IterableIterator<T>
): T | undefined {
  return iterable.next().value;
}

/**
 * Limits async function execution parallelism to only one at a time.
 * Hence, if a call is already running, it will wait for it to finish,
 * then start the next async execution, but if called again while not finished,
 * it will return the scheduled execution promise.
 *
 * Sample Usage:
 * ```
 * let i = 1;
 * const oneExecAtATime = serializeAsyncCall(() => {
 *   return new Promise((resolve, reject) => {
 *     setTimeout(200, () => resolve(i++));
 *   });
 * });
 *
 * const result1Promise = oneExecAtATime(); // Start an async, and resolve to 1 in 200 ms.
 * const result2Promise = oneExecAtATime(); // Schedule the next async, and resolve to 2 in 400 ms.
 * const result3Promise = oneExecAtATime(); // Reuse scheduled promise and resolve to 2 in 400 ms.
 * ```
 */
export function serializeAsyncCall<T>(
  asyncFun: () => Promise<T>
): () => Promise<T> {
  let scheduledCall: Promise<T> | undefined = undefined;
  let pendingCall: Promise<undefined> | undefined = undefined;
  const startAsyncCall = () => {
    const resultPromise = asyncFun();
    pendingCall = resultPromise.then(
      () => (pendingCall = undefined),
      () => (pendingCall = undefined)
    );
    return resultPromise;
  };
  const callNext = () => {
    scheduledCall = undefined;
    return startAsyncCall();
  };
  const scheduleNextCall = () => {
    if (scheduledCall == null) {
      if (pendingCall == null) {
        throw new Error("pendingCall must not be null!");
      }
      scheduledCall = pendingCall.then(callNext, callNext);
    }
    return scheduledCall;
  };
  return () => {
    if (pendingCall == null) {
      return startAsyncCall();
    } else {
      return scheduleNextCall();
    }
  };
}

/**
 * Kill `child` on `AbortSignal`.
 *
 * This is slightly more robust than execa 6.0 and nodejs' `signal` support:
 * if a process was stopped (by `SIGTSTP` or `SIGSTOP`), it can still be killed.
 */
export function handleAbortSignalOnProcess(
  child: ExecaChildProcess,
  signal: AbortSignal
) {
  signal.addEventListener("abort", () => {
    if (os.platform() == "win32") {
      // Signals are ignored on Windows.
      // execa's default forceKillAfterTimeout behavior does not
      // make sense for Windows. Disable it explicitly.
      child.kill("SIGKILL", { forceKillAfterTimeout: false });
    } else {
      // If the process is stopped (ex. Ctrl+Z, kill -STOP), make it
      // continue first so it can respond to signals including SIGKILL.
      child.kill("SIGCONT");
      // A good citizen process should exit soon after recieving SIGTERM.
      // In case it doesn't, send SIGKILL after 5 seconds.
      child.kill("SIGTERM", { forceKillAfterTimeout: 5000 });
    }
  });
}

/**
 * Given a list of commits and a starting commit,
 * traverse up the chain of `parents` until we find a public commit
 */
export function findPublicAncestor(
  allCommits: SmartlogCommits | undefined,
  from: BranchInfo
): BranchInfo | undefined {
  let publicCommit: BranchInfo | undefined;
  if (allCommits != null) {
    const map = new Map(allCommits.map((commit) => [commit.branch, commit]));

    let current: BranchInfo | undefined = from;
    while (current != null) {
      if (current.partOfTrunk) {
        publicCommit = current;
        break;
      }
      if (current.parents[0] == null) {
        break;
      }
      current = map.get(current.parents[0]);
    }
  }

  return publicCommit;
}
