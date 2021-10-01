import { Branch } from "../wrapper-classes";
export declare function fixAction(opts: {
    action: "regen" | "rebase" | undefined;
}): Promise<void>;
export declare function restackBranch(branch: Branch): Promise<void>;
