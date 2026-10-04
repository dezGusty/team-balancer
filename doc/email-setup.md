# Email Sending Setup (Google Apps Script + Firebase)

This guide explains how to set up email sending for the Team Balancer application using **Google Apps Script** as a free webhook runner connected to your personal Gmail account, alongside Firestore on the Spark (free) plan.

## Overview

- **Sender**: Your personal Gmail account (`Execute as: Me`).
- **Sent items**: All outgoing emails appear directly in your personal Gmail **Sent** folder.
- **Recipients**: Sent via the `to:` field as a comma-separated list so that all recipients can see each other.
- **Cost**: 100% Free (Google Apps Script free quota allows sending up to 100 recipient emails per day for standard `@gmail.com` accounts or 1,500/day for Google Workspace).
- **No Credit Card Required**: Works entirely within the free Firebase Spark plan and personal Google Account.

---

## 1. Create the Google Apps Script Web App

1. Sign in to your Google Account (the Gmail you want to send updates from).
2. Go to [https://script.google.com](https://script.google.com).
3. Click **New project** (top-left) and name it **Team Balancer Mailer**.
4. Replace the contents of `Code.gs` with the following code:

```javascript
/**
 * Team Balancer Mailer - Web App endpoint
 * Dispatches updates to the distribution list using your personal Gmail.
 *
 * NOTE: Recipients are set in the 'to' field so everyone can see who received the email.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respondJson({ status: "error", message: "Missing request payload" });
    }

    const payload = JSON.parse(e.postData.contents);
    const expectedSecret = "REPLACE_WITH_YOUR_SECRET_TOKEN"; // Change this to a secure random string

    if (payload.secret !== expectedSecret) {
      return respondJson({ status: "error", message: "Unauthorized: Invalid secret" });
    }

    const recipients = payload.recipients; // Array of strings or comma-separated string
    const subject = payload.subject || "Team Balancer Update";
    const htmlBody = payload.htmlBody || "";
    const plainBody = payload.plainBody || "Please enable HTML view to read this update.";
    const senderName = payload.senderName || "Team Balancer";

    const toAddresses = Array.isArray(recipients) ? recipients.join(", ") : recipients;

    if (!toAddresses || toAddresses.trim().length === 0) {
      return respondJson({ status: "error", message: "No recipients provided" });
    }

    // Send email using GmailApp.
    // Putting addresses in 'to' allows all recipients to see each other.
    GmailApp.sendEmail(toAddresses, subject, plainBody, {
      htmlBody: htmlBody,
      name: senderName
    });

    return respondJson({
      status: "success",
      recipientCount: Array.isArray(recipients) ? recipients.length : toAddresses.split(",").length
    });
  } catch (err) {
    return respondJson({ status: "error", error: err.toString() });
  }
}

function doGet(e) {
  return respondJson({ status: "ok", message: "Team Balancer Mailer is online" });
}

function respondJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

- Pick a secure secret token (e.g. `tb-mail-2026-secret` or any random string) and replace `"REPLACE_WITH_YOUR_SECRET_TOKEN"`.
- Save the file (Ctrl+S or the Save icon).

---

## 2. Deploy the Web App

1. Click **Deploy** > **New deployment** (top-right).
2. Click the gear icon next to "Select type" and select **Web app**.
3. Fill in the fields:
   - **Description**: `Team Balancer Mailer v1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` *(Crucial: Allows the Team Balancer Angular app to call the webhook. Unauthorized calls are blocked by your shared secret).*
4. Click **Deploy**.
5. Grant permissions:
   - Google will show an authorization prompt: "Team Balancer Mailer needs permission to access your Google Account (Gmail)".
   - Select your account, click **Advanced** -> **Go to Team Balancer Mailer (unsafe)** (standard for custom personal Apps Scripts).
   - Click **Allow**.
6. Copy the **Web app URL** generated (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 3. Configure Team Balancer

In Team Balancer:

1. Log in with an **Admin** user account.
2. Navigate to the **Admin** settings page (`/admin`).
3. Under **Email Updates & Distribution List**:
   - Set the **Mailer Web App URL** to your copied Google Apps Script URL.
   - Set the **Mailer Secret Token** to match `expectedSecret`.
   - Manage the **Distribution List** (add or remove emails, or paste comma/line-separated addresses).
4. Click **Save Settings**.
5. You can send a test email directly from the Admin settings or send updates from **Next Draft** / **Game Events**.
