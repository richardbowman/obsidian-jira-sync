import { App, Modal, Setting } from 'obsidian';
import JiraPlugin from '../main';
import { ProjectSyncConfig } from '../settings/default';

export class ProjectSyncEditModal extends Modal {
	private plugin: JiraPlugin;
	private config: ProjectSyncConfig;
	private onSave: () => Promise<void>;

	constructor(app: App, plugin: JiraPlugin, config: ProjectSyncConfig, onSave: () => Promise<void>) {
		super(app);
		this.plugin = plugin;
		this.config = config;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: this.config.name ? `Edit: ${this.config.name}` : 'New Project Sync' });

		new Setting(contentEl)
			.setName('Name')
			.setDesc('Display name for this sync configuration')
			.addText(text => text
				.setPlaceholder('e.g. ARC Project')
				.setValue(this.config.name)
				.onChange(v => { this.config.name = v; })
			);

		new Setting(contentEl)
			.setName('Connection')
			.setDesc('Which Jira connection to use')
			.addDropdown(drop => {
				this.plugin.settings.connections.forEach((conn, i) => {
					drop.addOption(String(i), conn.name || `Connection ${i + 1}`);
				});
				drop.setValue(String(this.config.connectionIndex));
				drop.onChange(v => { this.config.connectionIndex = parseInt(v); });
			});

		new Setting(contentEl)
			.setName('Project Key')
			.setDesc('Jira project key, e.g. ARC')
			.addText(text => text
				.setPlaceholder('ARC')
				.setValue(this.config.projectKey)
				.onChange(v => {
					this.config.projectKey = v.toUpperCase().trim();
					// Auto-set folder if empty
					if (!this.config.targetFolder || this.config.targetFolder === 'jira-issues') {
						this.config.targetFolder = `jira-issues/${this.config.projectKey}`;
					}
				})
			);

		new Setting(contentEl)
			.setName('Additional JQL')
			.setDesc('Optional extra filters appended to the base query (e.g. "AND sprint in openSprints()")')
			.addText(text => text
				.setPlaceholder('AND sprint in openSprints()')
				.setValue(this.config.additionalJql)
				.onChange(v => { this.config.additionalJql = v; })
			);

		new Setting(contentEl)
			.setName('Target Folder')
			.setDesc('Vault folder where synced notes will be saved')
			.addText(text => text
				.setPlaceholder('jira-issues/ARC')
				.setValue(this.config.targetFolder)
				.onChange(v => { this.config.targetFolder = v; })
			);

		new Setting(contentEl)
			.setName('Delta Sync')
			.setDesc('Only fetch issues updated since the last sync (faster, recommended)')
			.addToggle(t => t.setValue(this.config.deltaSync).onChange(v => { this.config.deltaSync = v; }));

		new Setting(contentEl)
			.setName('Sync on Startup')
			.setDesc('Automatically sync when Obsidian opens')
			.addToggle(t => t.setValue(this.config.syncOnStartup).onChange(v => { this.config.syncOnStartup = v; }));

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Save')
				.setCta()
				.onClick(async () => {
					if (!this.config.name || !this.config.projectKey) {
						// Basic validation
						return;
					}
					await this.onSave();
					this.close();
				})
			)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close())
			);
	}

	onClose() {
		this.contentEl.empty();
	}
}
