import pkg from '../package.json';
import type { ExtensionSettings } from '#self/types';

export interface ExtensionConfig {
    // The base URL of the backend server.
    serverUrl: string;
    // The maximum length of a question.
    maxQuestionLength: number;
    // The maximum number of questions to keep in history.
    questionsHistoryLimit: number;
    // Example questions on the popup
    exampleQuestions: string[];
    // Extension version
    version: string;
    // Copyright information
    copyright: string;
    // Github repository
    github: string;
    // Default settings
    defaultSettings: ExtensionSettings;
}

export const config: ExtensionConfig = {
    serverUrl: 'http://localhost:3477',
    maxQuestionLength: 150,
    questionsHistoryLimit: 10,
    exampleQuestions: ['What is this page about?', 'How can I buy this product?', 'Where is a contact information?'],
    version: pkg.version,
    copyright: `FlowForge ${pkg.version} ✦ 2026 Antony Belov`,
    github: 'https://github.com/cerberus-ab/flowforge',
    defaultSettings: {
        theme: 'light',
    },
};
