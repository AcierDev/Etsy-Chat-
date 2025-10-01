# ✅ Installation Checklist - Etsy Chat+

Follow this checklist to ensure proper installation and setup.

## 📋 Pre-Installation

- [ ] Chrome browser installed (latest version recommended)
- [ ] OpenAI account created at https://platform.openai.com
- [ ] Payment method added to OpenAI account (for API access)
- [ ] Downloaded/cloned the Etsy Chat+ extension folder

## 🔑 API Key Setup

- [ ] Logged into OpenAI Platform
- [ ] Navigated to API Keys section
- [ ] Created new secret key named "Etsy Chat Extension"
- [ ] Copied API key (starts with `sk-...`)
- [ ] Saved API key securely (password manager recommended)

## 🎨 Icon Generation

- [ ] Opened `icons/generate-icons.html` in browser
- [ ] Downloaded icon16.png
- [ ] Downloaded icon48.png
- [ ] Downloaded icon128.png
- [ ] Saved all three files in the `icons/` folder
- [ ] Verified icons are properly named (lowercase, .png extension)

## 🔧 Chrome Extension Installation

- [ ] Opened Chrome browser
- [ ] Navigated to `chrome://extensions/`
- [ ] Enabled "Developer mode" toggle (top-right)
- [ ] Clicked "Load unpacked" button
- [ ] Selected the "Etsy Chat+" folder
- [ ] Extension appears in extensions list
- [ ] No errors shown in extension card
- [ ] Extension icon visible in Chrome toolbar

## ⚙️ Extension Configuration

- [ ] Clicked Etsy Chat+ icon in Chrome toolbar
- [ ] Popup opened successfully
- [ ] Pasted OpenAI API key into input field
- [ ] Clicked "Save Settings" button
- [ ] Success message appeared
- [ ] No error messages shown

## 🧪 Testing

- [ ] Navigated to Etsy messages: `https://www.etsy.com/your/conversations/`
- [ ] Logged into Etsy account
- [ ] Opened a conversation with message history
- [ ] "AI Reply" button visible below message input
- [ ] Button has purple gradient background
- [ ] Button shows lightning/chat icon

## 🚀 First Use Test

- [ ] Clicked "AI Reply" button
- [ ] Loading modal appeared
- [ ] Spinner animation visible
- [ ] Modal showed "Generating AI Reply" message
- [ ] Reply generated successfully (no errors)
- [ ] Reply modal appeared with suggested text
- [ ] Reply text is relevant to conversation
- [ ] "Accept & Insert" button works
- [ ] Reply inserted into message textarea
- [ ] Can edit reply after insertion

## 🔍 Verification

- [ ] No console errors (press F12 to check)
- [ ] Extension works on multiple conversations
- [ ] Modal animations smooth and professional
- [ ] Button styling matches Etsy's interface
- [ ] API calls completing in < 5 seconds
- [ ] Generated replies make sense contextually

## 🐛 Troubleshooting (if needed)

If any checklist item fails:

### Icons Not Showing

- Verify PNG files in `icons/` folder
- Check file names exactly match: `icon16.png`, `icon48.png`, `icon128.png`
- Try removing and reloading extension

### Button Not Appearing

- Refresh Etsy conversation page
- Check you're on `/your/conversations/` URL
- Verify extension is enabled
- Check browser console for errors

### API Errors

- Verify API key starts with `sk-`
- Check OpenAI account has credits
- Test API key at https://platform.openai.com/playground
- Ensure no extra spaces in API key

### Modal Issues

- Disable other Chrome extensions
- Clear browser cache
- Check for JavaScript errors in console
- Verify internet connection

## ✨ Optional Enhancements

- [ ] Customize AI tone in `background.js` (system message)
- [ ] Adjust max_tokens for reply length
- [ ] Change to GPT-4 model for better quality
- [ ] Pin extension to Chrome toolbar

## 📊 Usage Monitoring

After installation:

- [ ] Monitor OpenAI API usage at https://platform.openai.com/usage
- [ ] Set up billing alerts if desired
- [ ] Track extension performance
- [ ] Collect feedback on reply quality

## 🎉 Success Criteria

You've successfully installed Etsy Chat+ when:

✅ Extension loads without errors  
✅ Button appears on Etsy conversation pages  
✅ Modal opens with smooth animations  
✅ API generates relevant replies  
✅ Replies can be accepted and edited  
✅ No console errors or warnings

---

## 🆘 Still Having Issues?

1. Check `README.md` for detailed documentation
2. Review `QUICK_START.md` for simplified instructions
3. Open Chrome DevTools (F12) and check Console tab
4. Verify all files are present in extension folder
5. Try uninstalling and reinstalling the extension

## 📝 Notes

- First API call may take 3-5 seconds
- Subsequent calls are usually faster
- Extension only works on Etsy conversation pages
- API key is stored locally and never transmitted except to OpenAI

---

**Installation Date**: **\*\***\_\_\_**\*\***  
**Chrome Version**: **\*\***\_\_\_**\*\***  
**Extension Version**: 1.0.0  
**API Key Status**: ⬜ Configured ⬜ Not Configured
