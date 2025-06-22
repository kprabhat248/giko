# 🛠️ Giko — Internal Feedback Platform

**Giko** is a secure, structured, and user-friendly internal feedback platform designed to enhance continuous feedback between **managers** and **employees** in an organization.

This tool is built to promote clarity, growth, and transparency through regular performance insights and feedback history.

---

## 🚩 Project Overview

### 🎯 Goal

To provide a simple and effective system for:

- Delivering **structured feedback**
- Enabling **role-based access**
- Tracking **feedback history**
- Providing **visual insights** through dashboards

---

## 📁 Project Structure

```
.
├── backend                 # Python backend (containerized)
│   ├── app                # Core app logic
│   ├── Dockerfile         # Image build instructions
│   ├── requirements.txt   # Python dependencies
│   └── start.sh           # Startup script
├── frontend                # React frontend
│   ├── public             # Static assets
│   ├── src                # React components and logic
│   ├── package.json       # Project metadata
│   └── ...
└── render.yaml            # Deployment configuration (Render.com)
```

---

## ✨ Core Features

### 🔐 Authentication & Roles

- Two user roles: **Manager** and **Employee**
- Login system to restrict access
- Managers can only view their assigned team members

### 📝 Feedback Submission

- Managers can submit structured feedback with:
  - **Strengths**
  - **Areas for Improvement**
  - **Overall Sentiment**: _Positive_, _Neutral_, or _Negative_
- Multiple feedback entries allowed per employee
- History of submissions stored and viewable

### 👁️ Feedback Visibility

- Employees:
  - Can view only their own feedback
  - Can **acknowledge** feedback received
- Managers:
  - Can **edit/update** previously submitted feedback
  - Cannot view feedback from other managers’ teams

### 📊 Dashboards

- **Manager Dashboard**:
  - Feedback count per employee
  - Sentiment trends
- **Employee Dashboard**:
  - Timeline of received feedback

---

## ⚙️ Local Development Guide

### 🐳 Backend (Python - Dockerized)

#### 1. Navigate to backend

```bash
cd backend
```

#### 2. Build Docker image

```bash
docker build -t giko-backend .
```

#### 3. Run backend container

```bash
docker run --rm -p 8000:8000 giko-backend
```

#### 4. Seed the database

In a **new terminal**, run:

```bash
docker ps
```

Find the container ID (e.g., `d5d4e9d530ba`), then:

```bash
docker exec <container_id> python -m app.seed
```

> Replace `<container_id>` with the actual ID from `docker ps`

---

### 💻 Frontend (React)

In a **new terminal**:

#### 1. Navigate to frontend

```bash
cd frontend
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Start development server

```bash
npm start
```

- Frontend runs at: [http://localhost:3000](http://localhost:3000)  
- Backend runs at: [http://localhost:8000](http://localhost:8000)

---

## 🚀 Deployment (Render)

This project uses `render.yaml` to automate deployment using **Render.com**.

### Steps:

1. Connect your repository to Render  
2. Render will detect `render.yaml` and set up services automatically  
3. One service will be created for the **backend**, and one for the **frontend**

For more details, visit: [https://render.com/docs/infrastructure-as-code](https://render.com/docs/infrastructure-as-code)

---

## 🧠 Design Considerations

- **Security**: Role-based access and data protection  
- **Simplicity**: Easy onboarding for non-technical users  
- **Structure**: Focused fields for actionable feedback  
- **Scalability**: Dockerized backend and modular frontend  

---

## 📌Deployed Links 

- Backend on  Render :-    https://giko-backend.onrender.com/docs 
- Please wait to load on render due to free tier   
- now go to  frontend on :- https://giko56.netlify.app/
- Test with seeded data on seed.py (Manager1 or employee1)

---

## 🧪 Tech Stack

| Layer        | Technology              |
|--------------|--------------------------|
| Frontend     | React.js                 |
| Backend      | Python (FastAPI/Flask)   |
| Database     | PostgreSQL / SQLite      |
| Container    | Docker                   |
| Deployment   | Render.com               |

---

## 🙋‍♂️ Author

**Prabhat Kumar**  
Crafting tools for meaningful team communication  
📧 [kprabhat248@gmail.com](mailto:kprabhat248@gmail.com)

---

## 📄 License

This project is provided for educational and demo purposes.  
You may modify or reuse it for internal applications.
