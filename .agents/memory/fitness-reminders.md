---
name: Fitness reminders
description: User-requested gym goal and the reason for advance scheduling of closed-app reminders.
---

The user wants a minimum of two gym visits per week in this nutrition app, with reminders even when the app is closed. Do not turn this into a new native app.

**Why:** The user explicitly requested the feature in the existing app and selected closed-app reminders.

**How to apply:** Preserve the minimum-two goal and the ability to log additional visits. A screenshot of past gym entries is context, not an authorization to invent or automatically import attendance.

Closed-app reminders use OneSignal campaigns scheduled four weeks ahead and extended on app opening, rather than an in-process timer.

**Why:** The existing Autoscale deployment can sleep when the app is unused; OneSignal scheduling is limited to 30 days ahead. A running browser or server timer cannot guarantee delivery.

**How to apply:** Always disclose the finite scheduling horizon and confirmed end date; never claim reminders continue indefinitely without opening the app. Any future always-on scheduler is a separate infrastructure decision.
