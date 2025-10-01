// Debug script to help identify Etsy page elements
// Run this in the browser console on an Etsy conversation page

console.log("=== Etsy Chat+ Debug Info ===");

// Check for various selectors
const selectors = [
  '[aria-label="Quick replies"]',
  '[class*="compose"]',
  '[class*="message-input"]',
  '[class*="conversation-input"]',
  '[class*="toolbar"]',
  '[class*="compose-toolbar"]',
  '[class*="message-toolbar"]',
  'textarea[placeholder*="message"]',
  'textarea[name*="message"]',
  "textarea",
  '[contenteditable="true"]',
  '[role="textbox"]',
  '[class*="message"]',
  '[class*="conversation"]',
  '[class*="chat"]',
  '[data-clg-id="WtButton"]',
];

console.log("Checking selectors:");
selectors.forEach((selector) => {
  const elements = document.querySelectorAll(selector);
  console.log(`${selector}: ${elements.length} elements found`);
  if (elements.length > 0 && elements.length < 10) {
    elements.forEach((el, i) => {
      console.log(
        `  [${i}]`,
        el.tagName,
        el.className,
        el.textContent?.substring(0, 50)
      );
    });
  }
});

// Look for buttons specifically
console.log("\nAll buttons on page:");
const buttons = document.querySelectorAll("button");
buttons.forEach((btn, i) => {
  if (i < 20) {
    // Limit output
    console.log(
      `Button ${i}:`,
      btn.textContent?.trim() || btn.ariaLabel || btn.className
    );
  }
});

// Look for textareas
console.log("\nAll textareas on page:");
const textareas = document.querySelectorAll("textarea");
textareas.forEach((ta, i) => {
  console.log(`Textarea ${i}:`, ta.placeholder || ta.name || ta.className);
});

// Look for elements with "message" in class name
console.log("\nElements with 'message' in class name:");
const messageElements = document.querySelectorAll('[class*="message"]');
messageElements.forEach((el, i) => {
  if (i < 20) {
    console.log(
      `Message element ${i}:`,
      el.tagName,
      el.className,
      el.textContent?.substring(0, 100)
    );
  }
});

console.log("\n=== Debug complete ===");
console.log("Copy this output and share it to help debug the extension!");
