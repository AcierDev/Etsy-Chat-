# ⚡ Etsy Chat+ - AI-Powered Reply Assistant

A Chrome extension that enhances Etsy's messaging system with AI-powered reply suggestions using ChatGPT. Generate professional, friendly, and contextual responses to customer messages with just one click.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **🤖 AI-Powered Replies**: Generate intelligent, context-aware responses using ChatGPT
- **🎨 Clean UI**: Minimalist design that integrates seamlessly with Etsy's interface
- **✨ Smooth Animations**: Beautiful modal animations for a delightful user experience
- **👁️ Preview & Edit**: Review AI-generated replies before sending
- **🔒 Secure**: Your API key is stored locally and never shared
- **⚡ Fast**: Quick responses powered by GPT-4o-mini
- **📱 Responsive**: Works on all screen sizes

## 🚀 Installation

### Step 1: Download the Extension

1. Clone or download this repository to your local machine
2. Unzip the folder if downloaded as ZIP

### Step 2: Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy your API key (starts with `sk-`)
5. **Important**: Keep this key secure and never share it

### Step 3: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `Etsy Chat+` folder
5. The extension icon should appear in your toolbar

### Step 4: Configure Extension

1. Click the Etsy Chat+ extension icon in your Chrome toolbar
2. Paste your OpenAI API key in the input field
3. Click "Save Settings"
4. You're all set! 🎉

## 📖 How to Use

1. **Navigate to Etsy Messages**: Go to any conversation at `https://www.etsy.com/your/conversations/`

2. **Find the AI Reply Button**: Look for the purple "AI Reply" button next to the Quick Replies button below the message input box

3. **Generate Reply**:

   - Click the "AI Reply" button
   - The extension will analyze the conversation history
   - ChatGPT will generate a suggested reply

4. **Review & Edit**:

   - A modal will appear with the suggested reply in an editable textarea
   - Edit the message to add your personal touch
   - Use "Reset to Original" to restore the AI version
   - Use "🔄 Regenerate" to get a new AI suggestion
   - Click "Insert Reply" to add it to your message box
   - Or click "Cancel" to dismiss it

5. **Edit & Send**:
   - Edit the reply if needed
   - Send the message as you normally would

## 🎯 Use Cases

Perfect for:

- **Customer Service**: Quickly respond to common questions
- **Order Updates**: Generate professional shipping and order status messages
- **Problem Resolution**: Craft empathetic responses to customer concerns
- **General Inquiries**: Handle product questions efficiently
- **Thank You Messages**: Express gratitude professionally

## 🔧 Technical Details

### Files Structure

```
Etsy Chat+/
├── manifest.json         # Extension configuration
├── content.js           # Main script (injects button, handles UI)
├── background.js        # Service worker (API communication)
├── popup.html          # Extension settings popup
├── popup.js            # Settings popup logic
├── styles.css          # Clean, minimalist styling
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

### Permissions

The extension requires:

- `activeTab`: To access Etsy conversation pages
- `storage`: To securely store your API key
- Host permissions for `etsy.com` and `api.openai.com`

### API Usage

- Uses OpenAI's GPT-4o-mini model for cost-effectiveness
- Each reply costs approximately $0.0001-0.0003 USD
- API calls are made only when you click the AI Reply button
- No data is stored or transmitted except to OpenAI's API

## 🎨 Customization

### Change AI Model

Edit `background.js` line ~33:

```javascript
model: 'gpt-4o-mini', // Change to 'gpt-4' for better quality
```

### Adjust Response Length

Edit `background.js` line ~36:

```javascript
max_tokens: 500, // Increase for longer replies
```

### Modify AI Tone

Edit the system message in `background.js` starting at line ~60 to customize the AI's personality and response style.

## 🛠️ Development

### Prerequisites

- Chrome browser
- OpenAI API key
- Basic understanding of Chrome extensions

### Making Changes

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the reload icon on the Etsy Chat+ extension
4. Test your changes on an Etsy conversation page

### Debugging

- Open Chrome DevTools on Etsy pages (F12)
- Check Console for errors
- View Network tab for API calls
- Use `chrome://extensions/` to view background script logs

## ⚠️ Important Notes

1. **API Costs**: You are responsible for OpenAI API usage costs
2. **Rate Limits**: Respect OpenAI's rate limits
3. **Privacy**: Never share your API key
4. **Content Review**: Always review AI-generated content before sending
5. **Etsy Policies**: Ensure all messages comply with Etsy's seller policies

## 🐛 Troubleshooting

### Button Not Appearing

- Refresh the Etsy conversation page
- Check that you're on a conversation page (`/your/conversations/`)
- Ensure extension is enabled in Chrome

### API Errors

- Verify your API key is correct
- Check your OpenAI account has credits
- Ensure you have internet connection
- Try again if rate limited

### Modal Not Showing

- Check browser console for errors
- Disable other extensions that might conflict
- Clear browser cache and reload

## 🔒 Privacy & Security

- API key stored locally using Chrome's secure storage API
- No data collection or analytics
- All communication is directly with OpenAI's API
- Extension only runs on Etsy conversation pages

## 📝 License

MIT License - feel free to modify and distribute

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## 💡 Future Enhancements

- [ ] Custom prompt templates
- [ ] Multiple AI model options
- [ ] Reply history and favorites
- [ ] Tone adjustment (formal/casual)
- [ ] Multi-language support
- [ ] Keyboard shortcuts

## 📞 Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review Chrome DevTools console for errors
3. Open an issue on GitHub

## ⭐ Acknowledgments

- Built with OpenAI's GPT-4o-mini
- Designed for the Etsy seller community
- Icons from [Your Icon Source]

---

**Disclaimer**: This is an unofficial extension and is not affiliated with Etsy or OpenAI.
