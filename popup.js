// Popup script for Etsy Chat+ extension settings

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("settingsForm");
  const apiKeyInput = document.getElementById("apiKey");
  const saveBtn = document.getElementById("saveBtn");
  const statusMessage = document.getElementById("statusMessage");
  const toggleBtn = document.getElementById("toggleApiKey");
  const eyeIcon = document.getElementById("eyeIcon");

  // Load saved API key
  const result = await chrome.storage.sync.get(["openai_api_key"]);
  if (result.openai_api_key) {
    apiKeyInput.value = result.openai_api_key;
  }

  // Toggle API key visibility
  let isVisible = false;
  toggleBtn.addEventListener("click", () => {
    isVisible = !isVisible;
    apiKeyInput.type = isVisible ? "text" : "password";

    if (isVisible) {
      eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
    } else {
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
    }
  });

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus("Please enter your API key", "error");
      return;
    }

    // Validate API key format
    if (!apiKey.startsWith("sk-")) {
      showStatus('Invalid API key format. It should start with "sk-"', "error");
      return;
    }

    // Disable button while saving
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      // Test the API key with a simple request
      const testResponse = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (testResponse.status === 401) {
        showStatus("Invalid API key. Please check and try again.", "error");
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Settings";
        return;
      }

      // Save the API key
      await chrome.storage.sync.set({ openai_api_key: apiKey });

      showStatus("Settings saved successfully! ✓", "success");

      // Reset button after delay
      setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Settings";
      }, 1000);
    } catch (error) {
      console.error("Error saving settings:", error);
      showStatus("Error saving settings. Please try again.", "error");
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Settings";
    }
  });

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;

    // Auto-hide success messages after 3 seconds
    if (type === "success") {
      setTimeout(() => {
        statusMessage.className = "status-message";
      }, 3000);
    }
  }

  // Add input validation feedback
  apiKeyInput.addEventListener("input", () => {
    if (statusMessage.classList.contains("error")) {
      statusMessage.className = "status-message";
    }
  });

  // Handle Enter key in input
  apiKeyInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      form.dispatchEvent(new Event("submit"));
    }
  });
});
