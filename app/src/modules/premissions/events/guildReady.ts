import { Guild } from "discord.js";
import { KiwiClient } from "../../../client";
import { Event, EventList } from "../../../types/event";

/**
 * @type {Event}
 */
export const GuildReady: Event = {
    name: EventList.GuildReady,

    /**
    * @param {KiwiClient} client
    * @param {Guild} guild
    */
    async execute(client: KiwiClient, guild: Guild) {
        var owner = await guild.members.fetch(guild.ownerId);
        var ownerLevel = await client.db.repos.memberLevels
            .findOneBy({ guildId: guild.id, userId: owner.id });

        if (!ownerLevel?.level || ownerLevel.level < 1000) {
            console.log("Setting owner level to 1000");
            await client.db.repos.memberLevels.save({
                guildId: guild.id,
                userId: owner.id,
                userName: owner.user.username,
                level: 1000
            });
        }
    }
}