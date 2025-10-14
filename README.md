# MCP + Gemini Chatbot UI

A modern, ChatGPT-style web interface for your MCP + Gemini AI chatbot. Built with React and styled with Tailwind CSS.

![Chatbot Interface](https://img.shields.io/badge/React-18+-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.3-38bdf8.svg)

## Features

- 🎨 **Modern Dark Theme** - ChatGPT-inspired design
- 💬 **Conversation History** - Messages persist during your session
- 🔄 **Real-time Responses** - Smooth loading animations
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎯 **Collapsible Sidebar** - Clean, organized interface
- ⚡ **Fast & Lightweight** - Optimized performance

## Screenshots

### Main Chat Interface
- Clean message bubbles for user and AI responses
- Gradient avatars for visual distinction
- Smooth scrolling to latest messages

### Sidebar
- Quick access to new conversations
- Conversation history display
- Branding section with AI assistant info

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Backend API** running on `http://localhost:9009/{endpoint}`

Check your Node.js version:
```bash
node --version
```

## Installation

### 1. Clone or Create Project

If starting fresh:
```bash
npx create-react-app my-chatbot
cd my-chatbot
```

### 2. Install Dependencies

```bash
npm install lucide-react
npm install -D tailwindcss@3.3.0 postcss autoprefixer
```

### 3. Configure Tailwind CSS

Create `tailwind.config.js` in your project root:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create `postcss.config.js` in your project root:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 4. Update CSS

Replace contents of `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. Replace App Component

Copy the chatbot code into `src/App.js`

### 6. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## Backend Setup

This UI expects a backend API running at `http://localhost:9009/query`

### API Endpoint Requirements

**POST** `/query`
- **Request Body**: `{ "query": "your question here" }`
- **Response**: `{ "response": "AI response here" }`

Example with Node.js/Express:
```javascript
app.post('/query', async (req, res) => {
  const { query } = req.body;
  // Process with your MCP + Gemini backend
  const aiResponse = await processQuery(query);
  res.json({ response: aiResponse });
});
```

## Project Structure

```
my-chatbot/
├── public/
│   └── index.html
├── src/
│   ├── App.js           # Main chat component
│   ├── index.js         # React entry point
│   └── index.css        # Tailwind imports
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Customization

### Change Colors

Edit the gradient colors in `App.js`:
```javascript
// Current: Purple to Pink gradient
className="bg-gradient-to-br from-purple-500 to-pink-500"

// Change to: Blue to Cyan
className="bg-gradient-to-br from-blue-500 to-cyan-500"
```

### Change Backend URL

Update the fetch URL in the `handleSubmit` function:
```javascript
const res = await fetch("YOUR_BACKEND_URL/query", {
  // ...
});
```

### Modify Branding

Change the title and descriptions:
```javascript
<h1 className="text-lg font-semibold">Your App Name</h1>
```

## Troubleshooting

### Issue: "react-scripts is not recognized"
**Solution**: Run `npm install` first

### Issue: UI shows plain HTML without styling
**Solution**: Tailwind CSS is not configured. Follow the Tailwind setup steps above.

### Issue: Backend connection error
**Solution**: 
1. Ensure backend is running on port 9009
2. Check CORS settings on your backend
3. Verify the API endpoint URL

### Issue: npm cache errors
**Solution**:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Available Scripts

### `npm start`
Runs the app in development mode at `http://localhost:3000`

### `npm run build`
Builds the app for production to the `build` folder

### `npm test`
Launches the test runner

### `npm run eject`
**Warning: This is irreversible!** Ejects from Create React App.

## Technologies Used

- **React 18+** - UI framework
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Fetch API** - HTTP requests

## Features Roadmap

- [ ] Conversation persistence (save to database)
- [ ] Export chat history
- [ ] Multi-file upload support
- [ ] Voice input
- [ ] Dark/Light theme toggle
- [ ] Markdown rendering for AI responses
- [ ] Code syntax highlighting

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for your own applications.

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Ensure all dependencies are installed
3. Verify your backend is running and accessible
4. Check browser console for errors

## Acknowledgments

- Design inspired by ChatGPT
- Built with Create React App
- Icons by Lucide

