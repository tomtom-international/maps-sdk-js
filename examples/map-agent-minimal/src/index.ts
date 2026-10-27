import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent, type MapAgentInstance } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { ModelMessage } from 'ai';
import './style.css';
import { API_KEY, createModel } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const map = new TomTomMap({ mapLibre: { container: 'sdk-map', center: [4.8932, 52.3731], zoom: 13 } });

const form = document.getElementById('chat-form') as HTMLFormElement;
const input = document.getElementById('chat-input') as HTMLInputElement;
const sendButton = document.getElementById('chat-send') as HTMLButtonElement;
const transcript = document.getElementById('chat-messages') as HTMLDivElement;

// The agent keeps the map's state between turns but not the chat, so every turn sends the whole conversation.
const messages: ModelMessage[] = [];
let agent: MapAgentInstance | undefined;

const addMessage = (className: string, text: string) => {
    const element = document.createElement('div');
    element.className = `message ${className}`;
    element.textContent = text;
    transcript.append(element);
    transcript.scrollTop = transcript.scrollHeight;
    return element;
};

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const prompt = input.value.trim();
    if (!prompt) return;

    input.value = '';
    sendButton.disabled = true;
    addMessage('user', prompt);
    const promptIndex = messages.push({ role: 'user', content: prompt }) - 1;
    const reply = addMessage('assistant thinking', 'Working on it…');
    try {
        // Created on the first message, so a missing model setting shows in the chat instead of breaking the page.
        // The chat prints plain text, and the default system prompt asks for markdown.
        agent ??= createMapAgent(map, {
            model: createModel(),
            systemPromptSuffix: 'Reply in plain text, without markdown.',
        });
        const result = await agent.stream({ messages });
        let replyText = '';
        for await (const part of result.stream) {
            if (part.type === 'error') throw part.error;

            if (part.type === 'text-delta') {
                replyText += part.text;
                reply.textContent = replyText;
                reply.classList.remove('thinking');
                transcript.scrollTop = transcript.scrollHeight;
            }
        }
        messages.push(...(await result.responseMessages));
    } catch (error) {
        // A failed turn leaves no prompt behind, or the next turn would send it again.
        messages.length = promptIndex;
        reply.remove();
        addMessage('error', `Something went wrong: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        sendButton.disabled = false;
    }
});
