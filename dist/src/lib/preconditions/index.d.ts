import { Branch } from '../../wrapper-classes/branch';
import { TContext } from '../context/context';
declare function currentBranchPrecondition(context: TContext): Branch;
declare function branchExistsPrecondition(branchName: string): void;
declare function uncommittedTrackedChangesPrecondition(): void;
declare function uncommittedChangesPrecondition(): void;
declare function ensureSomeStagedChangesPrecondition(context: TContext, addAllLogTipEnabled?: boolean): void;
declare function cliAuthPrecondition(context: TContext): string;
declare function currentGitRepoPrecondition(): string;
export { currentBranchPrecondition, branchExistsPrecondition, uncommittedTrackedChangesPrecondition, uncommittedChangesPrecondition, currentGitRepoPrecondition, ensureSomeStagedChangesPrecondition, cliAuthPrecondition, };
