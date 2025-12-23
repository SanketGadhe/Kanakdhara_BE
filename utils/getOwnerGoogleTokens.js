const fs = require('fs');
const path = require('path');

function getOwnerGoogleTokens() {
    // Prefer the consolidated SAVE_OWNERS_TOKEN (base64-encoded JSON) if present
    const saved = process.env.SAVE_OWNERS_TOKEN;
    if (saved) {
        try {
            const json = Buffer.from(saved, 'base64').toString('utf8');
            const parsed = JSON.parse(json);
            return {
                access_token: parsed.access_token,
                refresh_token: parsed.refresh_token,
            };
        } catch (err) {
            // fall back to individual env vars if parsing fails
            console.error('Failed to parse SAVE_OWNERS_TOKEN:', err.message);
        }
    }

    // Backwards compatibility: use individual env vars if present
    return {
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    };
}

/**
 * Persist owner tokens into the project's .env as a base64-encoded JSON string
 * This overwrites or appends the `SAVE_OWNERS_TOKEN` entry.
 * tokens: { access_token, refresh_token }
 */
function saveOwnerGoogleTokens(tokens = {}) {
    const envPath = path.join(__dirname, '..', '.env');
    const encoded = Buffer.from(JSON.stringify(tokens)).toString('base64');

    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
        const regex = /^SAVE_OWNERS_TOKEN=.*$/m;
        const line = `SAVE_OWNERS_TOKEN="${encoded}"`;
        if (regex.test(content)) {
            content = content.replace(regex, line);
        } else {
            // append with a newline
            if (!content.endsWith('\n')) content += '\n';
            content += `\n# Saved owner Google tokens (base64 JSON)\n${line}\n`;
        }
    } else {
        content = `# .env created by saveOwnerGoogleTokens\nSAVE_OWNERS_TOKEN="${encoded}"\n`;
    }

    fs.writeFileSync(envPath, content, { encoding: 'utf8' });
}

module.exports = {
    getOwnerGoogleTokens,
    saveOwnerGoogleTokens,
};
