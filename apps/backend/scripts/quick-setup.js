import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { setTimeout as sleep } from 'timers/promises';

const envPath = path.resolve(process.cwd(), '.env');
const examplePath = path.resolve(process.cwd(), '.env.example');

(async function quickSetup() {
    console.log('Welcome to FlowForge Backend Setup...\n');

    // init .env file or skip setup
    if (fs.existsSync(envPath)) {
        const answer = await ask('.env already exists. Recreate? (y/N): ');

        const shouldRecreate = answer.toLowerCase() === 'y';
        if (!shouldRecreate) {
            console.log('✓ Skipping setup');
            return;
        }
    }
    // extend the existing template
    let env = fs.readFileSync(examplePath, 'utf8');

    // Set up LLM provider
    let provider = await ask('Choose LLM provider (1 = OpenAI, 2 = Ollama) [1]: ');
    if (!provider) provider = '1';

    if (provider === '2') {
        console.log('\nUsing Ollama (local)');
        env = setEnvValue(env, 'LLM_PROVIDER', 'ollama-local');
        console.log(`- make sure Ollama is running on ${getEnvValue(env, 'OLLAMA_LOCAL_BASE_URL')}`);
        console.log(
            `- make sure the models have been pulled: ${[
                getEnvValue(env, 'OLLAMA_LOCAL_MODEL'),
                getEnvValue(env, 'OLLAMA_LOCAL_EMBEDDING'),
            ].join(', ')}`,
        );
        const answer = await ask('Have you made sure. Continue? (y/N): ');
        const shouldContinue = answer.toLowerCase() === 'y';
        if (!shouldContinue) {
            exitWithoutError();
        }
    } else {
        console.log('\nUsing OpenAI (default)');
        const apiKey = await ask('Enter OPENAI_API_KEY: ');
        if (!apiKey) {
            exitWithError('OPENAI_API_KEY is required');
        }
        env = setEnvValue(env, 'LLM_PROVIDER', 'openai');
        env = setEnvValue(env, 'OPENAI_API_KEY', apiKey);
    }

    fs.writeFileSync(envPath, env);
    console.log('\n✓ .env created at backend/.env');
    console.log('For more settings, see README.md Hooray!');
    await sleep(1500);
})();

/**
 * Prompts the user with a question and returns their input
 * @param {string} question - The question to display to the user
 * @returns {Promise<string>} - A promise that resolves to the user's trimmed input
 */
function ask(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) =>
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        }),
    );
}

/**
 * Logs an error message and terminates the process with exit code `1`.
 * @param {string} message - Error message to print.
 * @returns {never}
 */
function exitWithError(message) {
    console.error(message);
    process.exit(1);
}

/**
 * Logs a message and terminates the process with exit code `0`.
 * @param {string} message - Message to print before exiting.
 * @returns {never}
 */
function exitWithoutError(message = '✖ Setup cancelled') {
    console.log(message);
    process.exit(0);
}

/**
 * Sets or updates an environment variable in the given content string.
 * If the key already exists, replaces its value. Otherwise, appends a new line.
 *
 * @param {string} content - The environment file content
 * @param {string} key - The environment variable key
 * @param {string|number|null|undefined} value - The environment variable value
 * @returns {string} - The updated content with the new or modified environment variable
 */
function setEnvValue(content, key, value) {
    const escapedValue = String(value ?? '');
    const regex = new RegExp(`^${key}=.*$`, 'm');

    if (regex.test(content)) {
        return content.replace(regex, `${key}=${escapedValue}`);
    }
    return `${content.trimEnd()}\n${key}=${escapedValue}\n`;
}

/**
 * Retrieves the value of an environment variable from the given content string.
 *
 * @param {string} content - The environment file content
 * @param {string} key - The environment variable key to retrieve
 * @returns {string|undefined} - The value of the environment variable, or undefined if not found
 */
function getEnvValue(content, key) {
    const regex = new RegExp(`^${key}=(.*)$`, 'm');
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
}
