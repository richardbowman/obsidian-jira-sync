export type SyncOutcome = 'new' | 'updated' | 'error';

export interface SyncItemResult {
	key: string;
	summary: string;
	outcome: SyncOutcome;
	filePath?: string;
	error?: string;
}

export interface SyncReport {
	projectName: string;
	jql: string;
	lastSyncedAt: string;
	results: SyncItemResult[];
	deltaSync: boolean;
}

export interface JiraProject {
	id: string;
	name: string;
}

export interface JiraIssueType {
	name: string;
}

export interface JiraTransitionType {
	id: string;
	action: string;
	status: string;
}

export interface JiraIssue {
	key: string;
	self: string;
	fields: {
		summary: string;
		description: string | null;
		priority: {
			name: string;
		};
		status: {
			name: string;
		};
		project: {
			key: string;
		};
		issuetype: {
			name: string;
		};
		assignee: {
			name: string;
		};
		reporter: {
			name: string;
		};
		[key: string]: any;
	};
	[key: string]: any;
}
