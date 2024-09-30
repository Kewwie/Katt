import { Module } from "@/types/module";

// Slash Commands
import { ActivitySlash } from "./commands/activity";

// Select Menus
import { ActivitySelectMenu } from "./selectmenus/activity";

// Schedules
import { ActivityDailySchedule } from "./schedules/activity-daily";
import { ActivityWeeklySchedule } from "./schedules/activity-weekly";
import { ActivityMonthlySchedule } from "./schedules/activity-monthly";

export const ActivityModule: Module = {
    id: "activity",
    slashCommands: [
        ActivitySlash
    ],
    selectMenus: [
        ActivitySelectMenu
    ],
    schedules: [
        ActivityDailySchedule,
        ActivityWeeklySchedule,
        ActivityMonthlySchedule
    ]
}