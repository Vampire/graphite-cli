export declare const userConfigFactory: {
    load: (filePath?: string | undefined) => {
        readonly data: {
            authToken?: string | undefined;
            restackCommitterDateIsAuthorDate?: boolean | undefined;
            branchPrefix?: string | undefined;
            branchDate?: boolean | undefined;
            branchReplacement?: "" | "_" | "-" | undefined;
            tips?: boolean | undefined;
            editor?: string | undefined;
            pager?: string | undefined;
            submitIncludeCommitMessages?: boolean | undefined;
        } & {};
        readonly update: (mutator: (data: {
            authToken?: string | undefined;
            restackCommitterDateIsAuthorDate?: boolean | undefined;
            branchPrefix?: string | undefined;
            branchDate?: boolean | undefined;
            branchReplacement?: "" | "_" | "-" | undefined;
            tips?: boolean | undefined;
            editor?: string | undefined;
            pager?: string | undefined;
            submitIncludeCommitMessages?: boolean | undefined;
        } & {}) => void) => void;
        readonly path: string;
        delete: () => void;
    } & {
        getEditor: () => string;
        getPager: () => string | undefined;
        execEditor: (editFilePath: string) => void;
    };
    loadIfExists: (filePath?: string | undefined) => ({
        readonly data: {
            authToken?: string | undefined;
            restackCommitterDateIsAuthorDate?: boolean | undefined;
            branchPrefix?: string | undefined;
            branchDate?: boolean | undefined;
            branchReplacement?: "" | "_" | "-" | undefined;
            tips?: boolean | undefined;
            editor?: string | undefined;
            pager?: string | undefined;
            submitIncludeCommitMessages?: boolean | undefined;
        } & {};
        readonly update: (mutator: (data: {
            authToken?: string | undefined;
            restackCommitterDateIsAuthorDate?: boolean | undefined;
            branchPrefix?: string | undefined;
            branchDate?: boolean | undefined;
            branchReplacement?: "" | "_" | "-" | undefined;
            tips?: boolean | undefined;
            editor?: string | undefined;
            pager?: string | undefined;
            submitIncludeCommitMessages?: boolean | undefined;
        } & {}) => void) => void;
        readonly path: string;
        delete: () => void;
    } & {
        getEditor: () => string;
        getPager: () => string | undefined;
        execEditor: (editFilePath: string) => void;
    }) | undefined;
};
export declare type TUserConfig = ReturnType<typeof userConfigFactory.load>;
