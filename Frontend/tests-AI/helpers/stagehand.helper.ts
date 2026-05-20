import { Stagehand } from "@browserbasehq/stagehand";
import { stagehandConfig } from "../../stagehand.config";

export async function createStagehand() {
    const stagehand = new Stagehand(stagehandConfig);
    await stagehand.init();
    const page = stagehand.context.pages()[0];
    return { stagehand, page };
}