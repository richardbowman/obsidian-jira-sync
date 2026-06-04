import { App, Modal } from 'obsidian';
import { SyncReport, SyncItemResult } from '../interfaces';

export class SyncResultsModal extends Modal {
	private report: SyncReport;

	constructor(app: App, report: SyncReport) {
		super(app);
		this.report = report;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('jira-sync-results-modal');

		this.renderHeader(contentEl);
		this.renderSummaryBar(contentEl);
		this.renderResults(contentEl);
	}

	private renderHeader(container: HTMLElement) {
		const { projectName, jql, lastSyncedAt, deltaSync } = this.report;

		const header = container.createDiv({ cls: 'jira-sync-results-header' });
		header.createEl('h2', { text: `Sync Results: ${projectName}` });

		const meta = header.createDiv({ cls: 'jira-sync-results-meta' });

		if (deltaSync && lastSyncedAt) {
			const cutoff = new Date(lastSyncedAt);
			meta.createDiv({
				cls: 'jira-sync-meta-row',
				text: `Delta sync since: ${cutoff.toLocaleString()}`,
			});
		}

		const jqlRow = meta.createDiv({ cls: 'jira-sync-meta-row jira-sync-jql' });
		jqlRow.createSpan({ text: 'JQL: ', cls: 'jira-sync-meta-label' });
		jqlRow.createEl('code', { text: jql });
	}

	private renderSummaryBar(container: HTMLElement) {
		const { results, deltaSync } = this.report;

		const newCount = results.filter((r) => r.outcome === 'new').length;
		const updatedCount = results.filter((r) => r.outcome === 'updated').length;
		const errorCount = results.filter((r) => r.outcome === 'error').length;
		const totalFetched = results.length;

		const bar = container.createDiv({ cls: 'jira-sync-summary-bar' });

		if (totalFetched === 0) {
			bar.createDiv({
				cls: 'jira-sync-summary-chip jira-sync-chip-uptodate',
				text: deltaSync ? 'Up to date — no changes since last sync' : 'No issues found',
			});
			return;
		}

		if (newCount > 0) {
			bar.createDiv({
				cls: 'jira-sync-summary-chip jira-sync-chip-new',
				text: `${newCount} new`,
			});
		}
		if (updatedCount > 0) {
			bar.createDiv({
				cls: 'jira-sync-summary-chip jira-sync-chip-updated',
				text: `${updatedCount} updated`,
			});
		}
		if (errorCount > 0) {
			bar.createDiv({
				cls: 'jira-sync-summary-chip jira-sync-chip-error',
				text: `${errorCount} error${errorCount !== 1 ? 's' : ''}`,
			});
		}
	}

	private renderResults(container: HTMLElement) {
		const { results } = this.report;

		if (results.length === 0) return;

		const groups: { label: string; cls: string; items: SyncItemResult[] }[] = [
			{
				label: 'New',
				cls: 'jira-sync-group-new',
				items: results.filter((r) => r.outcome === 'new'),
			},
			{
				label: 'Updated',
				cls: 'jira-sync-group-updated',
				items: results.filter((r) => r.outcome === 'updated'),
			},
			{
				label: 'Errors',
				cls: 'jira-sync-group-error',
				items: results.filter((r) => r.outcome === 'error'),
			},
		];

		for (const group of groups) {
			if (group.items.length === 0) continue;

			const section = container.createDiv({ cls: `jira-sync-group ${group.cls}` });
			section.createEl('h3', {
				text: `${group.label} (${group.items.length})`,
				cls: 'jira-sync-group-heading',
			});

			const list = section.createEl('ul', { cls: 'jira-sync-issue-list' });

			for (const item of group.items) {
				const li = list.createEl('li', { cls: 'jira-sync-issue-row' });

				const keyEl = li.createEl('span', {
					text: item.key,
					cls: 'jira-sync-issue-key',
				});

				// Clicking the key opens the note if we have a file path
				if (item.filePath) {
					keyEl.addClass('jira-sync-issue-key-link');
					keyEl.addEventListener('click', () => {
						this.app.workspace.openLinkText(item.filePath!, '');
						this.close();
					});
				}

				li.createEl('span', {
					text: item.summary || '(no summary)',
					cls: 'jira-sync-issue-summary',
				});

				if (item.outcome === 'error' && item.error) {
					li.createEl('div', {
						text: item.error,
						cls: 'jira-sync-issue-error',
					});
				}
			}
		}
	}

	onClose() {
		this.contentEl.empty();
	}
}
