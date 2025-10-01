// Content script for Etsy Chat+ extension
// Injects ChatGPT button into Etsy conversation page

class EtsyChatPlus {
  constructor() {
    this.apiKey = null;
    this.modal = null;
    this.messageHistory = [];
    this.init();
  }

  async init() {
    console.log("Etsy Chat+ extension initialized");

    // Load API key from storage
    const result = await chrome.storage.sync.get(["openai_api_key"]);
    this.apiKey = result.openai_api_key;

    // Wait for the page to fully load and find the reply area
    this.waitForElement('[data-clg-id="WtButton"]', () => {
      console.log("Found Etsy interface elements, injecting ChatGPT button...");
      this.injectChatGPTButton();
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "apiKeyUpdated") {
        this.apiKey = request.apiKey;
      }
    });
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

    button.addEventListener("click", () => this.handleChatGPTClick());

    return button;
  }

  async handleChatGPTClick() {
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

  extractMessageHistory() {
    const messages = [];

    // Find all message elements in the conversation - try multiple selectors
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

    messageElements.forEach((element) => {
      const text = element.textContent?.trim();

      // Skip empty messages and UI elements
      if (
        text &&
        text.length > 10 &&
        !text.includes("Quick replies") &&
        !text.includes("AI Reply") &&
        !text.includes("ChatGPT") &&
        !text.includes("Extension") &&
        !element.closest('[class*="toolbar"]') &&
        !element.closest('[class*="compose"]')
      ) {
        // Try to determine if it's sent or received using multiple methods
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
          content: text,
        });
      }
    });

    // If no messages found with selectors, try to find any text content that looks like messages
    if (messages.length === 0) {
      const allTextElements = document.querySelectorAll("div, span, p");
      allTextElements.forEach((element) => {
        const text = element.textContent?.trim();
        if (
          text &&
          text.length > 20 &&
          text.length < 1000 &&
          !text.includes("Quick replies") &&
          !text.includes("AI Reply")
        ) {
          // Check if this looks like a message (contains typical message patterns)
          if (
            text.match(
              /^(hi|hello|thank|please|when|how|what|where|can|could|would)/i
            ) ||
            text.includes("?") ||
            text.includes("!") ||
            text.length > 30
          ) {
            messages.push({
              role: "buyer", // Default to buyer if we can't determine
              content: text,
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
              <label for="reply-textarea" class="editor-label">Edit your reply:</label>
              <textarea 
                id="reply-textarea" 
                class="reply-textarea" 
                rows="8" 
                placeholder="AI-generated reply will appear here..."
              >${this.escapeHtml(content)}</textarea>
              <div class="editor-actions">
                <button class="btn-small btn-secondary" id="reset-btn">Reset to Original</button>
                <button class="btn-small btn-secondary" id="regenerate-btn">🔄 Regenerate</button>
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
        regenerateBtn.addEventListener("click", () => this.regenerateReply());
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
    // Get the edited content from the textarea
    const replyTextarea = document.getElementById("reply-textarea");
    if (!replyTextarea) {
      this.showError("Could not find reply textarea");
      return;
    }

    const editedReply = replyTextarea.value.trim();
    if (!editedReply) {
      this.showError("Reply cannot be empty");
      return;
    }

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

  async regenerateReply() {
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
        messages: this.messageHistory,
        apiKey: this.apiKey,
      });

      if (response.error) {
        this.showError(response.error);
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
      }
    } catch (error) {
      console.error("Error regenerating reply:", error);
      this.showError("Failed to regenerate reply. Please try again.");
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
      'textarea[name*="message"]',
      'textarea[placeholder*="message"]',
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
        break;
      }
    }

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
}

// Initialize the extension
const etsyChatPlus = new EtsyChatPlus();
