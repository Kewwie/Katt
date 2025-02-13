import { Qewi } from "../qewi";
import { PluginHandler } from "../plugins/pluginHandler";
import { Command, Context, Data } from "./commandTypes";
import { ChatInputCommandInteraction, GuildMember, Routes } from "discord.js";
import axios from "axios";

export class CommandHandler {
    public globalCommands = new Map<string, Command>();
    public guildCommands = new Map<string, Map<string, Command>>();

    private qewi: Qewi;
    private pluginHandler: PluginHandler;
    constructor(qewi: Qewi) {
        this.qewi = qewi;
        this.pluginHandler = qewi.pluginHandler;

        // Listen for slash command interactions
        this.qewi.client.on("interactionCreate", async (interaction) => {
            if (interaction.isChatInputCommand()) {
                await this._onSlashCommand(interaction);
            }
        });
    }

    private async _onSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        const commandId = interaction.commandName;
        const command = this.getCommand(commandId, interaction.guildId);
        if (!command) return;

        const plugin = this.pluginHandler.getPlugin(command.pluginId, interaction.guildId);

        const ctx: Context = {
            qewi: this.qewi,
            plugin: plugin,
            command: command,
            guildId: interaction.guildId,
        };

        const data: Data = {
            interaction: interaction,
            guild: interaction.guild,
            authorId: interaction.user.id,
        };

        if (!this._isAllowed(ctx, data)) {
            await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
            return;
        }

        if (command.beforeTrigger) {
            await command.beforeTrigger(ctx, data);
        }
        await command.trigger(ctx, data);
        if (command.afterTrigger) {
            await command.afterTrigger(ctx, data);
        }
    }

    private _isAllowed(ctx: Context, data: Data): boolean {
        const member = data.interaction.member as GuildMember;
        if (!member) return false;

        let requiredRoles: string[] = [];
        let requiredPermissions: any[] = [];

        if (ctx.plugin.default) {
            requiredRoles = ctx.plugin.default.roles;
            requiredPermissions = ctx.plugin.default.permissions;
        }

        if (ctx.command.default) {
            requiredRoles = ctx.command.default.roles;
            requiredPermissions = ctx.command.default.permissions;
        }

        let hasAccess = false;
        // Check roles
        for (const roleId of requiredRoles) {
            if (member.roles.cache.has(roleId)) {
                hasAccess = true;
                break;
            }
        }
        // Check permissions
        for (const permission of requiredPermissions) {
            if (member.permissions.has(permission)) {
                hasAccess = true;
                break;
            }
        }
        return hasAccess;
    }

    /* Register command */
    private async _registerCommand(command: Command, guildId?: string): Promise<void> {
        const commandData: any = {
            name: command.id,
            description: command.description,
            type: command.type,
            options: command.options,
        };

        // Fix all of the options in commandData
        if (commandData.options) {
            for (let option of commandData.options) {
                option.channelTypes = option.channel_type;
                option.minValue = option.min_value;
                option.maxValue = option.max_value;
                option.minLength = option.min_length;
                option.maxLength = option.max_length;
            }
        }

        try {
            if (!guildId) {
                await axios.put(
                    this.qewi.apiUrl + Routes.applicationGuildCommands(this.qewi.client.user.id, guildId),
                    [commandData],
                    {
                        headers: {
                            Authorization: `Bot ${this.qewi.config.token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
            } else {
                await axios.put(
                    this.qewi.apiUrl + Routes.applicationCommands(this.qewi.client.user.id),
                    [commandData],
                    {
                        headers: {
                            Authorization: `Bot ${this.qewi.config.token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }
            console.info(`Successfully registered command ${command.id} (${guildId})`);
        } catch (error) {
            console.error(`Failed to register command ${command.id} (${guildId})`);
            console.error(error.response.data);
            console.log(commandData);
        }
    }

    /* Command lookup and management (global/guild) remains the same */

    public getCommand(commandId: string, guildId?: string | null): Command | null {
        let command: Command | null = this.getGlobalCommand(commandId);
        if (!command && guildId) {
            command = this._getGuildCommand(guildId, commandId);
        }
        return command;
    }

    public getGlobalCommand(commandId: string): Command | null {
        return this.globalCommands.get(commandId) || null;
    }

    public loadGlobalCommand(commandId: string, command: Command): void {
        if (this.getGlobalCommand(commandId)) {
            throw new Error(`Command ${commandId} is already loaded globally`);
        } else {
            this.globalCommands.set(commandId, command);
            this._registerCommand(command);
        }
    }

    public unloadGlobalCommand(commandId: string): void {
        const command = this.getGlobalCommand(commandId);
        if (command) {
            this.globalCommands.delete(commandId);
        } else {
            throw new Error(`Command ${commandId} is not loaded globally`);
        }
    }

    private _getGuildCommands(guildId: string): Map<string, Command> {
        let commandsMap = this.guildCommands.get(guildId);
        if (!commandsMap) {
            commandsMap = new Map<string, Command>();
        }
        return commandsMap;
    }

    private _getGuildCommand(guildId: string, commandId: string): Command | null {
        return this._getGuildCommands(guildId).get(commandId) || null;
    }

    private _setGuildCommand(guildId: string, commandId: string, command: Command): void {
        const guildCommands = this._getGuildCommands(guildId);
        guildCommands.set(commandId, command);
        this.guildCommands.set(guildId, guildCommands);
    }

    public loadGuildCommand(guildId: string, commandId: string, command: Command): void {
        if (this._getGuildCommand(guildId, commandId)) {
            throw new Error(`Command ${commandId} is already loaded in guild ${guildId}`);
        } else {
            this._setGuildCommand(guildId, commandId, command);
            this._registerCommand(command, guildId);
        }
    }

    public unloadGuildCommand(guildId: string, commandId: string): void {
        const command = this._getGuildCommand(guildId, commandId);
        if (!command) {
            throw new Error(`Command ${commandId} is not loaded in guild ${guildId}`);
        } else {
            this._getGuildCommands(guildId).delete(commandId);
        }
    }
}
