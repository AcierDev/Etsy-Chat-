// Background service worker for Etsy Chat+ extension
// Handles ChatGPT API communication

// Rate limiting: track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getChatGPTReply") {
    // Check rate limiting
    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil(
        (MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000
      );
      sendResponse({
        error: `Please wait ${waitTime} seconds before making another request.`,
      });
      return;
    }

    lastRequestTime = currentTime;

    handleChatGPTRequest(
      request.messages,
      request.apiKey,
      request.manualInstructions
    )
      .then((reply) => sendResponse({ reply }))
      .catch((error) => sendResponse({ error: error.message }));

    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

async function handleChatGPTRequest(messages, apiKey, manualInstructions = "") {
  if (!apiKey) {
    throw new Error(
      "OpenAI API key is not set. Please configure it in the extension settings."
    );
  }

  try {
    // Convert message history to ChatGPT format
    const chatMessages = formatMessagesForChatGPT(messages, manualInstructions);

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using cost-effective model; can be upgraded to gpt-4
        messages: chatMessages,
        max_completion_tokens: 1000, // Reduced to prevent rate limiting and keep replies concise
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      if (response.status === 401) {
        throw new Error(
          "Invalid API key. Please check your OpenAI API key in settings."
        );
      } else if (response.status === 429) {
        // Handle rate limiting with more specific information
        const retryAfter = response.headers.get("Retry-After");
        if (retryAfter) {
          throw new Error(
            `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
          );
        } else {
          throw new Error(
            "Rate limit exceeded. Please wait a moment before trying again."
          );
        }
      } else if (response.status === 500) {
        throw new Error("OpenAI service error. Please try again later.");
      } else {
        throw new Error(errorData.error?.message || "Failed to generate reply");
      }
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response from ChatGPT");
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("ChatGPT API Error:", error);

    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }

    throw error;
  }
}

function formatMessagesForChatGPT(messages, manualInstructions = "") {
  // Create a system message to set the context
  let systemContent = `You are a helpful assistant that helps Etsy sellers craft professional, friendly, and effective replies to their customers. 
    
Your replies should be:
- Professional yet warm and friendly
- Concise but informative
- Helpful and solution-oriented
- Empathetic to customer concerns
- Following Etsy's seller guidelines
- Natural and conversational

Analyze the conversation history and generate an appropriate reply that addresses the customer's needs while maintaining a positive tone.`;

  // Add manual instructions if provided
  if (manualInstructions && manualInstructions.trim()) {
    systemContent += `\n\nIMPORTANT: The seller has provided specific instructions for this response. Please incorporate these instructions into your reply: "${manualInstructions.trim()}"`;
  }

  const systemMessage = {
    role: "system",
    content: systemContent,
  };

  // Convert message history to ChatGPT format
  const conversationMessages = messages.map((msg) => {
    // Map roles: seller -> assistant, buyer -> user
    const role = msg.role === "seller" ? "assistant" : "user";
    return {
      role: role,
      content: msg.content,
    };
  });

  // Add a final user message to request a reply
  const requestMessage = {
    role: "user",
    content:
      "Based on the conversation above, please generate a professional and helpful reply to the most recent message.",
  };

  return [systemMessage, ...conversationMessages, requestMessage];
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Listen for API key updates from popup/options
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.openai_api_key) {
    // Notify content scripts about the API key update
    chrome.tabs.query(
      { url: "https://www.etsy.com/your/conversations/*" },
      (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            action: "apiKeyUpdated",
            apiKey: changes.openai_api_key.newValue,
          });
        });
      }
    );
  }
});
