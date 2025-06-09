# AI GCSE Examiner 🤖

An intelligent exam marking system that uses AI to grade GCSE papers with the precision of an experienced examiner. Built with React, TypeScript, and Chakra UI.

## Screenshots 📸

### Main Interface
![AI GCSE Examiner Main Interface](/examiner-ai-screenshot.png)

### Marking Breakdown
![AI GCSE Examiner Marking Breakdown](/examiner-ai--marking-screenshot.png)

## Features ✨

- **AI-Powered Marking**: Automatically grades GCSE papers utilising the power of LLMs 
- **PDF Support**: Upload both student papers and mark schemes in PDF format
- **Detailed Feedback**: Get comprehensive feedback and comments for each question
- **User Authentication**: Secure login system with Firebase
- **Credit System**: Free credits for non-registered users, more credits for registered users
- **History Tracking**: View your marking history (for registered users)
- **Modern UI**: Beautiful and intuitive interface built with Chakra UI
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Coming Soon**: Advanced analytics dashboard with insights into marking patterns, common mistakes, and performance trends

## Tech Stack 🛠

- **Frontend**: React, TypeScript, Chakra UI (hosted on Vercel)
- **Authentication**: Firebase
- **Backend**: Python/FastAPI (hosted on Render)
- **File Handling**: PDF processing
- **Styling**: Chakra UI with custom theme

## Getting Started 🚀

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hamza-rashid/ai-examiner.git
cd ai-examiner
```

2. Install dependencies:
```bash
cd client
npm install
```

3. Set up environment variables:
Create a `.env` file in the client directory with your Firebase configuration:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm start
```

## Usage 📝

1. Upload a student's exam paper (PDF)
2. Upload the corresponding mark scheme (PDF)
3. Click "Mark Paper" to start the AI marking process
4. Review the detailed feedback and marks for each question
5. (Optional) Login to save your marked papers and access more credits

## Credits System 💰

- **Non-registered users**: 3 free credits
- **Registered users**: 10 free credits per month
- More credits coming soon!

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author 👨‍💻

**Hamza Rashid**
- LinkedIn: [Hamza Rashid](https://www.linkedin.com/in/hamza-rashid-354257174/)
- GitHub: [@hamza-rashid](https://github.com/hamza-rashid)

---

⭐️ If you find this project helpful, please give it a star on GitHub! 
