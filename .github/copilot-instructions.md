The Urlist

An application for sharing list of links with a URL.

Technologies used...

- Astro
- React
- Nanostores
- Tailwind CSS
- Postgres

Do not use an ORM, just use the native Postgres driver.

Make sure all terminal commands work in Powershell.

Astro, React, Nanostores and Tailwind CSS are already installed.

# 🏗 Vite / React / Tailwind / Nanostores / Astro Best Practices

This guide outlines **best practices** for building a **Vite / React / Tailwind / Nanostores / Astro** application. The goal is **readability and maintainability**, minimizing abstraction to keep the codebase clear.

---

## 📁 Project Structure

Keep a **flat and predictable** folder structure:

```
/src
  /components  # Reusable UI components (buttons, inputs, cards, etc.)
  /pages       # Page components (mapped to routes)
  /stores      # Nanostores for state management
  /hooks       # Custom React hooks (if needed)
  /utils       # Simple utility functions (date formatting, API requests, etc.)
  /assets      # Static assets (images, icons, etc.)
  /styles      # Tailwind config and global CSS files (if any)
  main.tsx     # Entry point
  app.tsx      # Root component
  routes.tsx   # Centralized route definitions
```

📌 **Rules:**

- **Flat is better than nested.**
- **No generic 'helpers' folder.**
- **Keep components close to where they are used.**

---

## ⚛ React Component Best Practices

### ✅ When to Create a New Component

1. **If the JSX exceeds ~30 lines.**
2. **If the UI is used more than once.**
3. **If it has a clear single responsibility.**

```tsx
// ❌ BAD: Bloated file
export function Dashboard() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <button className="px-4 py-2 bg-blue-500 text-white rounded-md">
        Click Me
      </button>
      <table>...</table>
    </div>
  );
}

// ✅ GOOD: Extracted components
export function Dashboard() {
  return (
    <div className="p-4">
      <Title>Dashboard</Title>
      <Button>Click Me</Button>
      <DataTable />
    </div>
  );
}
```

📌 **Rules:**

- **Keep components small and focused.**
- **Avoid abstraction unless it provides real value.**

---

## 🚀 Astro Best Practices

### ✅ Keep Astro Components Focused

- Use **.astro** files for page structure and layout.
- Prefer using **React for interactive components**.
- Keep **Astro pages clean**—avoid unnecessary logic.

```astro
---
import { Button } from '../components/Button.tsx';
---

<Layout>
  <h1 class="text-2xl font-bold">Welcome</h1>
  <Button>Click Me</Button>
</Layout>
```

📌 **Rules:**

- **Use `.astro` files for static content.**
- **Use React only when interactivity is needed.**
- **Keep logic out of `.astro` files when possible.**

---

## 🎨 Tailwind Best Practices

### ✅ Use Utility Classes Over Custom CSS

```tsx
// ✅ Prefer Tailwind utility classes
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="p-4 rounded-lg shadow-md bg-white">{children}</div>;
}
```

📌 **Rules:**

- **Avoid unnecessary `class` extractions.**
- **Use Tailwind’s built-in utilities.**

---

## 🏪 Nanostores Best Practices

### ✅ Keep Stores Small & Independent

```tsx
// src/stores/auth.ts
import { atom } from "nanostores";

export const user = atom<User | null>(null);
export const isAuthenticated = computed(user, (u) => !!u);
```

📌 **Rules:**

- **Use `atom` for simple state.**
- **Use `computed` for derived state.**
- **Keep stores independent.**

---

## 🌿 Hooks Best Practices

### ✅ Only Create Hooks for Reusable Logic

```tsx
// src/hooks/useFetch.ts
import { useEffect, useState } from "react";

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then(setData);
  }, [url]);

  return data;
}
```

📌 **Rules:**

- **No "just in case" hooks.**
- **Keep hooks simple and focused.**

---

## 🛠 Development Workflow Best Practices

### ✅ Consistent Coding Style

- Use **ESLint + Prettier** to enforce formatting.
- Keep **imports organized**:

```tsx
import { useState } from "react"; // React first
import { user } from "@/stores/auth"; // Stores second
import { Button } from "@/components/Button"; // Components last
```

---

## 🔥 Final Thoughts

1. **Avoid over-engineering.** Keep it simple.
2. **Prioritize readability over cleverness.**
3. **Only abstract when it provides real value.**
4. **Keep state management minimal.**
5. **Use Tailwind properly—don’t fight it.**
6. **Use `.astro` files effectively—static content in `.astro`, interactivity in React.**

---