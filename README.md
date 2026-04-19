# Vidyashine Academy — Web Platform

A premium, modern educational platform built with **React (Vite)**, **Tailwind CSS v4**, and **GSAP** animations. Multi-page website featuring admissions pricing, a booking modal, blog, testimonials, and more.

---

## ⚡ Quick Start

### Prerequisites

- **[Node.js](https://nodejs.org/)** v18 or later (includes npm)

### 1. Install Dependencies

```bash
cd vidyashine
npm install
```

### 2. Create Your Environment File

Copy the example environment file and fill in your own values:

```bash
cp .env.example .env
```

> **Windows users:** You can also just duplicate `.env.example`, rename the copy to `.env`, and edit it.

Open `.env` and replace the placeholder values:

| Variable | Description | How to Get It |
|---|---|---|
| `VITE_WEB3FORMS_ACCESS_KEY` | API key for the "Book Free Trial" contact form | Sign up free at [web3forms.com](https://web3forms.com/) and enter your email to receive a key |
| `VITE_SUPPORT_EMAIL` | Email displayed for cancellation/support requests | Use your academy's support email address |

### 3. Start the Dev Server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

> **Windows shortcut:** Double-click `Start_Vidyashine.bat` — it installs dependencies and launches the dev server automatically.

---

## 📁 Project Structure

```
vidyashine/
├── public/               # Static assets (logo, images)
│   ├── logo.png          # Main logo — replace with yours
│   ├── Tutor.jpg         # About Us tutor photo
│   ├── 0.jpg, 1.jpg, 2.jpg  # Achievement gallery images
│   └── 6.png             # Blog image
├── src/
│   ├── App.jsx           # All components and routing
│   ├── App.css           # Component-level styles
│   ├── index.css         # Global Tailwind + custom styles
│   ├── main.jsx          # App entry point
│   └── data/
│       └── blogData.js   # Blog article content (edit to update blog)
├── .env.example          # Environment variable template
├── index.html            # HTML entry point
├── netlify.toml          # Netlify deployment config
├── vite.config.js        # Vite + Tailwind v4 configuration
├── Start_Vidyashine.bat  # Windows one-click launcher
└── package.json
```

---

## 🎨 Customization Guide

### Logo
Replace `public/logo.png` with your own logo file (keep the same filename).

### Contact Information
Search `App.jsx` for these placeholder values and replace them with your real info:

| Placeholder | Where It Appears |
|---|---|
| `YOUR_PHONE_NUMBER` | Contact page, Privacy Policy, Terms of Service |
| `your-privacy-email@example.com` | Privacy Policy section |
| `your-support-email@example.com` | Terms of Service section |
| `your-email@example.com` | Cancellation email fallback |

### Blog Articles
Edit `src/data/blogData.js` — each blog entry has:
- `title`, `description`, `date`, `image` (URL or `/filename.ext` for images in `public/`), and `link` (URL slug)

### Pricing / Fee Structure
Pricing data is inside the `AdmissionsPricing` component in `App.jsx`. Search for `pricingData` to find the object containing fees for each class (VI through XII).

### Team / About Us
The tutor photo is at `public/Tutor.jpg`. The name and credentials are in the `AboutUs` component in `App.jsx`.

### Achievement Images
Replace `public/0.jpg`, `public/1.jpg`, `public/2.jpg` with your own achievement/gallery photos.

---

## 🚀 Deployment (Netlify)

This project includes a `netlify.toml` pre-configured for deployment.

1. Push your project to a **GitHub** or **GitLab** repository.
2. Go to [netlify.com](https://www.netlify.com/) and click **"Add new site" → "Import an existing project"**.
3. Connect your repository.
4. Netlify auto-detects the build settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Add your environment variables (`VITE_WEB3FORMS_ACCESS_KEY`, `VITE_SUPPORT_EMAIL`) in **Site settings → Environment variables**.
6. Deploy!

---

## 🛠 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server (hot reload) |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

---

## 🧱 Tech Stack

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI framework |
| [Vite 7](https://vite.dev/) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |
| [GSAP](https://gsap.com/) | Scroll-triggered & complex animations |
| [React Router v7](https://reactrouter.com/) | Client-side routing |
| [Lucide React](https://lucide.dev/) | SVG icon library |
| [Web3Forms](https://web3forms.com/) | Serverless form handling |

---

## 📋 Checklist Before Going Live

- [ ] Replace all `YOUR_PHONE_NUMBER` placeholders in `App.jsx`
- [ ] Replace all `your-*-email@example.com` placeholders in `App.jsx`
- [ ] Replace `public/logo.png` with your logo
- [ ] Replace tutor/achievement images in `public/`
- [ ] Update blog content in `src/data/blogData.js`
- [ ] Update pricing in the `AdmissionsPricing` component
- [ ] Set environment variables on your hosting provider
- [ ] Run `npm run build` to confirm zero errors

---

## License

Proprietary software structure owned by Vidyashine Academy.
