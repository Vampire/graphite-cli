import Branch from '../../wrapper-classes/branch';
import { TContext } from '../context/context';
declare function currentBranchPrecondition(context: TContext): Branch;
declare function branchExistsPrecondition(branchName: string): void;
declare function uncommittedTrackedChangesPrecondition(): void;
declare function uncommittedChangesPrecondition(): void;
declare function ensureSomeStagedChangesPrecondition(addAllLogTipEnabled?: boolean): void;
declare function cliAuthPrecondition(): string;
declare function currentGitRepoPrecondition(): string;
export { currentBranchPrecondition, branchExistsPrecondition, uncommittedTrackedChangesPrecondition, uncommittedChangesPrecondition, currentGitRepoPrecondition, ensureSomeStagedChangesPrecondition, cliAuthPrecondition, };
