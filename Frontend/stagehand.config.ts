import dotenv from "dotenv";
dotenv.config();

export const stagehandConfig = {
    env: "LOCAL" as const,
    model: {
        modelName: process.env.GEMINI_MODEL || "google/gemini-2.5-flash",
        apiKey: process.env.GEMINI_API_KEY || "",
    },
    localBrowserLaunchOptions: {
        headless: false,
    },
};

export const BASE_URL = process.env.BASE_URL || "http://localhost:4200";