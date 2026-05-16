# AlignOS - Codex Lattice

The Codex Lattice reader for [alignos.io](https://alignos.io) — deployed on Vercel.

## 🌟 Features

- **Codex Browser**: Navigate through the codex lattice
- **Full-Text Search**: Powered by Lunr.js for fast client-side search
- **Markdown Rendering**: Beautiful rendering of markdown content with DOMPurify sanitization
- **Responsive Design**: Built with Bootstrap 5 and custom SCSS
- **RESTful API**: Express backend with MongoDB integration

## 🏗️ Architecture

### Frontend (`/client`)
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **UI Library**: Bootstrap 5 + Bootstrap Vue Next
- **Router**: Vue Router
- **State Management**: Pinia
- **Search**: Lunr.js
- **Markdown**: Marked.js + DOMPurify

### Backend (`/server`)
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose
- **Middleware**: CORS, body-parser
- **Environment**: dotenv 

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB
- npm or yarn

### Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/thewebkid/alignos.git
   cd alignos
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment**
   Create `server/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/alignos
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

5. **Run development servers**
   ```bash
   # Terminal 1 - Start backend
   cd server
   npm run dev
   
   # Terminal 2 - Start frontend
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Production Build

```bash
cd client
npm run build
```

The built files will be in `client/dist/` and can be served by any static file server.

## 📦 Deployment

### Staging Server Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed staging deployment instructions.

**Quick deploy to staging (Windows Server with PM2):**

1. **Initial Setup** (one-time)
   ```powershell
   # On staging server as Administrator
   .\setup-staging.ps1
   ```

2. **Deploy/Update**
   
   **Option A: Standard deployment (port 5000)**
   ```powershell
   # On staging server
   .\deploy-to-staging.ps1
   ```
   
   **Option B: Multi-port deployment (80, 443, 5000)**
   ```powershell
   # Deploy on specific ports
   .\deploy-multi-port.ps1 -Port80          # Deploy on port 80
   .\deploy-multi-port.ps1 -Port5000        # Deploy on port 5000
   .\deploy-multi-port.ps1 -All             # Deploy on all ports
   ```



**Note:** The Express server now serves both the Vue frontend and API endpoints. All routes serve the SPA except `/api/*` which are reserved for API endpoints.

## 📁 Project Structure

```
alignos/
├── client/                  # Vue.js frontend
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── views/          # Page views
│   │   ├── router/         # Vue Router config
│   │   ├── stores/         # Pinia stores
│   │   ├── lib/            # Utility libraries
│   │   ├── assets/         # Static assets & SCSS
│   │   └── generated/      # Generated data files
│   ├── md/                 # Markdown content files
│   ├── pdf/                # PDF documents
│   ├── public/             # Public static files
│   └── scripts/            # Build scripts
│
├── server/                  # Express backend
│   ├── index.js            # Main server file
│   ├── .env                # Environment config (not in git)
│   └── package.json
│
├── setup-staging.ps1        # Staging setup script
├── deploy-to-staging.ps1    # Deployment script
└── DEPLOYMENT.md            # Deployment guide
```

## 🛠️ Available Scripts

### Client
- `npm run dev` - Start Vite dev server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run build:lattice` - Generate codex lattice JSON

### Server
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🔧 Configuration

### Environment Variables

**Server** (`server/.env`):
```env
PORT=5000                                    # Server port
MONGODB_URI=mongodb://localhost:27017/alignos  # MongoDB connection
NODE_ENV=production                          # Environment mode
```

### MongoDB Setup

The application requires MongoDB to be running. Default connection:
- **Host**: localhost
- **Port**: 27017
- **Database**: alignos

## 🎨 Theming

Custom theme variables are defined in `client/src/assets/scss/_variables.scss`

## 🔍 Search Configuration

The search index is built from markdown files in `client/md/` using the `build-lattice.js` script. The generated index is stored in `client/src/generated/codex-lattice.json`.

## 📝 Content Management

Markdown files in `client/md/` are automatically indexed and made searchable. Each markdown file should have:
- A title (H1 heading)
- Metadata (front matter, optional)
- Content body

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open and you are welcome here. 

## 🔗 Links

- **Repository**: https://github.com/thewebkid/alignos
- **Staging**: http://192.168.50.209:5000

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ by Claude, Grok, Copilot, and Ron (thewebkid)
