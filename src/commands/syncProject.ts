import JiraPlugin from '../main';
import { ProjectSyncConfig } from '../settings/default';
import { fetchIssuesByJQL, validateSettings } from '../api';
import { createOrUpdateIssueNote } from '../file_operations/getIssue';
import { Notice } from 'obsidian';
import { ProjectPickerModal } from '../modals/ProjectPickerModal';
import { SyncResultsModal } from '../modals/SyncResultsModal';
import { SyncItemResult, SyncReport } from '../interfaces';

export async function syncProject(plugin: JiraPlugin, config: ProjectSyncConfig): Promise<void> {
	// Build JQL
	const parts: string[] = [];
	if (config.projectKey) parts.push(`project = ${config.projectKey}`);
	if (config.additionalJql) parts.push(config.additionalJql);
	if (config.deltaSync && config.lastSyncedAt) {
		// Format: "YYYY-MM-DD HH:mm" for Jira
		const dt = new Date(config.lastSyncedAt);
		const formatted = dt.toISOString().replace('T', ' ').slice(0, 16);
		parts.push(`updated >= "${formatted}"`);
	}
	const jql = parts.join(' AND ');

	console.log(`[Jira Sync] Project: ${config.name} | JQL: ${jql} | lastSyncedAt: ${config.lastSyncedAt || 'none'}`);
	new Notice(`Syncing ${config.name}...`);

	const results: SyncItemResult[] = [];

	try {
		const issues = await fetchIssuesByJQL(plugin, jql);

		for (const issue of issues) {
			// Override the folder: temporarily swap global issuesFolder
			const originalFolder = plugin.settings.global.issuesFolder;
			plugin.settings.global.issuesFolder = config.targetFolder;
			const result = await createOrUpdateIssueNote(plugin, issue, undefined, true);
			plugin.settings.global.issuesFolder = originalFolder;
			results.push(result);
		}

		config.lastSyncedAt = new Date().toISOString();
		await plugin.saveSettings();

		const report: SyncReport = {
			projectName: config.name,
			jql,
			lastSyncedAt: config.lastSyncedAt,
			results,
			deltaSync: config.deltaSync,
		};

		new SyncResultsModal(plugin.app, report).open();
	} catch (e: unknown) {
		new Notice(`${config.name} sync failed: ${(e as Error).message}`);
		console.error(e);
	}
}

export async function syncAllProjects(plugin: JiraPlugin): Promise<void> {
	const configs = plugin.settings.projectSyncs.filter((c) => c.enabled);
	if (configs.length === 0) {
		new Notice('No project syncs configured');
		return;
	}
	for (const config of configs) {
		await syncProject(plugin, config);
	}
}

export function registerSyncProjectCommand(plugin: JiraPlugin): void {
	plugin.addCommand({
		id: 'sync-project-jira',
		name: 'Sync project...',
		checkCallback: (checking: boolean) => {
			if (!validateSettings(plugin)) return false;
			if (plugin.settings.projectSyncs.filter((c) => c.enabled).length === 0) return false;
			if (!checking) {
				const configs = plugin.settings.projectSyncs.filter((c) => c.enabled);
				if (configs.length === 1) {
					syncProject(plugin, configs[0]);
				} else {
					new ProjectPickerModal(plugin.app, configs, (config) => syncProject(plugin, config)).open();
				}
			}
			return true;
		},
	});
}

export function registerSyncAllProjectsCommand(plugin: JiraPlugin): void {
	plugin.addCommand({
		id: 'sync-all-projects-jira',
		name: 'Sync all projects',
		checkCallback: (checking: boolean) => {
			if (!validateSettings(plugin)) return false;
			if (!checking) syncAllProjects(plugin);
			return true;
		},
	});
}
