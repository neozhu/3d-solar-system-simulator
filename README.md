# 🪐 3D Solar System Simulator

A visually striking, physically grounded, production-quality 3D Solar System simulator running directly in your browser. This application combines accurate astronomical simulation logic with premium aesthetics, offering an immersive web-based cosmic environment.


![](/public/demo.png)

## ✨ Features

- **Realistic Orbital Motion**: Calculates and visualizes planetary orbits with scaled fidelity.
- **High-Fidelity Rendering**: Showcases planets using multiple texture maps (color, normal, roughness) and custom shaders for atmospheric effects.
- **Advanced Sun Effects**: Incorporates dynamic shader-based visual enhancements for the Sun, including animated solar dynamics and corona effects.
- **Cinematic Post-Processing**: Includes bloom and anti-aliasing via `@react-three/postprocessing` for a polished visual experience.
- **Interactive Controls**: Fluidly navigate the solar system with intuitive camera handling, orbit tracking, and a comprehensive informational UI.
- **Modern UI & Animations**: Smooth interactions with framer-motion and modern UI designed with Tailwind CSS.

## 🛠️ Technology Stack

- **Core Framework**: React 18, TypeScript, Vite
- **3D Engine**: Three.js, React Three Fiber (`@react-three/fiber`), React Three Drei (`@react-three/drei`)
- **Post-Processing**: React Three Postprocessing (`@react-three/postprocessing`)
- **State Management**: Zustand
- **Styling & Animation**: Tailwind CSS, Framer Motion, Lucide React (Icons)

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v16 or higher recommended) installed on your machine.

### Installation

1. Install the necessary dependencies:

```bash
npm install
```

### Running Locally

Start the Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port specified in your terminal).

### Building for Production

Create a production-ready bundle:

```bash
npm run build
```

This runs TypeScript type checking (`tsc`) and then uses Vite to generate the optimized static site into the `dist` directory. You can preview the production build using:

```bash
npm run preview
```

## 🏗️ Project Architecture

The project follows a clean, modular structure:

- `src/components/scene/`: Contains all 3D scene elements, including planetary meshes, cameras, lights, environment maps, and custom shaders.
- `src/components/ui/`: Standard 2D React DOM components for overlays, menus, planet selectors, and information panels, placed over the 3D canvas.
- `src/store/`: Centralized state management utilizing Zustand for handling global simulator states like simulation speed and currently selected targets.
- `src/utils/`: Dedicated utilities for mathematics, astronomical data, type definitions, and realistic or stylized space scaling.

## 🌐 Deploy to GitHub Pages

This repository is configured for automatic deployment with GitHub Actions.

### One-time setup

1. Push this project to the `main` branch of your repository.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Source: GitHub Actions**.

### Deployment behavior

- Workflow file: `.github/workflows/deploy-pages.yml`
- Trigger: push to `main` or `master`
- Output: Vite build from `dist/`
- Site URL: `https://neozhu.github.io/3d-solar-system-simulator/`

### Notes

- Vite `base` is set for this repository path during build.
- Local development remains unchanged (`npm run dev`).

## 🤝 Acknowledgments

- Built with modern 3D web technologies to provide an engaging educational and interactive sandbox.
