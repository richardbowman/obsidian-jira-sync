import { Setting } from 'obsidian';
import { SettingsComponent, SettingsComponentProps } from '../../interfaces/settingsTypes';
import { ProjectSyncConfig } from '../default';
import { syncProject } from '../../commands/syncProject';
import { ProjectSyncEditModal } from '../../modals/ProjectSyncEditModal';

export class ProjectSyncsSettings implements SettingsComponent {
	private props: SettingsComponentProps;

	constructor(props: SettingsComponentProps) {
		this.props = props;
	}

	render(containerEl: HTMLElement): void {
		const { plugin } = this.props;

		containerEl.empty();
		containerEl.createEl('h3', { text: 'Project Syncs' });

		const syncs = plugin.settings.projectSyncs;

		if (syncs.length === 0) {
			containerEl.createEl('p', { text: 'No project syncs configured yet.', cls: 'setting-item-description' });
		} else {
			for (const config of syncs) {
				new Setting(containerEl)
					.setName(config.name)
					.setDesc(`${config.projectKey} → ${config.targetFolder}${config.lastSyncedAt ? ' · Synced: ' + new Date(config.lastSyncedAt).toLocaleString() : ' · Never synced'}`)
					.addToggle(toggle => toggle
						.setValue(config.enabled)
						.onChange(async (value) => {
							config.enabled = value;
							await plugin.saveSettings();
						})
					)
					.addButton(btn => btn
						.setButtonText('Sync now')
						.setTooltip('Run sync for this project')
						.onClick(async () => { await syncProject(plugin, config); this.render(containerEl); })
					)
					.addButton(btn => btn
						.setButtonText('Edit')
						.onClick(() => {
							new ProjectSyncEditModal(plugin.app, plugin, config, async () => {
								await plugin.saveSettings();
								this.render(containerEl);
							}).open();
						})
					)
					.addButton(btn => btn
						.setButtonText('Delete')
						.setWarning()
						.onClick(async () => {
							plugin.settings.projectSyncs = plugin.settings.projectSyncs.filter(s => s.id !== config.id);
							await plugin.saveSettings();
							this.render(containerEl);
						})
					);
			}
		}

		new Setting(containerEl)
			.addButton(btn => btn
				.setButtonText('+ Add project sync')
				.setCta()
				.onClick(() => {
					const newConfig: ProjectSyncConfig = {
						id: crypto.randomUUID(),
						name: '',
						connectionIndex: plugin.settings.currentConnectionIndex,
						projectKey: '',
						additionalJql: '',
						targetFolder: 'jira-issues',
						lastSyncedAt: '',
						deltaSync: true,
						syncOnStartup: false,
						enabled: true,
					};
					new ProjectSyncEditModal(plugin.app, plugin, newConfig, async () => {
						plugin.settings.projectSyncs.push(newConfig);
						await plugin.saveSettings();
						this.render(containerEl);
					}).open();
				})
			);
	}
}
