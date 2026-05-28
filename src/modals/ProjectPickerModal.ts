import { App, SuggestModal } from 'obsidian';
import { ProjectSyncConfig } from '../settings/default';

export class ProjectPickerModal extends SuggestModal<ProjectSyncConfig> {
	private configs: ProjectSyncConfig[];
	private onSubmit: (config: ProjectSyncConfig) => void;

	constructor(app: App, configs: ProjectSyncConfig[], onSubmit: (config: ProjectSyncConfig) => void) {
		super(app);
		this.configs = configs;
		this.onSubmit = onSubmit;
		this.setPlaceholder('Choose a project to sync...');
	}

	getSuggestions(query: string): ProjectSyncConfig[] {
		return this.configs.filter(c =>
			c.name.toLowerCase().includes(query.toLowerCase()) ||
			c.projectKey.toLowerCase().includes(query.toLowerCase())
		);
	}

	renderSuggestion(config: ProjectSyncConfig, el: HTMLElement) {
		el.createEl('div', { text: config.name });
		el.createEl('small', { text: `${config.projectKey} → ${config.targetFolder}${config.lastSyncedAt ? ' · Last synced: ' + new Date(config.lastSyncedAt).toLocaleString() : ''}` });
	}

	onChooseSuggestion(config: ProjectSyncConfig) {
		this.onSubmit(config);
	}
}
