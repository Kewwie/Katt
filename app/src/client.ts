import {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    ColorResolvable,
    ClientPresenceStatus
} from "discord.js";

import { DatabaseManager } from "./databaseManager";

import { ModuleManager } from "./moduleManager";
import { CommandManager } from "./commandManager";
import { ComponentManager } from "./componentManager";
import { EventManager } from "./eventManager";
import { PageManager } from "./pageManager";

import { Event, EventList } from "./types/event";

import { ClientModules } from "./clientModules";

// Importing All Events
import { GuildCreate } from "./events/guildCreate";
import { GuildReady } from "./events/guildReady";
import { Ready } from "./events/ready";
import { VoiceStateUpdate } from "./events/voiceStateUpdate";

export class KiwiClient extends Client {
    public Settings: {
        color: ColorResolvable
    };
    public Events: Collection<string, Event>;

    public db: DatabaseManager;
    
    public ModuleManager: ModuleManager;
    public CommandManager: CommandManager;
    public ComponentManager: ComponentManager;
    public EventManager: EventManager;
    public PageManager: PageManager;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildVoiceStates,
                //GatewayIntentBits.AutoModerationExecution,
                //GatewayIntentBits.AutoModerationConfiguration,
            ],
            partials: [
                Partials.GuildMember,
                Partials.Channel,
                Partials.Message,
                Partials.User,
            ],
            presence: {
                status: "online" as ClientPresenceStatus,
            }
        });

        this.Settings = {
            color: "#7289DA"
        }

        // Database Manager
        this.db = new DatabaseManager(this);


        // Event Manager
        this.EventManager = new EventManager(this);
        this.Events = new Collection();
        var ClientEvents = [
            GuildCreate,
            GuildReady,
            Ready,
            VoiceStateUpdate
        ]
        
        for (let event of ClientEvents) {
            this.EventManager.load(event);
        }
        this.EventManager.register([...this.Events.values()]);

        // Component Manager
        this.ComponentManager = new ComponentManager(this);
        this.on(EventList.InteractionCreate, this.ComponentManager.onInteraction.bind(this.ComponentManager));
        // Page Manager
        this.PageManager = new PageManager(this);

        // Command Manager
        this.CommandManager = new CommandManager(this);
        this.on(EventList.InteractionCreate, this.CommandManager.onInteraction.bind(this.CommandManager));
        this.on(EventList.MessageCreate, this.CommandManager.onMessage.bind(this.CommandManager));

        this.ModuleManager = new ModuleManager(this);
        for (let module of ClientModules) {
            this.ModuleManager.load(module);
        }
    }

    public capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    public createCustomId(
        options: { 
            start: string,
            optionOne?: string,
            optionTwo?: string,
            userId?: string
        }): string {
            var optionOne = options.optionOne || "";
            var optionTwo = options.optionTwo || "";
            var userId = options.userId || "";
        return `${options.start}+${optionOne}+${optionTwo}+${userId}`;
    }
};