# 🚫 Rate Limit Troubleshooting Guide

## What is Rate Limiting?

Rate limiting occurs when you make too many API requests to OpenAI in a short period of time. OpenAI has limits to prevent abuse and ensure fair usage.

## Common Causes

### 1. **Rapid Button Clicking**

- Clicking the "AI Reply" button multiple times quickly
- **Solution**: Wait 2-3 seconds between requests

### 2. **High Token Usage**

- Long conversations with many messages
- **Solution**: The extension now limits to 500 tokens per reply

### 3. **Multiple Extensions/Applications**

- Using other AI tools simultaneously
- **Solution**: Close other AI applications temporarily

### 4. **Free Tier Limits**

- Free OpenAI accounts have lower limits
- **Solution**: Upgrade to a paid plan for higher limits

## Rate Limit Types

### **Requests Per Minute (RPM)**

- **Free Tier**: 3 requests per minute
- **Paid Tier**: 3,500 requests per minute
- **Error**: "Rate limit exceeded. Please try again in a moment."

### **Tokens Per Minute (TPM)**

- **Free Tier**: 40,000 tokens per minute
- **Paid Tier**: 90,000 tokens per minute
- **Error**: "Rate limit exceeded for requests per minute."

### **Daily Usage Limits**

- **Free Tier**: $5 credit limit
- **Paid Tier**: Based on your billing

## How the Extension Handles Rate Limits

### **Built-in Protection**

- ✅ **2-second cooldown** between requests
- ✅ **Button disabled** during processing
- ✅ **500 token limit** per reply (reduced from 5000)
- ✅ **Retry-after header** support

### **User Feedback**

- Clear error messages with wait times
- Visual button states (disabled/enabled)
- Loading indicators

## Solutions

### **Immediate Fixes**

1. **Wait and Retry**

   ```
   Error: "Rate limit exceeded. Please wait 30 seconds before trying again."
   Action: Wait the specified time, then try again
   ```

2. **Check Your Usage**

   - Visit: https://platform.openai.com/usage
   - Check your current usage and limits

3. **Upgrade Your Plan**
   - Visit: https://platform.openai.com/settings/organization/billing
   - Upgrade to a paid plan for higher limits

### **Prevention Tips**

1. **Don't Rapid-Click**

   - Wait for each request to complete
   - Button will be disabled during processing

2. **Use Efficiently**

   - Only generate replies when needed
   - Edit replies instead of regenerating

3. **Monitor Usage**
   - Check OpenAI dashboard regularly
   - Set up billing alerts

## Error Messages Explained

### **"Please wait X seconds before making another request"**

- **Cause**: Extension's built-in rate limiting
- **Action**: Wait the specified time

### **"Rate limit exceeded. Please wait X seconds before trying again"**

- **Cause**: OpenAI's API rate limiting
- **Action**: Wait the specified time

### **"Rate limit exceeded for requests per minute"**

- **Cause**: Too many requests in one minute
- **Action**: Wait 60 seconds, reduce request frequency

### **"You exceeded your current quota"**

- **Cause**: Daily/monthly usage limit reached
- **Action**: Upgrade plan or wait for reset

## Testing Your Limits

### **Check Your Current Limits**

1. Go to: https://platform.openai.com/settings/organization/limits
2. Check your RPM and TPM limits

### **Monitor Usage**

1. Go to: https://platform.openai.com/usage
2. Check your current usage

## Advanced Solutions

### **For Heavy Users**

1. **Upgrade to Pro Plan**

   - $20/month for much higher limits
   - 3,500 RPM vs 3 RPM on free tier

2. **Use Multiple API Keys**

   - Create separate keys for different use cases
   - Rotate between keys if needed

3. **Optimize Requests**
   - Reduce conversation history length
   - Use shorter system prompts

### **For Developers**

```javascript
// Add custom rate limiting
const rateLimitDelay = 3000; // 3 seconds
setTimeout(() => {
  // Make API request
}, rateLimitDelay);
```

## Common Scenarios

### **Scenario 1: Testing the Extension**

- **Problem**: Clicking button multiple times to test
- **Solution**: Wait 2-3 seconds between tests

### **Scenario 2: Long Conversation**

- **Problem**: Many messages in history
- **Solution**: Extension automatically limits token usage

### **Scenario 3: Multiple Users**

- **Problem**: Shared API key with high usage
- **Solution**: Each user should have their own API key

## Getting Help

### **Check Extension Logs**

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for error messages

### **Check OpenAI Status**

- Visit: https://status.openai.com/
- Check for service issues

### **Contact Support**

- OpenAI Support: https://help.openai.com/
- Extension Issues: Check console logs first

## Prevention Checklist

- [ ] Wait 2-3 seconds between requests
- [ ] Don't click the button multiple times
- [ ] Monitor your OpenAI usage dashboard
- [ ] Consider upgrading to a paid plan for heavy usage
- [ ] Use the extension efficiently (don't regenerate unnecessarily)
- [ ] Check for other applications using your API key

## Quick Fixes Summary

| Error Type         | Wait Time     | Action                       |
| ------------------ | ------------- | ---------------------------- |
| Extension cooldown | 2 seconds     | Wait for button to re-enable |
| API rate limit     | 30-60 seconds | Wait and retry               |
| Quota exceeded     | Until reset   | Upgrade plan or wait         |

---

**Remember**: Rate limits are there to ensure fair usage. The extension now has built-in protection to help prevent these issues!
