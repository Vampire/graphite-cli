import { TContext } from '../lib/context';
export declare function persistContinuation(args: {
    branchesToRestack?: string[];
    branchesToSync?: string[];
    rebasedBranchBase: string;
}, context: TContext): void;
export declare function clearContinuation(context: TContext): void;
