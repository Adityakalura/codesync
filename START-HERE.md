# CodeSYNC Arena: Start Here

## What's in this package

```
CodeSYNC-Arena-READY/
├── START-HERE.md   <- this guide
├── backend/        <- the server (logins, meetings, chat, database)
└── frontend/       <- the website people see
```

Both folders are finished and tested. You do not need to edit any code.
You will push this whole folder to ONE GitHub repository, then tell Railway to run `backend` and `frontend` as two services.

You need: Node.js, Git, a GitHub account, a Railway account (sign up with GitHub). Total time: about 30 minutes.

---

## PHASE 1: Put the code on GitHub (about 5 min)

1. Extract the zip. You should see the `backend` and `frontend` folders next to this file.
2. Go to github.com -> **+** (top right) -> **New repository**.
   - Name: `codesync-arena`
   - Choose **Private**
   - Do NOT tick "Add a README"
   - Click **Create repository**. Keep the page open.
3. Open a terminal INSIDE the extracted `CodeSYNC-Arena-READY` folder.
   - Windows: open the folder in File Explorer, click the address bar, type `powershell`, press Enter.
   - Mac: right-click the folder -> New Terminal at Folder.
4. Run these one at a time (replace `yourname` with your GitHub username):

```
git init
git add .
git commit -m "CodeSYNC Arena"
git branch -M main
git remote add origin https://github.com/yourname/codesync-arena.git
git push -u origin main
```

5. Refresh the GitHub page. You should see `backend` and `frontend` folders.

---

## PHASE 2: Make two secret keys (1 min)

In the terminal, run this command TWICE. Copy each output into a notepad and label them.

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

- First result = `JWT_SECRET`
- Second result = `SESSION_SECRET`

Never share these or put them on GitHub.

---

## PHASE 3: Railway - database + backend (about 10 min)

1. Go to railway.com -> **New Project** -> **Deploy MySQL**. Wait until it's green.
2. In the same project: **+ New** -> **GitHub Repo** -> choose `codesync-arena`.
3. Click the new service -> **Settings**:
   - **Root Directory**: `/backend`
   - Click **Networking -> Generate Domain**. Copy the URL (this is your BACKEND URL).
4. Click the **Variables** tab -> **Raw Editor**, paste the block below, replace the two secrets, then save:

```
NODE_ENV=production
JWT_SECRET=PASTE_FIRST_SECRET
SESSION_SECRET=PASTE_SECOND_SECRET
MYSQL_HOST=${{MySQL.MYSQLHOST}}
MYSQL_PORT=${{MySQL.MYSQLPORT}}
MYSQL_USER=${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQL_DATABASE=${{MySQL.MYSQLDATABASE}}
```

(`MySQL` must match the exact name of your database service on the canvas. Rename in the block if yours differs.)

5. Wait for the deploy to finish. Open `https://YOUR-BACKEND-URL/api/health`.
   You should see: `{"status":"ok"}`. Backend done.

---

## PHASE 4: Railway - frontend (about 5 min)

1. In the same project: **+ New** -> **GitHub Repo** -> `codesync-arena` again.
2. **Settings**:
   - **Root Directory**: `/frontend`
   - Build command: `npm run build`
   - Start command: `npm start`
   - **Networking -> Generate Domain**. Copy it (this is your FRONTEND URL).
3. **Variables** (add BEFORE the build finishes, or redeploy after):

```
VITE_API_URL=https://YOUR-BACKEND-URL/api
VITE_SOCKET_URL=https://YOUR-BACKEND-URL
```

   Use `https://`, no trailing slash, and no extra URLs.

---

## PHASE 5: Connect them together (2 min)

Go back to the **backend** service -> Variables -> add:

```
CLIENT_URL=https://YOUR-FRONTEND-URL
CORS_ALLOWED_ORIGINS=https://YOUR-FRONTEND-URL
```

No trailing slash. Railway redeploys by itself. If you skip this, the site loads but login fails with a network/CORS error.

---

## PHASE 6: Test everything (before the interview)

1. Open your FRONTEND URL, sign up, log in.
2. Create a meeting. Copy the join link.
3. Open the link on a second device (phone on mobile data is ideal), or an incognito window, signed in as a different user.
4. Check: chat, video/audio, whiteboard, code editor.
5. Allow camera and microphone when the browser asks.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| `/api/health` does not load | Backend -> Deployments -> View logs. Usually a wrong MYSQL variable name. |
| Login says network error | CLIENT_URL / CORS_ALLOWED_ORIGINS wrong, or has a trailing slash. |
| Site loads but calls localhost | VITE_ variables missing at build time. Add them and Redeploy the frontend. |
| Video works on same Wi-Fi only | Needs a TURN server. Ask Claude to add one. |
| Backend log: "JWT_SECRET is not set" | Add the variable in Phase 3. |

Paste any error message to Claude and it will tell you the exact fix.

---

## Interview talking points

- React + Vite frontend, Node/Express backend, MySQL.
- JWT auth, and the same JWT secures the Socket.IO connection.
- WebRTC peer-to-peer video, with Socket.IO as the signalling channel.
- Real-time whiteboard and a shared code editor with owner-controlled permissions.
- The server verifies who each user is, so a guest cannot pretend to be the meeting owner.
