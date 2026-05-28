import { FieldMapping } from '../default/obsidianJiraFieldsMapping';

export interface ConnectionSettingsInterface {
	name: string;
	jiraUrl: string;
	apiVersion: '2' | '3';
	authMethod: 'bearer' | 'basic' | 'session';
	apiToken: string;
	username: string;
	email: string;
	password: string;
}

export interface GlobalSettingsInterface {
	issuesFolder: string;
	templatePath: string;
}

export interface FieldMappingSettingsInterface {
	fieldMappings: Record<string, FieldMapping>;
	fieldMappingsStrings: Record<string, { toJira: string; fromJira: string }>;
	enableFieldValidation: boolean;
}

export interface FetchIssueInterface {
	filenameTemplate: string;
	fields: string[];
	expand: string[];
}

export interface TimekeepSettingsInterface {
	sendComments: 'no' | 'last_block' | 'block_path';
	statisticsTimeType: string;
	maxItemsToShow: number;
	customDateRange: { start: string; end: string };
}

export interface ProjectSyncConfig {
	id: string;               // crypto.randomUUID()
	name: string;             // Display name e.g. "ARC Project"
	connectionIndex: number;  // Which connection to use
	projectKey: string;       // e.g. "ARC"
	additionalJql: string;    // Optional extra JQL appended after base
	targetFolder: string;     // e.g. "jira-issues/ARC"
	lastSyncedAt: string;     // ISO timestamp or ""
	deltaSync: boolean;       // Append AND updated >= lastSyncedAt
	syncOnStartup: boolean;
	enabled: boolean;
}

export interface CollapsedSections {
	connection: boolean;
	general: boolean;
	fieldMappings: boolean;
	fetchIssue: boolean;
	testFieldMappings: boolean;
	statistics: boolean;
	projectSyncs: boolean;
}

export interface JiraSettingsInterface {
	collapsedSections: CollapsedSections;

	connections: ConnectionSettingsInterface[];
	currentConnectionIndex: number;
	global: GlobalSettingsInterface;
	fieldMapping: FieldMappingSettingsInterface;
	fetchIssue: FetchIssueInterface;
	timekeep: TimekeepSettingsInterface;
	projectSyncs: ProjectSyncConfig[];

	sessionCookieName: string;
	issueKeyToFilePathCache: Record<string, string>;
}

export const DEFAULT_SETTINGS: JiraSettingsInterface = {
	collapsedSections: {
		connection: true,
		general: true,
		fieldMappings: false,
		fetchIssue: false,
		testFieldMappings: false,
		statistics: false,
		projectSyncs: false,
	},

	connections: [
		{
			name: 'Connection 1',
			authMethod: 'bearer',
			apiToken: '',
			username: '',
			email: '',
			password: '',
			jiraUrl: '',
			apiVersion: '2',
		},
	],
	currentConnectionIndex: 0,

	global: {
		issuesFolder: 'jira-issues',
		templatePath: '',
	},

	fieldMapping: {
		fieldMappings: {},
		fieldMappingsStrings: {},
		enableFieldValidation: true,
	},

	fetchIssue: {
		filenameTemplate: '{summary} ({key})',
		fields: ['*all'],
		expand: [],
	},

	timekeep: {
		sendComments: 'no',
		statisticsTimeType: 'weeks',
		maxItemsToShow: 10,
		customDateRange: { start: '', end: '' },
	},

	projectSyncs: [],

	sessionCookieName: 'JSESSIONID',
	issueKeyToFilePathCache: {},
};
