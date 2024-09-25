import { DataSource, Repository } from "typeorm";
import { KiwiClient } from "./client";

import { dataSource } from "./datasource";

import { ActivityConfigEntity } from "./entities/ActivityConfig";
import { GuildModuleEntity } from "./entities/GuildModule";
import { ListConfigEntity } from "./entities/ListConfig";
import { MemberLevelEntity } from "./entities/MemberLevel";

export class DatabaseManager {
    private dataSource: DataSource;
    private client: KiwiClient;
    private repos: {
        activityConfig: Repository<ActivityConfigEntity>;
        guildModules: Repository<GuildModuleEntity>;
        listConfig: Repository<ListConfigEntity>;
        memberLevels: Repository<MemberLevelEntity>;
    };

    constructor(client: KiwiClient) {
        this.client = client;
        this.dataSource = dataSource;

        this.onCreate();
    }

    private async onCreate() {
        this.repos = {
            activityConfig: await this.dataSource.getRepository(ActivityConfigEntity),
            guildModules: await this.dataSource.getRepository(GuildModuleEntity),
            listConfig: await this.dataSource.getRepository(ListConfigEntity),
            memberLevels: await this.dataSource.getRepository(MemberLevelEntity)
        }
    }

    public async generateConfigs(guildId: string) {
        var activityConfig = await this.getActivityConfig(guildId);
        if (!activityConfig) {
            await this.createActivityConfig(guildId);
        }

        var listConfig = await this.getListConfig(guildId);
        if (!listConfig) {
            await this.createListConfig(guildId);
        }
    }

    public async createActivityConfig(guildId: string) {
        let activityConfig = new ActivityConfigEntity();
        activityConfig.guildId = guildId;
        return await this.repos.activityConfig.save(activityConfig);
    }

    public async getActivityConfig(guildId: string) {
        return await this.repos.activityConfig.findOne({ where: { guildId: guildId }});
    }

    public async saveActivityConfig(config: ActivityConfigEntity) {
        return await this.repos.activityConfig.save(config);
    }

    public async createListConfig(guildId: string) {
        let listConfig = new ListConfigEntity();
        listConfig.guildId = guildId;
        return await this.repos.listConfig.save(listConfig);
    }

    public async getListConfig(guildId: string) {
        return await this.repos.listConfig.findOne({ where: { guildId: guildId }});
    }

    public async saveListConfig(config: ListConfigEntity) {
        return await this.repos.listConfig.save(config);
    }

    public async enableGuildModule(guildId: string, moduleId: string) {
        var isAlreadyEnabled = await this.isModuleEnabled(guildId, moduleId);
        if (!isAlreadyEnabled) {
            let guildModule = new GuildModuleEntity();
            guildModule.guildId = guildId;
            guildModule.moduleId = moduleId;
            return await this.repos.guildModules.save(guildModule);
        }
    }

    public async getEnabledModules(guildId: string) {
        return (await this.repos.guildModules.find({ where: { guildId: guildId } })).map(module => module.moduleId);
    }

    public async isModuleEnabled(guildId: string, moduleId: string) {
        if (await this.repos.guildModules.findOne({ where: { guildId: guildId, moduleId: moduleId } })) {
            return true;
        } else {
            return false;
        }
    }

    public async disableGuildModule(guildId: string, moduleId: string) {
        await this.repos.guildModules.delete({ guildId: guildId, moduleId: moduleId });
    }

    public async setMemberLevel(guildId: string, userId: string, level: number) {
        await this.repos.memberLevels.delete({ guildId: guildId, userId: userId });
        if (level > 0) {
            let memberLevel = new MemberLevelEntity();
            memberLevel.guildId = guildId;
            memberLevel.userId = userId;
            memberLevel.level = level;
            return await this.repos.memberLevels.save(memberLevel);
        }
    }

    public async getMemberLevel(guildId: string, userId: string) {
        let memberLevel = await this.repos.memberLevels.findOne({ where: { guildId: guildId, userId: userId } });
        if (memberLevel) {
            return memberLevel.level;
        } else {
            return 0;
        }
    }
}