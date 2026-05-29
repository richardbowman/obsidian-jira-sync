import JiraPlugin from '../main';
import { Notice, TFile } from 'obsidian';
import { createJiraIssue, fetchIssue, fetchIssueTransitions, updateJiraIssue, updateJiraStatus } from '../api';
import { prepareJiraFieldsFromFile } from './commonPrepareData';
import { localToJiraFields, updateJiraToLocal } from '../tools/mapObsidianJiraFields';
import { obsidianJiraFieldMappings } from '../default/obsidianJiraFieldsMapping';

export async function updateIssueFromFile(plugin: JiraPlugin, file: TFile): Promise<string> {
	let fields = await prepareJiraFieldsFromFile(plugin, file);
	const issueKey = fields.key;
	const apiVersion = plugin.getCurrentConnection()?.apiVersion;

	if (!issueKey) {
		throw new Error('No issue key found in frontmatter');
	}

	// Capture desired status before field mapping strips it out (status.toJira returns null)
	const desiredStatus: string | undefined = fields.status
		? String(fields.status).trim()
		: undefined;

	fields = localToJiraFields(
		fields,
		{
			...obsidianJiraFieldMappings,
			...plugin.settings.fieldMapping.fieldMappings,
		},
		apiVersion,
	);
	await updateJiraIssue(plugin, issueKey, fields);

	// Auto-transition status if the frontmatter status field is set
	if (desiredStatus) {
		const transitions = await fetchIssueTransitions(plugin, issueKey);
		const match = transitions.find(
			(t) => t.status.toLowerCase() === desiredStatus.toLowerCase(),
		);
		if (match) {
			await updateJiraStatus(plugin, issueKey, match.id);
		} else {
			new Notice(
				`No Jira transition found for status "${desiredStatus}" on ${issueKey}. ` +
				`Available: ${transitions.map((t) => t.status).join(', ')}`,
				5000,
			);
		}
	}

	return issueKey;
}

export async function createIssueFromFile(
	plugin: JiraPlugin,
	file: TFile,
	fields?: Record<string, any>,
): Promise<string> {
	const apiVersion = plugin.getCurrentConnection()?.apiVersion;
	if (!fields) {
		fields = await prepareJiraFieldsFromFile(plugin, file);
	}
	fields = localToJiraFields(
		fields,
		{
			...obsidianJiraFieldMappings,
			...plugin.settings.fieldMapping.fieldMappings,
		},
		apiVersion,
	);
	// Create the issue
	const issueData = await createJiraIssue(plugin, fields);
	const issueKey = issueData.key;

	// Update frontmatter with the new issue key
	await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
		frontmatter['key'] = issueKey;
	});

	// Pull the created issue back from Jira to populate all remaining synced fields
	const createdIssue = await fetchIssue(plugin, issueKey);
	await updateJiraToLocal(plugin, file, createdIssue);

	return issueKey;
}
