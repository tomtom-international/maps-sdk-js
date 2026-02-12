import { createAzure } from '@ai-sdk/azure';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createMapAgent } from '@tomtom-org/maps-sdk-map-agent';
import './style.css';
import { API_KEY, AZURE_API_KEY, AZURE_API_VERSION, AZURE_BASE_URL, AZURE_DEPLOYMENT_ID } from './config';

// Configure TomTom API
TomTomConfig.instance.put({ apiKey: API_KEY });

// Initialize map
const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center: [-0.1276, 51.5074], // London
        zoom: 12,
    },
});

// Create Azure OpenAI provider and map agent
const azure = createAzure({
    baseURL: AZURE_BASE_URL,
    apiKey: AZURE_API_KEY,
    apiVersion: AZURE_API_VERSION,
    useDeploymentBasedUrls: true,
});

// Simple test to verify Azure OpenAI integration works
const agent = createMapAgent(map, {
    model: azure.chat(AZURE_DEPLOYMENT_ID),
    maxSteps: 10,
});

// Chat UI elements
const messagesContainer = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input') as HTMLInputElement | null;
const sendButton = document.getElementById('send-button') as HTMLButtonElement | null;
const clearButton = document.getElementById('clear-chat') as HTMLButtonElement | null;

// Validate UI elements exist
if (!messagesContainer || !chatInput || !sendButton || !clearButton) {
    throw new Error('Required UI elements not found');
}

// Message history
const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

// Add message to UI
function addMessage(role: 'user' | 'assistant' | 'error', content: string, isThinking = false) {
    if (!messagesContainer) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (isThinking) {
        messageDiv.classList.add('thinking');
    }
    messageDiv.textContent = content;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageDiv;
}

// Add tool call message to UI
function addToolCallMessage(toolName: string, args: any) {
    if (!messagesContainer) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message tool-call';
    
    const toolNameSpan = document.createElement('div');
    toolNameSpan.className = 'tool-name';
    toolNameSpan.textContent = `🔧 ${toolName}`;
    
    const argsDiv = document.createElement('div');
    argsDiv.className = 'tool-args';
    argsDiv.textContent = JSON.stringify(args, null, 2);
    
    messageDiv.appendChild(toolNameSpan);
    messageDiv.appendChild(argsDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageDiv;
}

// Send message to agent
async function sendMessage(userMessage: string) {
    if (!userMessage.trim() || !chatInput || !sendButton) return;

    // Clear input and disable controls
    chatInput.value = '';
    chatInput.disabled = true;
    sendButton.disabled = true;

    // Add user message to UI and history
    addMessage('user', userMessage);
    messages.push({ role: 'user', content: userMessage });

    // Add thinking indicator
    const thinkingDiv = addMessage('assistant', 'Thinking...', true);

    try {
        // Debug: Log the conversation state
        console.log('🤖 Agent generating response with messages:', messages);
        
        // Generate response from agent with step tracking
        const result = await agent.agent.generate({ 
            messages,
            onStepFinish: (step) => {
                console.log('\n📍 Step finished:', JSON.stringify(step, null, 2));
                
                // Display tool calls in the UI
                if (step.toolCalls && step.toolCalls.length > 0) {
                    for (const toolCall of step.toolCalls) {
                        // The property is called 'input' in the AI SDK
                        const args = (toolCall as any).input || {};
                        addToolCallMessage(toolCall.toolName, args);
                    }
                }
            }
        });

        // Remove thinking indicator
        thinkingDiv?.remove();

        // Extract text from response
        let assistantMessage = '';
        if (result.text) {
            assistantMessage = result.text;
        } else if (result.toolResults && result.toolResults.length > 0) {
            // If no text but tool results, show a generic message
            assistantMessage = 'Done! I made some changes to the map.';
        } else {
            assistantMessage = "I'm not sure how to help with that.";
        }

        // Add assistant message to UI and history
        addMessage('assistant', assistantMessage);
        messages.push({ role: 'assistant', content: assistantMessage });
        
        console.log('✅ Agent response complete:', assistantMessage);
    } catch (error) {
        // Remove thinking indicator
        thinkingDiv?.remove();

        // Show error
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        addMessage('error', `Error: ${errorMessage}`);
        
        // Enhanced error logging
        console.error('❌ Agent error:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                // @ts-ignore - error might have additional properties
                cause: error.cause,
            });
        }
    } finally {
        // Re-enable controls
        if (chatInput && sendButton) {
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.focus();
        }
    }
}

// Event listeners
sendButton.addEventListener('click', () => {
    sendMessage(chatInput.value);
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(chatInput.value);
    }
});

clearButton.addEventListener('click', () => {
    if (!messagesContainer) return;
    messagesContainer.innerHTML = '';
    messages.length = 0;
    agent.destroy();
    addMessage('assistant', 'Conversation cleared. How can I help you?');
});

// Welcome message
addMessage('assistant', 'Hello! I can help you explore locations, plan routes, and control the map. Try asking me to:');
addMessage('assistant', '• "Find coffee shops near Piccadilly Circus"');
addMessage('assistant', '• "Show me a route from London Eye to Tower Bridge"');
addMessage('assistant', '• "Switch to satellite view and show traffic"');
addMessage('assistant', '• "What\'s at these coordinates: -0.1276, 51.5074?"');

// Focus input
chatInput.focus();
