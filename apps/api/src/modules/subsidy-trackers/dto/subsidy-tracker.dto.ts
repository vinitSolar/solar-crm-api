import type { ISubsidyTracker, ISubsidyTrackerSafe } from "../interfaces/subsidy-tracker.interface.js";

export function toSubsidyTrackerSafe(tracker: ISubsidyTracker): ISubsidyTrackerSafe {
    const { id, isDeleted, deletedBy, ...safeTracker } = tracker;
    return safeTracker;
}
