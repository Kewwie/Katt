import { KiwiClient } from '@/client';
import {
	AnyComponentBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	Guild,
	RoleSelectMenuBuilder,
	StringSelectMenuBuilder,
	User,
	UserSelectMenuBuilder,
} from 'discord.js';

export interface Config {
	guildId: string;
	moduleId: string;
	optionId?: string;
	pageOwner?: User;
	guild?: Guild;
	guildOwner?: User;
	isEnabled?: boolean;
}

interface ConfigOptions {
	setupConfig?: (client: KiwiClient, options: Config) => Promise<Config>;
	pages: Array<Page>;
}

interface Page {
	moduleId: string;
	optionId?: string;
	getPageData: (client: KiwiClient, config: Config) => Promise<PageData>;
	updateOption?: (
		client: KiwiClient,
		guildId: string,
		values: string[]
	) => Promise<void>;
}

interface PageData {
	description?: string[] | string;
	componenets?: AnyComponentBuilder;
	rows?: Array<
		| RoleSelectMenuBuilder[]
		| UserSelectMenuBuilder[]
		| StringSelectMenuBuilder[]
		| ChannelSelectMenuBuilder[]
		| ButtonBuilder[]
	>;
}

import { toggleModule } from './toggleModule';

import { buildChannelSelectMenu } from './buildChannelSelectMenu';
import { buildRoleSelectMenu } from './buildRoleSelectMenu';
import { buildButton } from './buildButton';

import { ModerationConfigRoleEntity } from '@/entities/ModerationConfigRole';
import { PersistConfigRoleEntity } from '@/entities/PersistConfigRole';
import { PersistConfigRequiredRoleEntity } from '@/entities/PersistConfigRequiredRole';

export const configOptions: ConfigOptions = {
	setupConfig: async (client, config) => {
		config.guild = await client.guilds.fetch(config.guildId);
		config.guildOwner = await client.users.fetch(config.guild.ownerId);
		if (config.moduleId)
			config.isEnabled = await client.db.isModuleEnabled(
				config.guildId,
				config.moduleId
			);

		if (!config.optionId) config.optionId = 'overview';

		return config;
	},
	pages: [
		{
			moduleId: 'activity',
			optionId: 'overview',
			getPageData: async (client, config) => {
				const { isEnabled } = config;

				var description = [
					`### Activity Module`,
					`**Enabled:** ${isEnabled ? 'True' : 'False'}`,
				];

				var toggleModuleButton = buildButton(client, {
					moduleId: config.moduleId,
					optionId: config.optionId,
					value: isEnabled ? 'false' : 'true',
					label: `${isEnabled ? 'Disable' : 'Enable'} Module`,
					style: isEnabled ? ButtonStyle.Danger : ButtonStyle.Success,
				});

				return { description, rows: [[toggleModuleButton]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];
				await toggleModule(
					client,
					guildId,
					'activity',
					client.getBoolean(value)
				);
			},
		},
		{
			moduleId: 'activity',
			optionId: 'logChannel',
			getPageData: async (client, config) => {
				const { guildId } = config;

				var actConf = await client.db.repos.activityConfig.findOneBy({
					guildId: guildId,
				});

				var description = [
					`### Activity Module`,
					`**Log Channel:** ${
						actConf?.logChannel
							? `<#${actConf.logChannel}>`
							: 'None'
					}`,
				];

				var channelSelectMenu = buildChannelSelectMenu(client, {
					moduleId: 'activity',
					optionId: 'logChannel',
					defaultChannels: [actConf?.logChannel],
				});

				return { description, rows: [[channelSelectMenu]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];

				var actConf = await client.db.repos.activityConfig.findOneBy({
					guildId: guildId,
				});

				if (actConf) {
					actConf.logChannel = value;
					await client.db.repos.activityConfig.save(actConf);
				}
			},
		},
		{
			moduleId: 'activity',
			optionId: 'dailyActiveRole',
			getPageData: async (client, config) => {
				const { guildId } = config;

				var actConf = await client.db.repos.activityConfig.findOneBy({
					guildId: guildId,
				});

				var description = [
					`### Activity Module`,
					`**Daily Active Role:** ${
						actConf?.dailyActiveRole
							? `<@&${actConf.dailyActiveRole}>`
							: 'None'
					}`,
				];

				var dailyActiveRoleSM = buildRoleSelectMenu(client, {
					moduleId: 'activity',
					optionId: 'dailyActiveRole',
					defaultRoles: [actConf?.dailyActiveRole],
				});

				return { description, rows: [[dailyActiveRoleSM]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];

				var actConf = await client.db.repos.activityConfig.findOneBy({
					guildId: guildId,
				});

				if (actConf) {
					actConf.dailyActiveRole = value;
					await client.db.repos.activityConfig.save(actConf);
				}
			},
		},
		{
			moduleId: 'activity',
			optionId: 'weeklyActiveRole',
			getPageData: async (client, config) => {
				const { guildId } = config;

				var actConf = await client.db.repos.activityConfig.findOneBy({
					guildId: guildId,
				});

				var description = [
					`### Activity Module`,
					`**Weekly Active Role:** ${
						actConf?.weeklyActiveRole
							? `<@&${actConf.weeklyActiveRole}>`
							: 'None'
					}`,
				];

				var weeklyActiveRoleSM = buildRoleSelectMenu(client, {
					moduleId: 'activity',
					optionId: 'dailyActiveRole',
					defaultRoles: [actConf?.weeklyActiveRole],
				});

				return { description, rows: [[weeklyActiveRoleSM]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];

				var actConf = await client.db.repos.activityConfig.findOneBy({
					guildId: guildId,
				});

				if (actConf) {
					actConf.dailyActiveRole = value;
					await client.db.repos.activityConfig.save(actConf);
				}
			},
		},
		{
			moduleId: 'list',
			optionId: 'overview',
			async getPageData(client, config) {
				const { isEnabled } = config;

				var description = [
					`### List Module`,
					`**Enabled:** ${isEnabled ? 'True' : 'False'}`,
				];

				var toggleModuleButton = buildButton(client, {
					moduleId: config.moduleId,
					optionId: config.optionId,
					value: isEnabled ? 'false' : 'true',
					label: `${isEnabled ? 'Disable' : 'Enable'} Module`,
					style: isEnabled ? ButtonStyle.Danger : ButtonStyle.Success,
				});

				return { description, rows: [[toggleModuleButton]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];
				await toggleModule(
					client,
					guildId,
					'list',
					client.getBoolean(value)
				);
			},
		},
		{
			moduleId: 'list',
			optionId: 'logChannel',
			async getPageData(client, config) {
				const { guildId } = config;

				var listConf = await client.db.repos.listConfig.findOneBy({
					guildId: guildId,
				});

				var description = [
					`### List Module`,
					`**Log Channel:** ${
						listConf?.logChannel
							? `<#${listConf.logChannel}>`
							: 'None'
					}`,
				];

				var channelSelectMenu = buildChannelSelectMenu(client, {
					moduleId: 'list',
					optionId: 'logChannel',
					defaultChannels: [listConf?.logChannel],
				});

				return { description, rows: [[channelSelectMenu]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];

				var listConf = await client.db.repos.listConfig.findOneBy({
					guildId: guildId,
				});

				if (listConf) {
					listConf.logChannel = value;
					await client.db.repos.activityConfig.save(listConf);
				}
			},
		},
		{
			moduleId: 'moderation',
			optionId: 'overview',
			async getPageData(client, config) {
				const { isEnabled } = config;

				var description = [
					`### Moderation Module`,
					`**Enabled:** ${isEnabled ? 'True' : 'False'}`,
				];

				var toggleModuleButton = buildButton(client, {
					moduleId: config.moduleId,
					optionId: config.optionId,
					value: isEnabled ? 'false' : 'true',
					label: `${isEnabled ? 'Disable' : 'Enable'} Module`,
					style: isEnabled ? ButtonStyle.Danger : ButtonStyle.Success,
				});

				return { description, rows: [[toggleModuleButton]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];
				await toggleModule(
					client,
					guildId,
					'moderation',
					client.getBoolean(value)
				);
			},
		},
		{
			moduleId: 'moderation',
			optionId: 'logChannel',
			async getPageData(client, config) {
				const { guildId } = config;

				var modConf = await client.db.repos.moderationConfig.findOneBy({
					guildId: guildId,
				});

				var description = [
					`### Moderation Module`,
					`**Log Channel:** ${
						modConf?.logChannel
							? `<#${modConf.logChannel}>`
							: 'None'
					}`,
				];

				var channelSelectMenu = buildChannelSelectMenu(client, {
					moduleId: 'moderation',
					optionId: 'logChannel',
					defaultChannels: [modConf?.logChannel],
				});

				return { description, rows: [[channelSelectMenu]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];

				var modConf = await client.db.repos.moderationConfig.findOneBy({
					guildId: guildId,
				});

				if (modConf) {
					modConf.logChannel = value;
					await client.db.repos.moderationConfig.save(modConf);
				}
			},
		},
		{
			moduleId: 'moderation',
			optionId: 'roles',
			async getPageData(client, config) {
				const { guildId } = config;

				var modConf = await client.db.repos.moderationConfig.findOne({
					where: {
						guildId: guildId,
					},
					relations: ['roles'],
				});

				var roleIds: Array<string> =
					modConf?.roles?.map((role) => role.roleId) || [];

				var roles = modConf?.roles
					?.map((r) => `<@&${r.roleId}>`)
					.join(', ');

				var description = [
					`### Moderation Module`,
					`**Roles:** ${roles ? `${roles}` : 'None'}`,
				];

				var moderationRolesSM = buildRoleSelectMenu(client, {
					moduleId: 'moderation',
					optionId: 'roles',
					maxValues: 10,
					defaultRoles: [...roleIds],
				});

				return { description, rows: [[moderationRolesSM]] };
			},
			updateOption: async (client, guildId, values: string[]) => {
				var modConf = await client.db.repos.moderationConfig.findOne({
					where: {
						guildId,
					},
					relations: ['roles'],
				});

				var oldRoles = modConf.roles?.filter(
					(role) => !values.includes(role.roleId)
				);

				for (let oldRole of oldRoles) {
					await client.db.repos.moderationConfig.delete(oldRole);
				}

				for (let value of values) {
					if (!modConf.roles?.some((role) => role.roleId === value)) {
						let role = new ModerationConfigRoleEntity();
						role.roleId = value;
						role.moderationConfig = modConf;
						await client.db.repos.moderationConfigRole.save(role);
					}
				}
			},
		},
		{
			moduleId: 'persist',
			optionId: 'overview',
			async getPageData(client, config) {
				const { isEnabled } = config;

				var description = [
					`### Persist Module`,
					`**Enabled:** ${isEnabled ? 'True' : 'False'}`,
				];

				var toggleModuleButton = buildButton(client, {
					moduleId: config.moduleId,
					optionId: config.optionId,
					value: isEnabled ? 'false' : 'true',
					label: `${isEnabled ? 'Disable' : 'Enable'} Module`,
					style: isEnabled ? ButtonStyle.Danger : ButtonStyle.Success,
				});

				return { description, rows: [[toggleModuleButton]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];
				await toggleModule(
					client,
					guildId,
					'persist',
					client.getBoolean(value)
				);
			},
		},
		{
			moduleId: 'persist',
			optionId: 'logChannel',
			async getPageData(client, config) {
				const { guildId } = config;

				var perConf = await client.db.repos.persistConfig.findOneBy({
					guildId: guildId,
				});

				var description = [
					`### Persist Module`,
					`**Log Channel:** ${
						perConf?.logChannel
							? `<#${perConf.logChannel}>`
							: 'None'
					}`,
				];

				var channelSelectMenu = buildChannelSelectMenu(client, {
					moduleId: 'persist',
					optionId: 'logChannel',
					defaultChannels: [perConf?.logChannel],
				});

				return { description, rows: [[channelSelectMenu]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];

				var perConf = await client.db.repos.persistConfig.findOneBy({
					guildId: guildId,
				});

				if (perConf) {
					perConf.logChannel = value;
					await client.db.repos.persistConfig.save(perConf);
				}
			},
		},
		{
			moduleId: 'persist',
			optionId: 'nicknames',
			async getPageData(client, config) {
				const { guildId } = config;

				var perConf = await client.db.repos.persistConfig.findOneBy({
					guildId: guildId,
				});

				var description = [
					`### Persist Module`,
					`**Nicknames:** ${perConf?.nicknames ? `True` : 'False'}`,
				];

				var nicknamesButton = buildButton(client, {
					moduleId: config.moduleId,
					optionId: config.optionId,
					value: perConf?.nicknames ? 'true' : 'false',
					label: `${
						perConf?.nicknames ? 'Disable' : 'Enable'
					} Nicknames`,
					style: perConf?.nicknames
						? ButtonStyle.Danger
						: ButtonStyle.Success,
				});

				return { description, rows: [[nicknamesButton]] };
			},
			updateOption: async (client, guildId, values) => {
				var value = values[0];

				var perConf = await client.db.repos.persistConfig.findOneBy({
					guildId: guildId,
				});

				if (perConf) {
					perConf.nicknames = perConf?.nicknames ? false : true;
					await client.db.repos.persistConfig.save(perConf);
				}
			},
		},
		{
			moduleId: 'persist',
			optionId: 'requiredRoles',
			async getPageData(client, config) {
				const { guildId } = config;

				var perConf = await client.db.repos.persistConfig.findOne({
					where: {
						guildId: guildId,
					},
					relations: ['requiredRoles'],
				});

				var roleIds: Array<string> =
					perConf?.requiredRoles?.map((role) => role.roleId) || [];

				var roles = perConf?.requiredRoles
					?.map((r) => `<@&${r.roleId}>`)
					.join(', ');

				var description = [
					`### Persist Module`,
					`**Required Roles:** ${roles ? `${roles}` : 'None'}`,
				];

				var requiredRolesSM = buildRoleSelectMenu(client, {
					moduleId: 'persist',
					optionId: 'requiredRoles',
					maxValues: 10,
					defaultRoles: [...roleIds],
				});

				return { description, rows: [[requiredRolesSM]] };
			},
			updateOption: async (client, guildId, values: string[]) => {
				var perConf = await client.db.repos.persistConfig.findOne({
					where: {
						guildId,
					},
					relations: ['requiredRoles'],
				});

				var oldRoles = perConf.requiredRoles?.filter(
					(role) => !values.includes(role.roleId)
				);

				for (let oldRole of oldRoles) {
					await client.db.repos.persistConfigRequiredRole.delete(
						oldRole
					);
				}

				for (let value of values) {
					if (
						!perConf.requiredRoles?.some(
							(role) => role.roleId === value
						)
					) {
						let role = new PersistConfigRequiredRoleEntity();
						role.roleId = value;
						role.persistConfig = perConf;
						await client.db.repos.persistConfigRequiredRole.save(
							role
						);
					}
				}
			},
		},
		{
			moduleId: 'persist',
			optionId: 'persistRoles',
			async getPageData(client, config) {
				const { guildId } = config;

				var perConf = await client.db.repos.persistConfig.findOne({
					where: {
						guildId: guildId,
					},
					relations: ['persistRoles'],
				});

				var roleIds: Array<string> =
					perConf?.persistRoles?.map((role) => role.roleId) || [];

				var roles = perConf?.persistRoles
					?.map((r) => `<@&${r.roleId}>`)
					.join(', ');

				var description = [
					`### Persist Module`,
					`**Persist Roles:** ${roles ? `${roles}` : 'None'}`,
				];

				var persistRolesSM = buildRoleSelectMenu(client, {
					moduleId: 'persist',
					optionId: 'persistRoles',
					maxValues: 10,
					defaultRoles: [...roleIds],
				});

				return { description, rows: [[persistRolesSM]] };
			},
			updateOption: async (client, guildId, values: string[]) => {
				var perConf = await client.db.repos.persistConfig.findOne({
					where: {
						guildId,
					},
					relations: ['persistRoles'],
				});

				var oldRoles = perConf.persistRoles?.filter(
					(role) => !values.includes(role.roleId)
				);

				for (let oldRole of oldRoles) {
					await client.db.repos.persistConfigRole.delete(oldRole);
				}

				for (let value of values) {
					if (
						!perConf.persistRoles?.some(
							(role) => role.roleId === value
						)
					) {
						let role = new PersistConfigRoleEntity();
						role.roleId = value;
						role.persistConfig = perConf;
						await client.db.repos.persistConfigRole.save(role);
					}
				}
			},
		},
	],
};
