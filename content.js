// Content script for Etsy Chat+ extension
// Injects ChatGPT button into Etsy conversation page

class EtsyChatPlus {
  constructor() {
    this.apiKey = null;
    this.modal = null;
    this.messageHistory = [];
    this.expandModal = null;
    this.init();
  }

  async init() {
    console.log("Etsy Chat+ extension initialized");
    console.log("Current URL:", window.location.href);
    console.log("Document ready state:", document.readyState);

    // Load API key from storage
    const result = await chrome.storage.sync.get(["openai_api_key"]);
    this.apiKey = result.openai_api_key;

    // Check if we're on a conversation page
    if (!this.isConversationPage()) {
      console.log("Not on a conversation page, skipping initialization");
      return;
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "apiKeyUpdated") {
        this.apiKey = request.apiKey;
      }
    });

    // Wait for the page to fully load and find the reply area
    // Use multiple strategies to ensure we catch the page when it's ready
    this.waitForMessageArea();
  }

  isConversationPage() {
    const url = window.location.href;
    return (
      url.includes("/your/conversations/") ||
      url.includes("/messages/") ||
      url.includes("/conversations/")
    );
  }

  waitForMessageArea() {
    console.log("Waiting for message area to load...");

    // Multiple detection strategies
    const strategies = [
      // Strategy 1: Look for quick replies button
      () => document.querySelector('[aria-label="Quick replies"]'),
      // Strategy 2: Look for message input textarea
      () =>
        document.querySelector(
          'textarea[placeholder*="message"], textarea[name*="message"]'
        ),
      // Strategy 3: Look for compose area
      () =>
        document.querySelector(
          '[class*="compose"], [class*="message-input"], [class*="conversation-input"]'
        ),
      // Strategy 4: Look for any message-related container
      () =>
        document.querySelector(
          '[class*="message"], [class*="conversation"], [class*="chat"]'
        ),
      // Strategy 5: Look for any button that might be in the toolbar
      () =>
        document.querySelector(
          'button[class*="toolbar"], button[class*="compose"]'
        ),
      // Strategy 6: Look for any textarea (fallback)
      () => document.querySelector("textarea"),
    ];

    let attempts = 0;
    const maxAttempts = 60; // 30 seconds total (500ms * 60)
    let foundElements = false;

    const checkForElements = () => {
      if (foundElements) return; // Stop if already found

      attempts++;
      console.log(
        `Checking for message area elements (attempt ${attempts}/${maxAttempts})...`
      );

      // Check each strategy
      for (let i = 0; i < strategies.length; i++) {
        const element = strategies[i]();
        if (element) {
          console.log(`Found element using strategy ${i + 1}:`, element);
          console.log(
            "Found Etsy interface elements, injecting ChatGPT button..."
          );
          this.injectChatGPTButton();
          this.injectExpandButton();
          foundElements = true;
          return;
        }
      }

      // Log current page state for debugging
      if (attempts % 10 === 0) {
        console.log("Page state check:", {
          totalElements: document.querySelectorAll("*").length,
          hasTextareas: document.querySelectorAll("textarea").length,
          hasButtons: document.querySelectorAll("button").length,
          bodyClasses: document.body.className,
          url: window.location.href,
        });
      }

      // Continue checking or timeout
      if (attempts < maxAttempts && !foundElements) {
        setTimeout(checkForElements, 500);
      } else if (!foundElements) {
        console.warn(
          "Timeout waiting for message area. Extension may not work on this page."
        );
        console.log("Final page state:", {
          totalElements: document.querySelectorAll("*").length,
          url: window.location.href,
        });
      }
    };

    // Set up MutationObserver to watch for dynamic content changes
    this.setupMutationObserver();

    // Set up URL change listener for SPA navigation
    this.setupUrlChangeListener();

    // Start checking after a short delay to let initial page load
    setTimeout(checkForElements, 1000);
  }

  setupMutationObserver() {
    console.log("Setting up MutationObserver for dynamic content...");

    const observer = new MutationObserver((mutations) => {
      // Check if any new elements were added that might be the message area
      let shouldCheck = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain message-related elements
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              // Check if this element or its children contain message area indicators
              if (
                element.querySelector &&
                (element.querySelector('[aria-label="Quick replies"]') ||
                  element.querySelector('textarea[placeholder*="message"]') ||
                  element.querySelector('[class*="compose"]') ||
                  element.querySelector('[class*="message-input"]'))
              ) {
                shouldCheck = true;
              }
            }
          });
        }
      });

      if (shouldCheck && !document.getElementById("etsy-chatgpt-button")) {
        console.log(
          "MutationObserver detected potential message area changes, checking for injection..."
        );
        setTimeout(() => {
          if (!document.getElementById("etsy-chatgpt-button")) {
            this.injectChatGPTButton();
          }
          if (!document.getElementById("etsy-expand-button")) {
            this.injectExpandButton();
          }
        }, 500);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("MutationObserver is now watching for dynamic content changes");
  }

  setupUrlChangeListener() {
    console.log("Setting up URL change listener for SPA navigation...");

    let currentUrl = window.location.href;

    // Listen for popstate events (back/forward navigation)
    window.addEventListener("popstate", () => {
      console.log("URL changed via popstate:", window.location.href);
      this.handleUrlChange(currentUrl, window.location.href);
      currentUrl = window.location.href;
    });

    // Use MutationObserver to detect URL changes in SPA
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        console.log("URL changed via SPA navigation:", window.location.href);
        this.handleUrlChange(currentUrl, window.location.href);
        currentUrl = window.location.href;
      }
    });

    // Watch for changes in the document title (often changes with URL in SPAs)
    urlObserver.observe(document.querySelector("title"), {
      childList: true,
      characterData: true,
      subtree: true,
    });

    console.log("URL change listener is now active");
  }

  handleUrlChange(oldUrl, newUrl) {
    console.log("Handling URL change from", oldUrl, "to", newUrl);

    // Remove existing buttons if they exist
    const existingButton = document.getElementById("etsy-chatgpt-button");
    const existingExpandButton = document.getElementById("etsy-expand-button");
    if (existingButton) {
      console.log("Removing existing ChatGPT button due to URL change");
      existingButton.remove();
    }
    if (existingExpandButton) {
      console.log("Removing existing expand button due to URL change");
      existingExpandButton.remove();
    }

    // Check if we're still on a conversation page
    if (
      newUrl.includes("/your/conversations/") ||
      newUrl.includes("/messages/")
    ) {
      console.log(
        "Still on conversation page, waiting for new message area..."
      );
      // Wait a bit for the new page to load, then try to inject again
      setTimeout(() => {
        this.waitForMessageArea();
      }, 1000);
    } else {
      console.log(
        "No longer on conversation page, stopping injection attempts"
      );
    }
  }

  waitForElement(selector, callback) {
    const checkElement = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(checkElement);
        callback();
      }
    }, 500);

    // Fallback timeout after 10 seconds
    setTimeout(() => clearInterval(checkElement), 10000);
  }

  injectChatGPTButton() {
    console.log("Attempting to inject ChatGPT button...");

    // Try multiple selectors to find the message compose area
    let targetElement = null;

    // Look for quick replies button first
    const quickRepliesButton = document
      .querySelector('[aria-label="Quick replies"]')
      ?.closest("button");
    console.log("Quick replies button found:", !!quickRepliesButton);

    if (quickRepliesButton) {
      targetElement = quickRepliesButton.parentNode;
      console.log("Using quick replies parent as target");
    } else {
      // Try alternative selectors based on Etsy's DOM structure
      const composeArea = document.querySelector(
        '[class*="compose"], [class*="message-input"], [class*="conversation-input"]'
      );
      const toolbar = document.querySelector(
        '[class*="toolbar"], [class*="compose-toolbar"], [class*="message-toolbar"]'
      );
      const textarea = document.querySelector(
        'textarea[placeholder*="message"], textarea[name*="message"]'
      );

      console.log(
        "Alternative selectors - composeArea:",
        !!composeArea,
        "toolbar:",
        !!toolbar,
        "textarea:",
        !!textarea
      );

      if (composeArea) {
        targetElement = composeArea;
        console.log("Using compose area as target");
      } else if (toolbar) {
        targetElement = toolbar;
        console.log("Using toolbar as target");
      } else if (textarea) {
        targetElement = textarea.parentNode;
        console.log("Using textarea parent as target");
      } else {
        // Fallback: look for any container with message-related classes
        targetElement = document.querySelector(
          '[class*="message"], [class*="conversation"], [class*="chat"]'
        );
        console.log("Using fallback selector, found:", !!targetElement);
      }
    }

    if (!targetElement) {
      console.log(
        "Could not find message compose area. Extension may not work properly on this page."
      );
      console.log(
        "Available elements on page:",
        document.querySelectorAll("*").length
      );
      return;
    }

    // Check if button already exists
    if (document.getElementById("etsy-chatgpt-button")) {
      console.log("ChatGPT button already exists, skipping injection");
      return;
    }

    // Create the ChatGPT button
    const chatGPTButton = this.createChatGPTButton();
    console.log("Created ChatGPT button");

    // Insert the button into the target element
    if (targetElement) {
      try {
        // Try to insert after quick replies button if it exists
        if (
          quickRepliesButton &&
          quickRepliesButton.parentNode === targetElement
        ) {
          targetElement.insertBefore(
            chatGPTButton,
            quickRepliesButton.nextSibling
          );
          console.log("Inserted button after quick replies");
        } else {
          // Insert at the end of the container
          targetElement.appendChild(chatGPTButton);
          console.log("Appended button to target element");
        }
        console.log("ChatGPT button successfully injected!");

        // Add expand button right after the ChatGPT button
        this.injectExpandButtonNextToAI(targetElement, chatGPTButton);
      } catch (error) {
        console.error("Error injecting ChatGPT button:", error);
      }
    }
  }

  injectIntoComposeArea() {
    // Alternative method: Find the message compose toolbar
    const toolbar = document.querySelector(
      '[class*="compose-toolbar"], [class*="message-toolbar"], .wt-display-flex-xs'
    );

    if (toolbar && !document.getElementById("etsy-chatgpt-button")) {
      const chatGPTButton = this.createChatGPTButton();
      toolbar.appendChild(chatGPTButton);
    }
  }

  createChatGPTButton() {
    const button = document.createElement("button");
    button.id = "etsy-chatgpt-button";
    button.className = "wt-btn wt-btn--small wt-btn--transparent chatgpt-btn";
    button.setAttribute("type", "button");
    button.setAttribute("aria-label", "Generate AI reply");

    button.innerHTML = `
      <span class="chatgpt-btn-content">
        <svg class="chatgpt-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.2819 9.8211C23.1204 8.64942 23.1537 7.12509 22.3705 5.91878C21.5873 4.71247 20.1366 4.05465 18.6777 4.20431C18.2554 2.85544 17.1407 1.80619 15.7477 1.4187C14.3548 1.03121 12.8697 1.35509 11.7896 2.27696C10.7096 1.35509 9.22445 1.03121 7.8315 1.4187C6.43855 1.80619 5.32383 2.85544 4.90155 4.20431C3.44266 4.05465 1.99197 4.71247 1.20873 5.91878C0.425498 7.12509 0.458828 8.64942 1.29735 9.8211C0.458828 10.9928 0.425498 12.5171 1.20873 13.7234C1.99197 14.9297 3.44266 15.5876 4.90155 15.4379C5.32383 16.7868 6.43855 17.836 7.8315 18.2235C9.22445 18.611 10.7096 18.2871 11.7896 17.3652C12.8697 18.2871 14.3548 18.611 15.7477 18.2235C17.1407 17.836 18.2554 16.7868 18.6777 15.4379C20.1366 15.5876 21.5873 14.9297 22.3705 13.7234C23.1537 12.5171 23.1204 10.9928 22.2819 9.8211Z" fill="currentColor"/>
          <path d="M16.8531 10.2676C16.8531 13.1816 14.4961 15.5387 11.582 15.5387C8.66799 15.5387 6.31091 13.1816 6.31091 10.2676C6.31091 7.35352 8.66799 4.99644 11.582 4.99644C14.4961 4.99644 16.8531 7.35352 16.8531 10.2676Z" fill="white"/>
        </svg>
        <span class="chatgpt-btn-text">AI Reply</span>
      </span>
    `;

    button.addEventListener("click", () => this.handleChatGPTClick(""));

    return button;
  }

  async handleChatGPTClick(manualInstructions = "") {
    // Prevent multiple rapid clicks
    const button = document.getElementById("etsy-chatgpt-button");
    if (button && button.disabled) {
      return; // Already processing
    }

    // Check if API key is set
    if (!this.apiKey) {
      this.showApiKeyPrompt();
      return;
    }

    // Extract message history
    this.messageHistory = this.extractMessageHistory();

    if (this.messageHistory.length === 0) {
      this.showError("No message history found");
      return;
    }

    // Disable button and show loading state
    if (button) {
      button.disabled = true;
      button.style.opacity = "0.6";
      button.style.cursor = "not-allowed";
    }

    // Show loading modal
    this.showModal("loading");

    try {
      // Request ChatGPT response from background script
      const response = await chrome.runtime.sendMessage({
        action: "getChatGPTReply",
        messages: this.messageHistory,
        apiKey: this.apiKey,
        manualInstructions: manualInstructions,
      });

      if (response.error) {
        this.showError(response.error);
      } else {
        this.showModal("reply", response.reply);
      }
    } catch (error) {
      console.error("Error getting ChatGPT reply:", error);
      this.showError("Failed to generate reply. Please try again.");
    } finally {
      // Re-enable button
      if (button) {
        button.disabled = false;
        button.style.opacity = "1";
        button.style.cursor = "pointer";
      }
    }
  }

  extractNewStructureMessages() {
    const messages = [];
    const processedContent = new Set(); // Track processed message content to avoid duplicates

    // Look for the new Etsy message structure from the provided HTML
    // Messages are in containers with specific classes and structure
    // Use a broad selector but filter out duplicates by content
    const messageContainers = document.querySelectorAll(
      'div[class*="wt-pb-xs-1"], div[class*="padding-bottom-3px"]'
    );

    console.log("Found message containers:", messageContainers.length);

    messageContainers.forEach((container, index) => {
      // Look for the actual message content in spans with screen-reader-only labels
      const messageSpans = container.querySelectorAll(
        'span:not([class*="screen-reader-only"])'
      );
      const screenReaderSpans = container.querySelectorAll(
        'span[class*="screen-reader-only"]'
      );

      // Find the message content span that follows a "Message:" screen reader span
      let messageContent = "";
      let messageElement = null;

      for (let i = 0; i < screenReaderSpans.length; i++) {
        const srSpan = screenReaderSpans[i];
        if (srSpan.textContent?.trim() === "Message:") {
          // The next span should contain the actual message
          const nextSpan = srSpan.nextElementSibling;
          if (nextSpan && nextSpan.tagName === "SPAN") {
            messageContent = nextSpan.textContent?.trim() || "";
            messageElement = nextSpan;
            break;
          }
        }
      }

      // If we didn't find it via screen reader spans, try alternative methods
      if (!messageContent) {
        // Look for spans with message content directly
        for (const span of messageSpans) {
          const text = span.textContent?.trim();
          if (
            text &&
            text.length > 10 &&
            !text.includes("Message:") &&
            !text.match(/^\d{1,2}:\d{2}\s*[AP]M$/)
          ) {
            messageContent = text;
            messageElement = span;
            break;
          }
        }
      }

      if (messageContent && messageContent.length > 5) {
        // Determine if this is a seller or buyer message using avatar alt attributes
        // Customer messages have avatars with alt="Customer Name" (e.g., "Damon Sorrentino", "Carole Lyn")
        // Seller messages either have no customer avatar or have alt="Your account settings" or similar
        const avatarImg = container.querySelector("img[alt]");
        const avatarAlt = avatarImg?.getAttribute("alt") || "";
        const avatarSrc = avatarImg?.getAttribute("src") || "";

        console.log(
          `Avatar found: ${!!avatarImg}, Avatar alt: "${avatarAlt}", Avatar src: "${avatarSrc}"`
        );

        // Check if there's an avatar with a customer name (not seller)
        // Customer messages have alt attributes like "Damon Sorrentino", "Carole Lyn", etc.
        // Seller messages typically don't have customer names in alt attributes
        const hasCustomerAvatar =
          avatarAlt &&
          avatarAlt !== "" &&
          avatarAlt !== "Your account settings" &&
          !avatarAlt.toLowerCase().includes("benjamin") &&
          !avatarAlt.toLowerCase().includes("ben") &&
          avatarAlt.length > 3; // Customer names are typically longer than 3 chars

        // If there's a customer avatar, it's a buyer message
        // If no avatar or seller avatar, it's a seller message
        const role = hasCustomerAvatar ? "buyer" : "seller";

        console.log(
          `Avatar alt: "${avatarAlt}", Has customer avatar: ${hasCustomerAvatar}, Role determined: ${role}`
        );

        // Clean the message content
        const cleanedContent = this.cleanMessageContent(messageContent);

        if (cleanedContent && cleanedContent.length > 5) {
          // Check if we've already processed this exact message content
          if (processedContent.has(cleanedContent)) {
            console.log(
              "Skipping duplicate message:",
              cleanedContent.substring(0, 30) + "..."
            );
            return;
          }

          // Mark this content as processed
          processedContent.add(cleanedContent);

          messages.push({
            role: role,
            content: cleanedContent,
            timestamp: this.extractTimestamp(container),
            avatarSrc: hasCustomerAvatar ? avatarSrc : null, // Store avatar src for customer messages only
            element: container, // Store element reference for sorting
          });

          console.log(
            `Extracted message (${role}):`,
            cleanedContent.substring(0, 50) + "..."
          );
          console.log("Message container classes:", container.className);
        }
      }
    });

    // Sort messages by their position in the DOM to maintain chronological order
    messages.sort((a, b) => {
      const aElement = a.element;
      const bElement = b.element;

      if (!aElement || !bElement) return 0;

      const position = aElement.compareDocumentPosition(bElement);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    console.log("Messages sorted by DOM order. Final count:", messages.length);
    return messages;
  }

  extractTimestamp(container) {
    // Look for timestamp elements
    const timestampElements = container.querySelectorAll(
      '[class*="timestamp-color"], [class*="wt-text-caption"]'
    );

    for (const element of timestampElements) {
      const text = element.textContent?.trim();
      if (text && text.match(/\d{1,2}:\d{2}\s*[AP]M/)) {
        return text;
      }
    }

    return null;
  }

  cleanMessageContent(text) {
    if (!text) return "";

    // Remove common metadata and clean up the text
    return text
      .replace(/^\s*Message:\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  extractMessageHistory() {
    const messages = [];

    // Try the new Etsy message structure first (from the provided HTML)
    const newStructureMessages = this.extractNewStructureMessages();
    if (newStructureMessages.length > 0) {
      console.log(
        "Found messages using new structure:",
        newStructureMessages.length
      );
      return newStructureMessages;
    }

    // Fallback to old structure detection
    const messageSelectors = [
      '[class*="message"]',
      '[data-testid*="message"]',
      ".wt-text-body-01",
      '[class*="conversation-message"]',
      '[class*="chat-message"]',
      '[class*="bubble"]',
      '[role="listitem"]',
      'div[class*="wt-text"]',
    ];

    let messageElements = [];
    for (const selector of messageSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        messageElements = elements;
        break;
      }
    }

    // Function to clean and extract actual message content
    const cleanMessageContent = (text) => {
      if (!text) return "";

      // Remove common metadata patterns
      let cleaned = text
        // Remove date/time patterns
        .replace(/Date:\w{3},\s*\w{3}\s*\d{1,2}\d{1,2}:\d{2}pm\s*EDT/gi, "")
        .replace(/\d{1,2}:\d{2}\s*PM/gi, "")
        .replace(/\d{1,2}:\d{2}\s*AM/gi, "")
        .replace(/\d{1,2}:\d{2}pm\s*EDT/gi, "")
        .replace(/\d{1,2}:\d{2}am\s*EDT/gi, "")
        // Remove "Message:" prefix
        .replace(/^Message:\s*/gi, "")
        // Remove customer names at the start
        .replace(/^[A-Za-z\s]+\s*Date:/gi, "")
        // Remove URLs that are part of metadata
        .replace(/^www\.etsy\.com\/listing\/\d+\/[^\s]*/gi, "")
        .replace(/www\.etsy\.com\/listing\/\d+\/[^\s]*/gi, "")
        // Remove product info that gets concatenated
        .replace(/Acoustic Wall Art \| Geometric Wall Art\$[\d.]+/gi, "")
        // Remove standalone timestamps
        .replace(/^\d{1,2}:\d{2}\s*[AP]M\s*$/gi, "")
        // Remove patterns like "Best, Ben12:22 PM"
        .replace(/([A-Za-z]+),\s*[A-Za-z]+\d{1,2}:\d{2}\s*[AP]M/gi, "$1,")
        // Clean up multiple consecutive spaces
        .replace(/\s+/g, " ")
        .trim();

      // Additional cleanup for common concatenation issues
      cleaned = cleaned
        // Fix issues where message content gets concatenated with metadata
        .replace(/^([A-Za-z\s]+)Date:.*?Message:(.*)$/gi, "$2")
        .replace(/^([A-Za-z\s]+)www\.etsy\.com.*?Message:(.*)$/gi, "$2")
        // Remove any remaining standalone metadata
        .replace(/^\w{3},\s*\w{3}\s*\d{1,2}/gi, "")
        .replace(/^\d{1,2}:\d{2}\s*[AP]M/gi, "")
        .trim();

      return cleaned;
    };

    // Function to split concatenated messages
    const splitConcatenatedMessages = (text) => {
      if (!text) return [];

      const messages = [];

      // Look for specific patterns from the screenshots
      // Pattern: "Hello, I am looking for..." followed by "Message: Hi Pamela, Thank you for reaching out!"
      const specificPattern =
        /(Hello[^]*?interested[^]*?TX[^]*?)(Message:\s*Hi\s+[A-Za-z]+,[^]*)/gi;
      const specificMatch = specificPattern.exec(text);

      if (specificMatch && specificMatch[1] && specificMatch[2]) {
        const customerMessage = cleanMessageContent(specificMatch[1]);
        const sellerMessage = cleanMessageContent(specificMatch[2]);

        if (customerMessage.length > 10 && sellerMessage.length > 10) {
          messages.push(
            { content: customerMessage, role: "buyer" },
            { content: sellerMessage, role: "seller" }
          );
          return messages;
        }
      }

      // Try other common patterns
      const splitPatterns = [
        // Pattern: "Thank you" often indicates start of seller response
        /(.*?)(Thank\s+you[^]*)/gi,
        // Pattern: "Hi [Name]," often indicates start of new message
        /(.*?)(Hi\s+[A-Za-z]+,\s*[^]*)/gi,
        // Pattern: "Best," often indicates end of seller message
        /(.*?)(Best,\s*[A-Za-z]+[^]*)/gi,
      ];

      for (const pattern of splitPatterns) {
        const match = pattern.exec(text);
        if (match && match[1] && match[2]) {
          const firstPart = cleanMessageContent(match[1]);
          const secondPart = cleanMessageContent(match[2]);

          if (firstPart.length > 10 && secondPart.length > 10) {
            // Determine roles based on content
            const firstIsSeller =
              firstPart.toLowerCase().includes("thank you") ||
              firstPart.toLowerCase().includes("i can") ||
              firstPart.toLowerCase().includes("custom");

            messages.push(
              {
                content: firstIsSeller ? firstPart : firstPart,
                role: firstIsSeller ? "seller" : "buyer",
              },
              {
                content: secondPart,
                role: firstIsSeller ? "buyer" : "seller",
              }
            );
            return messages;
          }
        }
      }

      // If no clear patterns found, return as single message
      return [
        {
          content: cleanMessageContent(text),
          role: "buyer",
        },
      ];
    };

    // Function to check if an element is likely a UI element rather than a message
    const isUIElement = (element, text) => {
      // Check for common UI element indicators
      const uiIndicators = [
        "placeholder",
        "button",
        "input",
        "search",
        "toolbar",
        "menu",
        "dropdown",
        "modal",
        "overlay",
        "header",
        "footer",
        "nav",
        "sidebar",
      ];

      // Check element classes and parent classes
      const className = element.className?.toLowerCase() || "";
      const parentClassName =
        element.parentElement?.className?.toLowerCase() || "";

      return uiIndicators.some(
        (indicator) =>
          className.includes(indicator) ||
          parentClassName.includes(indicator) ||
          text.toLowerCase().includes(indicator)
      );
    };

    // Function to check if text looks like UI text rather than a message
    const isUIText = (text) => {
      const uiTextPatterns = [
        "who are you writing to",
        "what is this convo about",
        "don't forget to include a message",
        "type your reply",
        "search your messages",
        "auto-reply",
        "mark unread",
        "mark read",
        "report",
        "archive",
        "label",
        "trash",
        "quick replies",
        "ai reply",
        "chatgpt",
        "extension",
        "send",
        "cancel",
        "close",
        "submit",
        "loading",
        "please wait",
        "error",
        "success",
        "warning",
        "info",
        "help",
        "settings",
        "options",
        "preferences",
        "save",
        "delete",
        "edit",
        "copy",
        "paste",
        "undo",
        "redo",
      ];

      const lowerText = text.toLowerCase();
      return uiTextPatterns.some((pattern) => lowerText.includes(pattern));
    };

    messageElements.forEach((element) => {
      const rawText = element.textContent?.trim();

      // Debug logging
      if (rawText && rawText.length > 20) {
        console.log("Raw message text:", rawText);
      }

      // Skip empty messages and UI elements
      if (
        rawText &&
        rawText.length > 10 &&
        !isUIElement(element, rawText) &&
        !isUIText(rawText) &&
        !element.closest('[class*="toolbar"]') &&
        !element.closest('[class*="compose"]') &&
        !element.closest('[class*="input"]') &&
        !element.closest('[class*="placeholder"]') &&
        !element.closest('[class*="search"]') &&
        !element.closest('[role="searchbox"]') &&
        !element.closest('[role="textbox"]') &&
        !element.closest("input") &&
        !element.closest("textarea")
      ) {
        // Try to split concatenated messages first
        const splitMessages = splitConcatenatedMessages(rawText);

        if (splitMessages.length > 1) {
          // Multiple messages found in this element
          console.log("Split messages:", splitMessages);
          messages.push(...splitMessages);
        } else {
          // Single message, try to determine if it's sent or received
          const cleanedText = cleanMessageContent(rawText);

          if (cleanedText && cleanedText.length > 10) {
            const isOutgoing =
              element.closest('[class*="outgoing"]') ||
              element.closest('[class*="sent"]') ||
              element.closest('[class*="seller"]') ||
              element.closest('[class*="you"]') ||
              element.getAttribute("aria-label")?.includes("You") ||
              element.classList.contains("outgoing") ||
              element.classList.contains("sent");

            // Additional check: look for visual indicators
            const isSellerMessage =
              element.style.textAlign === "right" ||
              element.closest('[style*="text-align: right"]');

            const role = isOutgoing || isSellerMessage ? "seller" : "buyer";

            messages.push({
              role: role,
              content: cleanedText,
            });
          }
        }
      }
    });

    // If no messages found with selectors, try to find any text content that looks like messages
    if (messages.length === 0) {
      const allTextElements = document.querySelectorAll("div, span, p");
      allTextElements.forEach((element) => {
        const rawText = element.textContent?.trim();
        const cleanedText = cleanMessageContent(rawText);

        if (
          cleanedText &&
          cleanedText.length > 20 &&
          cleanedText.length < 1000 &&
          !isUIElement(element, cleanedText) &&
          !isUIText(cleanedText)
        ) {
          // Check if this looks like a message (contains typical message patterns)
          if (
            cleanedText.match(
              /^(hi|hello|thank|please|when|how|what|where|can|could|would)/i
            ) ||
            cleanedText.includes("?") ||
            cleanedText.includes("!") ||
            cleanedText.length > 30
          ) {
            messages.push({
              role: "buyer", // Default to buyer if we can't determine
              content: cleanedText,
            });
          }
        }
      });
    }

    return messages;
  }

  showApiKeyPrompt() {
    const message =
      "Please set your OpenAI API key in the extension settings (click the extension icon in the toolbar).";
    this.showModal("error", message);
  }

  showError(errorMessage) {
    this.showModal("error", errorMessage);
  }

  showModal(type, content = "") {
    // Remove existing modal if present
    if (this.modal) {
      this.modal.remove();
    }

    // Store original content for reset functionality
    this.originalContent = content;

    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "etsy-chatgpt-modal-overlay";
    modalOverlay.id = "etsy-chatgpt-modal";

    let modalContent = "";

    if (type === "loading") {
      modalContent = `
        <div class="etsy-chatgpt-modal">
          <div class="modal-header">
            <h3>Generating AI Reply</h3>
          </div>
          <div class="modal-body">
            <div class="loading-spinner"></div>
            <p>ChatGPT is analyzing the conversation...</p>
          </div>
        </div>
      `;
    } else if (type === "reply") {
      modalContent = `
        <div class="etsy-chatgpt-modal">
          <div class="modal-header">
            <h3>Suggested Reply</h3>
            <button class="modal-close" id="modal-close-btn" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="reply-editor">
              <div class="instructions-section">
                <label for="ai-instructions-quick" class="instructions-label">Manual Instructions (Optional)</label>
                <textarea 
                  id="ai-instructions-quick" 
                  class="instructions-textarea" 
                  rows="2" 
                  placeholder="e.g., 'Tell the customer that I can create their request for an additional $150 charge'"
                ></textarea>
              </div>
              <div class="response-section">
                <label for="reply-textarea" class="editor-label">AI Generated Response:</label>
                <textarea 
                  id="reply-textarea" 
                  class="reply-textarea" 
                  rows="6" 
                  placeholder="AI-generated reply will appear here..."
                >${this.escapeHtml(content)}</textarea>
                <div class="editor-actions">
                  <button class="btn-small btn-secondary" id="reset-btn">Reset to Original</button>
                  <button class="btn-small btn-secondary" id="regenerate-btn">🔄 Regenerate</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="modal-reject-btn">Cancel</button>
            <button class="btn-primary" id="modal-accept-btn">Insert Reply</button>
          </div>
        </div>
      `;
    } else if (type === "error") {
      modalContent = `
        <div class="etsy-chatgpt-modal">
          <div class="modal-header">
            <h3>Error</h3>
            <button class="modal-close" id="modal-close-btn" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p class="error-message">${this.escapeHtml(content)}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" id="modal-close-btn-2">Close</button>
          </div>
        </div>
      `;
    }

    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);
    this.modal = modalOverlay;

    // Add event listeners
    setTimeout(() => {
      modalOverlay.classList.add("show");

      const closeBtn = document.getElementById("modal-close-btn");
      const closeBtn2 = document.getElementById("modal-close-btn-2");
      const rejectBtn = document.getElementById("modal-reject-btn");
      const acceptBtn = document.getElementById("modal-accept-btn");
      const resetBtn = document.getElementById("reset-btn");
      const regenerateBtn = document.getElementById("regenerate-btn");
      const textarea = document.getElementById("reply-textarea");

      if (closeBtn) closeBtn.addEventListener("click", () => this.closeModal());
      if (closeBtn2)
        closeBtn2.addEventListener("click", () => this.closeModal());
      if (rejectBtn)
        rejectBtn.addEventListener("click", () => this.closeModal());
      if (acceptBtn)
        acceptBtn.addEventListener("click", () => this.acceptEditedReply());

      // Handle reset button
      if (resetBtn) {
        resetBtn.addEventListener("click", () => this.resetToOriginal());
      }

      // Handle regenerate button
      if (regenerateBtn) {
        regenerateBtn.addEventListener("click", async () => {
          regenerateBtn.disabled = true;
          regenerateBtn.innerHTML = "🔄 Generating...";
          try {
            const messages = this.extractMessageHistory();
            const manualInstructions = document
              .getElementById("ai-instructions-quick")
              .value.trim();
            const newReply = await this.regenerateReply(
              messages,
              manualInstructions
            );
            const textarea = document.getElementById("reply-textarea");
            if (newReply && textarea) {
              textarea.value = newReply;
              textarea.focus();
              textarea.setSelectionRange(newReply.length, newReply.length);
            }
          } catch (error) {
            console.error("Error regenerating reply:", error);
            alert("Error regenerating reply. Please try again.");
          } finally {
            regenerateBtn.disabled = false;
            regenerateBtn.innerHTML = "🔄 Regenerate";
          }
        });
      }

      // Focus textarea when modal opens and auto-resize
      if (textarea && type === "reply") {
        textarea.focus();
        // Place cursor at the end instead of selecting all text
        textarea.setSelectionRange(
          textarea.value.length,
          textarea.value.length
        );

        // Auto-resize textarea to fit content
        this.autoResizeTextarea(textarea);

        // Auto-resize on input
        textarea.addEventListener("input", () => {
          this.autoResizeTextarea(textarea);
        });
      }

      // Close on overlay click
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          this.closeModal();
        }
      });

      // Close on Escape key
      const escHandler = (e) => {
        if (e.key === "Escape") {
          this.closeModal();
          document.removeEventListener("keydown", escHandler);
        }
      };
      document.addEventListener("keydown", escHandler);
    }, 10);
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove("show");
      setTimeout(() => {
        this.modal.remove();
        this.modal = null;
      }, 300);
    }
  }

  acceptEditedReply() {
    console.log("acceptEditedReply called");
    // Get the edited content from the textarea
    const replyTextarea = document.getElementById("reply-textarea");
    if (!replyTextarea) {
      console.error("Could not find reply textarea");
      this.showError("Could not find reply textarea");
      return;
    }

    const editedReply = replyTextarea.value.trim();
    if (!editedReply) {
      console.error("Reply is empty");
      this.showError("Reply cannot be empty");
      return;
    }

    console.log(
      "Calling acceptReply with:",
      editedReply.substring(0, 50) + "..."
    );
    this.acceptReply(editedReply);
  }

  resetToOriginal() {
    const replyTextarea = document.getElementById("reply-textarea");
    if (replyTextarea && this.originalContent) {
      replyTextarea.value = this.originalContent;
      replyTextarea.focus();
      // Place cursor at the end instead of selecting all text
      replyTextarea.setSelectionRange(
        replyTextarea.value.length,
        replyTextarea.value.length
      );
      // Auto-resize after reset
      this.autoResizeTextarea(replyTextarea);
    }
  }

  async regenerateReply(messages = null, manualInstructions = "") {
    // Use provided messages or fall back to stored message history
    const messagesToUse = messages || this.messageHistory;

    // Show loading state
    const regenerateBtn = document.getElementById("regenerate-btn");
    const replyTextarea = document.getElementById("reply-textarea");

    if (regenerateBtn) {
      regenerateBtn.disabled = true;
      regenerateBtn.textContent = "🔄 Generating...";
    }

    try {
      // Request new ChatGPT response
      const response = await chrome.runtime.sendMessage({
        action: "getChatGPTReply",
        messages: messagesToUse,
        apiKey: this.apiKey,
        manualInstructions: manualInstructions,
      });

      if (response.error) {
        this.showError(response.error);
        return null;
      } else {
        // Update the textarea with new content
        if (replyTextarea) {
          replyTextarea.value = response.reply;
          replyTextarea.focus();
          // Place cursor at the end instead of selecting all text
          replyTextarea.setSelectionRange(
            replyTextarea.value.length,
            replyTextarea.value.length
          );
          // Auto-resize for new content
          this.autoResizeTextarea(replyTextarea);
        }
        // Update original content
        this.originalContent = response.reply;
        return response.reply;
      }
    } catch (error) {
      console.error("Error regenerating reply:", error);
      this.showError("Failed to regenerate reply. Please try again.");
      return null;
    } finally {
      // Reset button state
      if (regenerateBtn) {
        regenerateBtn.disabled = false;
        regenerateBtn.textContent = "🔄 Regenerate";
      }
    }
  }

  acceptReply(replyText) {
    // Find the message textarea using multiple selectors
    const textareaSelectors = [
      'textarea[id*="message"]', // Etsy-specific selectors
      'textarea[class*="new-message-textarea"]',
      'textarea[class*="wt-textarea"]',
      'textarea[placeholder*="reply"]',
      'textarea[placeholder*="message"]',
      'textarea[name*="message"]',
      'textarea[class*="compose"]',
      'textarea[class*="input"]',
      'textarea[class*="conversation"]',
      'textarea[class*="reply"]',
      "textarea",
      '[contenteditable="true"]',
      '[role="textbox"]',
    ];

    let textarea = null;
    for (const selector of textareaSelectors) {
      textarea = document.querySelector(selector);
      if (textarea) {
        console.log(`Found textarea with selector: ${selector}`);
        break;
      }
    }

    console.log(
      "Textarea found:",
      !!textarea,
      "Selectors tried:",
      textareaSelectors.length
    );

    if (textarea) {
      // Handle different types of input elements
      if (textarea.tagName === "TEXTAREA") {
        // Regular textarea
        textarea.value = replyText;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        // ContentEditable div or other element
        textarea.textContent = replyText;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("keyup", { bubbles: true }));
      }

      // Focus the element
      textarea.focus();

      this.closeModal();
    } else {
      this.showError(
        "Could not find message input field. Please try typing in the message box first."
      );
    }
  }

  autoResizeTextarea(textarea) {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Set height to scrollHeight to fit content
    const newHeight = Math.max(textarea.scrollHeight, 200); // Minimum 200px
    textarea.style.height = newHeight + "px";
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  injectExpandButtonNextToAI(targetElement, aiButton) {
    console.log("Attempting to inject expand button next to AI button...");

    // Check if button already exists
    if (document.getElementById("etsy-expand-button")) {
      console.log("Expand button already exists, skipping injection");
      return;
    }

    // Create expand button
    const expandButton = document.createElement("button");
    expandButton.id = "etsy-expand-button";
    expandButton.className = "etsy-expand-btn-inline";
    expandButton.setAttribute("type", "button");
    expandButton.setAttribute("aria-label", "Expand conversation");
    expandButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    expandButton.addEventListener("click", () => this.openExpandModal());

    // Insert right after the AI button
    try {
      aiButton.parentNode.insertBefore(expandButton, aiButton.nextSibling);
      console.log("Expand button successfully injected next to AI button!");
    } catch (error) {
      console.error("Error injecting expand button:", error);
    }
  }

  injectExpandButton() {
    console.log("Attempting to inject expand button...");

    // Check if button already exists
    if (document.getElementById("etsy-expand-button")) {
      console.log("Expand button already exists, skipping injection");
      return;
    }

    // Find the message area container
    const messageArea = document.querySelector(
      '[class*="conversation"], [class*="message-thread"], [class*="messages"]'
    );

    if (!messageArea) {
      console.log("Could not find message area for expand button");
      return;
    }

    // Create expand button
    const expandButton = document.createElement("button");
    expandButton.id = "etsy-expand-button";
    expandButton.className = "etsy-expand-btn";
    expandButton.setAttribute("type", "button");
    expandButton.setAttribute("aria-label", "Expand conversation");
    expandButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    expandButton.addEventListener("click", () => this.openExpandModal());

    // Append to message area
    messageArea.style.position = "relative";
    messageArea.appendChild(expandButton);
    console.log("Expand button successfully injected!");
  }

  openExpandModal() {
    // Check if API key is set
    if (!this.apiKey) {
      this.showApiKeyPrompt();
      return;
    }

    // Extract message history
    this.messageHistory = this.extractMessageHistory();

    // Debug: Log extracted messages
    console.log("Extracted message history:", this.messageHistory);

    // Create expand modal
    this.showExpandModal();
  }

  showExpandModal() {
    // Remove existing expand modal if present
    if (this.expandModal) {
      this.expandModal.remove();
    }

    // Create modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "etsy-expand-modal-overlay";
    modalOverlay.id = "etsy-expand-modal";

    // Add date header like Etsy shows
    const today = new Date();
    const dateHeader = today.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const conversationHtml = `
      <div class="conversation-date-header">${dateHeader}</div>
      ${this.messageHistory
        .map((msg, index) => {
          const isSeller = msg.role === "seller";

          // Use extracted timestamp if available, otherwise use current time
          const timestamp =
            msg.timestamp ||
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

          if (isSeller) {
            // Seller message - no avatar
            return `
              <div class="expand-message seller-message">
                <div class="message-info">
                  <div class="message-content">${this.escapeHtml(
                    msg.content
                  )}</div>
                  <div class="message-timestamp">${timestamp}</div>
                </div>
              </div>
            `;
          } else {
            // Customer message - use extracted avatar or fallback
            const avatarHtml = msg.avatarSrc
              ? `<img src="${msg.avatarSrc}" alt="Customer" class="customer-avatar-img" />`
              : '<div class="message-avatar-fallback">C</div>';

            return `
              <div class="expand-message buyer-message">
                <div class="message-avatar">${avatarHtml}</div>
                <div class="message-info">
                  <div class="message-content">${this.escapeHtml(
                    msg.content
                  )}</div>
                  <div class="message-timestamp">${timestamp}</div>
                </div>
              </div>
            `;
          }
        })
        .join("")}
    `;

    modalOverlay.innerHTML = `
      <div class="etsy-expand-modal">
        <div class="expand-modal-header">
          <h3>Conversation</h3>
          <button class="modal-close" id="expand-modal-close-btn" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="expand-modal-content">
          <div class="conversation-panel">
            <div class="conversation-messages" id="conversation-messages">
              ${
                conversationHtml ||
                '<p class="no-messages">No messages found</p>'
              }
            </div>
          </div>
          <div class="ai-panel">
            <div class="ai-panel-header">
              <h4>AI Response</h4>
              <button class="btn-generate" id="generate-ai-response">Generate Reply</button>
            </div>
            <div class="ai-response-area">
              <div class="ai-instructions-section">
                <label for="ai-instructions" class="instructions-label">Manual Instructions (Optional)</label>
                <textarea 
                  id="ai-instructions" 
                  class="ai-instructions-textarea" 
                  placeholder="e.g., 'Tell the customer that I can create their request for an additional $150 charge'"
                  rows="3"
                ></textarea>
              </div>
              <div class="ai-generated-section">
                <label for="ai-response-textarea" class="response-label">AI Generated Response</label>
                <textarea 
                  id="ai-response-textarea" 
                  class="ai-response-textarea" 
                  placeholder="Click 'Generate Reply' to create an AI-powered response..."
                  rows="8"
                ></textarea>
                <div class="ai-actions">
                  <button class="btn-small btn-secondary" id="expand-regenerate-btn" disabled>🔄 Regenerate</button>
                  <button class="btn-small btn-secondary" id="expand-reset-btn" disabled>Reset</button>
                </div>
              </div>
            </div>
            <div class="ai-panel-footer">
              <button class="btn-secondary" id="expand-cancel-btn">Cancel</button>
              <button class="btn-primary" id="expand-insert-btn" disabled>Insert Reply</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);
    this.expandModal = modalOverlay;

    // Add event listeners
    setTimeout(() => {
      modalOverlay.classList.add("show");

      const closeBtn = document.getElementById("expand-modal-close-btn");
      const cancelBtn = document.getElementById("expand-cancel-btn");
      const generateBtn = document.getElementById("generate-ai-response");
      const insertBtn = document.getElementById("expand-insert-btn");
      const regenerateBtn = document.getElementById("expand-regenerate-btn");
      const resetBtn = document.getElementById("expand-reset-btn");
      const textarea = document.getElementById("ai-response-textarea");

      if (closeBtn)
        closeBtn.addEventListener("click", () => this.closeExpandModal());
      if (cancelBtn)
        cancelBtn.addEventListener("click", () => this.closeExpandModal());
      if (generateBtn)
        generateBtn.addEventListener("click", () => this.generateExpandReply());
      if (insertBtn)
        insertBtn.addEventListener("click", () => this.insertExpandReply());
      if (regenerateBtn)
        regenerateBtn.addEventListener("click", () =>
          this.regenerateExpandReply()
        );
      if (resetBtn)
        resetBtn.addEventListener("click", () => this.resetExpandReply());

      // Close on overlay click
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          this.closeExpandModal();
        }
      });

      // Close on Escape key
      const escHandler = (e) => {
        if (e.key === "Escape") {
          this.closeExpandModal();
          document.removeEventListener("keydown", escHandler);
        }
      };
      document.addEventListener("keydown", escHandler);

      // Auto-scroll conversation to bottom
      const conversationMessages = document.getElementById(
        "conversation-messages"
      );
      if (conversationMessages) {
        conversationMessages.scrollTop = conversationMessages.scrollHeight;
      }
    }, 10);
  }

  closeExpandModal() {
    if (this.expandModal) {
      this.expandModal.classList.remove("show");
      setTimeout(() => {
        this.expandModal.remove();
        this.expandModal = null;
      }, 300);
    }
  }

  async generateExpandReply() {
    const generateBtn = document.getElementById("generate-ai-response");
    const textarea = document.getElementById("ai-response-textarea");
    const instructionsTextarea = document.getElementById("ai-instructions");
    const insertBtn = document.getElementById("expand-insert-btn");
    const regenerateBtn = document.getElementById("expand-regenerate-btn");
    const resetBtn = document.getElementById("expand-reset-btn");

    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.textContent = "Generating...";
    }

    try {
      // Get manual instructions if provided
      const manualInstructions = instructionsTextarea?.value?.trim() || "";

      const response = await chrome.runtime.sendMessage({
        action: "getChatGPTReply",
        messages: this.messageHistory,
        apiKey: this.apiKey,
        manualInstructions: manualInstructions,
      });

      if (response.error) {
        this.showError(response.error);
      } else {
        if (textarea) {
          textarea.value = response.reply;
          this.expandOriginalContent = response.reply;
          textarea.focus();
        }
        if (insertBtn) insertBtn.disabled = false;
        if (regenerateBtn) regenerateBtn.disabled = false;
        if (resetBtn) resetBtn.disabled = false;
      }
    } catch (error) {
      console.error("Error generating reply:", error);
      this.showError("Failed to generate reply. Please try again.");
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate Reply";
      }
    }
  }

  async regenerateExpandReply() {
    const regenerateBtn = document.getElementById("expand-regenerate-btn");
    const textarea = document.getElementById("ai-response-textarea");
    const instructionsTextarea = document.getElementById("ai-instructions");

    if (regenerateBtn) {
      regenerateBtn.disabled = true;
      regenerateBtn.textContent = "🔄 Generating...";
    }

    try {
      // Get manual instructions if provided
      const manualInstructions = instructionsTextarea?.value?.trim() || "";

      const response = await chrome.runtime.sendMessage({
        action: "getChatGPTReply",
        messages: this.messageHistory,
        apiKey: this.apiKey,
        manualInstructions: manualInstructions,
      });

      if (response.error) {
        this.showError(response.error);
      } else {
        if (textarea) {
          textarea.value = response.reply;
          this.expandOriginalContent = response.reply;
          textarea.focus();
        }
      }
    } catch (error) {
      console.error("Error regenerating reply:", error);
      this.showError("Failed to regenerate reply. Please try again.");
    } finally {
      if (regenerateBtn) {
        regenerateBtn.disabled = false;
        regenerateBtn.textContent = "🔄 Regenerate";
      }
    }
  }

  resetExpandReply() {
    const textarea = document.getElementById("ai-response-textarea");
    if (textarea && this.expandOriginalContent) {
      textarea.value = this.expandOriginalContent;
      textarea.focus();
    }
  }

  insertExpandReply() {
    console.log("insertExpandReply called");
    const textarea = document.getElementById("ai-response-textarea");
    if (!textarea || !textarea.value.trim()) {
      console.error("No textarea or empty content");
      this.showError("Please generate a reply first");
      return;
    }

    console.log(
      "Calling acceptReply with:",
      textarea.value.trim().substring(0, 50) + "..."
    );
    this.acceptReply(textarea.value.trim());
    this.closeExpandModal();
  }
}

// Initialize the extension with multiple strategies
let etsyChatPlus = null;

// Strategy 1: Initialize immediately if DOM is ready
if (document.readyState === "loading") {
  console.log("DOM still loading, waiting for DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded fired, initializing extension...");
    etsyChatPlus = new EtsyChatPlus();
  });
} else {
  console.log("DOM already ready, initializing extension immediately...");
  etsyChatPlus = new EtsyChatPlus();
}

// Strategy 2: Also try initializing on window load as a fallback
window.addEventListener("load", () => {
  if (!etsyChatPlus) {
    console.log("Window load fired, initializing extension as fallback...");
    etsyChatPlus = new EtsyChatPlus();
  }
});
