Required Dependencies
Frontend dependencies:
bashCopynpm install react react-dom react-router-dom @tailwindcss/forms tailwindcss postcss autoprefixer lucide-react
Backend dependencies:
bashCopynpm install express cors dotenv spotify-web-api-node axios
Development dependencies:
bashCopynpm install -D typescript @types/react @types/react-dom @types/express @types/cors @types/spotify-web-api-node nodemon ts-node @vitejs/plugin-react
Running the Application

Start the backend server:

bashCopycd server
npm run dev
The server will run on http://localhost:8000

In a new terminal, start the frontend development server:

bashCopycd client
npm run dev
The frontend will run on http://localhost:5173