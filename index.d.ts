import { AxiosInstance } from 'axios';

declare interface AppOptions {
  readonly slug: string;
}

declare interface Client {
  app(options: AppOptions): App;
}

declare interface App {
  readonly app: { slug: string };

  /**
   * @see https://api-docs.bitrise.io/#/builds/build-trigger
   *
   * @param buildParams Parameters for the build to trigger. Must
   * include a git tag or a commit hash, a branch or a workfow ID.
   */
  triggerBuild(buildParams?: BuildOptions): Promise<Build>;

  /**
   * @see https://api-docs.bitrise.io/#/builds/build-list
   *
   * @param listParams Parameters for the builds to list.
   */
  listBuilds(listParams?: ListBuildOptions): Promise<BuildList>;
}

declare interface ListBuildOptions {
  readonly sort_by?: string;
  readonly branch?: string;
  readonly workflow?: string;
  readonly commit_message?: string;
  readonly trigger_event_type?: string;
  readonly pull_request_id?: number;
  readonly build_number?: number;
  readonly after?: number;
  readonly before?: number;
  readonly status?: number;
  readonly next?: string;
  readonly limit?: number;
}

declare interface BuildList {
  readonly builds: Build[];
  readonly paging: PageInfo;
}

declare interface PageInfo {
  readonly next?: string;
  readonly total_item_count: number;
}

declare interface AbortOptions {
  readonly reason?: string;
  readonly withSuccess?: boolean;
  readonly skipNotifications?: boolean;
}

declare interface FollowOptions {
  readonly heartbeat?: number;
  readonly interval?: number;
}

declare interface AbortResponse {
  readonly status?: string;
  readonly message?: string;
}

declare interface BuildDescription {
  readonly abort_reason: string;
  readonly branch: string;
  readonly build_number: number;
  readonly commit_hash: string;
  readonly commit_message: string;
  readonly commit_view_url: string;
  readonly environment_prepare_finished_at: string;
  readonly finished_at: string;
  readonly is_on_hold: boolean;
  readonly original_build_params: string;
  readonly pull_request_id: number;
  readonly pull_request_target_branch: string;
  readonly pull_request_view_url: string;
  readonly slug: string;
  readonly stack_config_type: string;
  readonly stack_identifier: string;
  readonly started_on_worker_at: string;
  readonly status: number;
  readonly status_text: string;
  readonly tag: string;
  readonly triggered_at: string;
  readonly triggered_by: string;
  readonly triggered_workflow: string;
}

declare interface Build {
  abort(options?: Omit<AbortOptions, 'reason'>): Promise<void>;
  abort(options?: AbortOptions): Promise<AbortResponse>;

  describe(): Promise<BuildDescription>;

  follow(options?: FollowOptions): Promise<void>;

  isFinished(): Promise<Boolean>;
}

declare interface CommitPathsFilter {
  readonly added?: string[];
  readonly modified?: string[];
  readonly removed?: string[];
}

declare type BuildTargetStrategy =
  | { branch: string }
  | { commitHash: string }
  | { workflow: string }
  | { tag: string };

declare interface BaseBuildOptions {
  readonly branch?: string;
  readonly commitHash?: string;
  readonly commitMessage?: string;
  readonly environment?: Record<string, string>;
  readonly commitPaths?: CommitPathsFilter[];
  readonly diffUrl?: string;
  readonly pullRequestAuthor?: string;
  readonly pullRequestHeadBranch?: string;
  readonly pullRequest: string;
  readonly pullRequestMergeBranch?: string;
  readonly pullRequestRepositoryUrl?: string;
  readonly disableStatusReporting?: boolean;
  readonly tag?: string;
  readonly workflow?: string;
  /** target branch */
  readonly target?: string;
}

declare type BuildOptions = BaseBuildOptions & BuildTargetStrategy;

declare interface ClientConfiguration {
  readonly token: string;
}

declare function createClient(config: ClientConfiguration): Client;

export = createClient;
