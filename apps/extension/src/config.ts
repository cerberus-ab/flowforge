export interface ExtensionConfig {
    // The base URL of the backend server.
    serverUrl: string;
    // The maximum length of a question.
    maxQuestionLength: number;
    // The maximum number of questions to keep in history.
    questionsHistoryLimit: number;
    // Example questions on the popup
    exampleQuestions: string[];
    // Copyright information
    copyright: string;
}

export const config: ExtensionConfig = {
    serverUrl: 'http://localhost:3477',
    maxQuestionLength: 150,
    questionsHistoryLimit: 10,
    exampleQuestions: ['What is this page about?', 'How can I buy this product?', 'Where is a contact information?'],
    copyright: 'FlowForge ✦ 2026 Antony Belov',
};
