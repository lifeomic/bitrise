import { AxiosInstance } from 'axios';

export interface Client {
  readonly app: { slug: string };

  triggerBuild(buildParams?: BuildParameters): Promise<Build>;
}

export interface AbortOptions {
  readonly reason?: string;
  readonly withSuccess?: boolean;
  readonly skipNotifications?: boolean;
}

export interface FollowOptions {
  readonly heartbeat?: number;
  readonly interval?: number;
}

export interface AbortResponse {
  readonly status?: string;
  readonly message?: string;
}

export interface BuildDescription {
  readonly abort_reason: string;
  readonly branch: string;
  readonly build_number: integer;
  readonly commit_hash: string;
  readonly commit_message: string;
  readonly commit_view_url: string;
  readonly environment_prepare_finished_at: string;
  readonly finished_at: string;
  readonly is_on_hold: boolean;
  readonly original_build_params: string;
  readonly pull_request_id: integer;
  readonly pull_request_target_branch: string;
  readonly pull_request_view_url: string;
  readonly slug: string;
  readonly stack_config_type: string;
  readonly stack_identifier: string;
  readonly started_on_worker_at: string;
  readonly status: integer;
  readonly status_text: string;
  readonly tag: string;
  readonly triggered_at: string;
  readonly triggered_by: string;
  readonly triggered_workflow: string;
}

export interface Build {
  abort(
    options?: Pick<AbortOptions, Exclude<AbortOptions, 'reason'>>
  ): Promise<void>;
  abort(options?: AbortOptions): Promise<AbortResponse>;

  describe(): Promise<BuildDescription>;

  follow(options?: FollowOptions): Promise<void>;

  isFinished(): Promise<Boolean>;
}

export interface CommitPathsFilter {
  readonly added?: string[];
  readonly modified?: string[];
  readonly removed?: string[];
}

export interface BuildOptions {
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

export interface ClientConfiguration {
  readonly token: string;
}

export default (config: ClientConfiguration) => Client;
