
![VerifyAI Big Logo](https://github.com/user-attachments/assets/0cf4eed5-d248-43b7-9bce-7bdc4822e29f)

# AI-Powered Merchant Compliance Checker

## Overview
Merchant website compliance checks are often time-consuming and require manual effort. This project aims to streamline the process by leveraging AI to scrape merchant websites, validate their legitimacy, and ensure they comply with product restrictions. 

## Problem Statement
Compliance officers spend a significant amount of time manually verifying merchant websites during onboarding. This project provides AI assistance to automate and enhance this process.

## Solution
- **Web Scraping:** Extract relevant information from merchant websites.
- **AI-Powered Analysis:** Validate legitimacy, verify product offerings, and detect restricted products.
- **Scoring System:** Compare automated results with human evaluations.
- **Actionable Recommendations:** Assist compliance officers with decision-making.

## Features (MVP Scope)
- Scrape websites for legitimacy signals.
- Verify ownership of a website against a specified merchant.
- Confirm that products are being sold.
- Detect restricted products (requiring human verification for final approval).

## Technical Challenges
- Ensuring AI successfully extracts relevant compliance-related information.
- Generating a confidence score for compliance checks.

## Stretch Goals
- Provide a verification score to compare with human evaluations.
- Recommend third-party internal verification for enhanced accuracy.

## Tech Stack
- **Frontend:** React (for dashboard, if applicable)
- **Backend:** Node.js / Express
- **Web Scraping:** Puppeteer / Playwright / Cheerio
- **AI Models:** OpenAI API / Custom NLP Model
- **Database:** PostgreSQL / MongoDB
- **Hosting & Deployment:** AWS / Vercel

## Setup Instructions
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/ai-compliance-checker.git
   cd ai-compliance-checker
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables (e.g., API keys, database credentials) in a `.env` file:
   ```env
   OPENAI_API_KEY=your-api-key
   DATABASE_URL=your-database-url
   ```
4. Run the project:
   ```sh
   npm start
   ```

## Contributing
1. Fork the repository.
2. Create a new branch (`feature-branch`).
3. Commit your changes.
4. Open a pull request.


---

**Maintainers:**
Tanner Lyon - FE/BE
Jesse Chou - FE/BE
Kiril Christov - FE/BE
Taven Shumaker - FE/BE
Ian Mann - FE/BE

# Diagrams

## MVP Goal:
![image](https://github.com/user-attachments/assets/c07997d0-9f88-45cb-8edd-44ea56f47773)

## Strech Goals:
![image](https://github.com/user-attachments/assets/23898b76-f0e7-47bf-be81-3b1d98667ed0)

![image](https://github.com/user-attachments/assets/e210ec3b-de5c-4bf9-bf05-1029f5b62e19)
