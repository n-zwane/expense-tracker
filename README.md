# Spendr – Expense Tracker 💰

A minimalist expense tracker with dark mode, monthly charts, and local storage support.

---

## 🌟 The Story Behind Spendr

I created **Spendr** after searching for a simple, ad-free expense tracker and realizing that most apps were either overloaded with features, locked behind paywalls, or full of ads. I wanted something clean, fast, and distraction-free — just a tool to track what I earn and spend, without selling my data or crowding my screen.

**Spendr** is my take on that — a lightweight, responsive tracker built entirely with vanilla JavaScript, designed for students, freelancers, and minimalists like myself who want clarity over clutter.

---

## ✨ Features

-   Add income and expense transactions
-   View balance, income, and expense summaries
-   Interactive monthly bar chart (Chart.js)
-   Dark/light theme toggle
-   Search and filter transactions
-   Mobile-friendly design
-   100% offline (uses local storage – no sign-in needed, no ads, no tracking)
-   Export data to CSV/PDF
-   Offline-first (works without internet)
-   Installable as a PWA (feels like a native app)

---

## 🚀 How to Use

1. 🔗 [View the Live Site Here](https://n-zwane.github.io/expense-tracker/)
2. **Local Setup**:
    ```bash
    git clone https://github.com/n-zwane/expense-tracker.git
    ```
    Open `index.html` in a browser.

---

## 🛠️ Tech Stack

-   Frontend: Vanilla JavaScript (ES6), HTML5, CSS3
-   Visualizations: Chart.js
-   Icons: Font Awesome
-   Offline Magic: Service Workers, Cache API

---

### 🧗 Development Journey: Challenges & Solutions

1. **Making It Work Offline**

-   Problem: Live Server blocked true offline testing.
-   Fix: Used Chrome’s Go offline mode + deployed to GitHub Pages for real-world testing.

2. **Cache Storage Mysteries**

-   Problem: Cached files weren’t appearing in DevTools.
-   Fix: Debugged sw.js paths and manually activated the Service Worker.

3. **PWA Installation**

-   Problem: Favicon 404 errors cluttered the console.
-   Fix: Added a favicon and optimized cache rules.

---

## 📜 License

This project is open-source under the MIT License.  
Feel free to use it, learn from it, and make it your own — no ads, no paywalls, no nonsense.

---
