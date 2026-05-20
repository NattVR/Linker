export default {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    testTimeout: 120000,
    maxWorkers: 1,
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: "./tests-AI/tsconfig.ai.json"
            }
        ]
    },
    transformIgnorePatterns: [
        "node_modules/(?!(chrome-launcher|@browserbasehq/stagehand)/)"
    ],
    testMatch: ["**/tests-AI/**/*.test.ts"]
};