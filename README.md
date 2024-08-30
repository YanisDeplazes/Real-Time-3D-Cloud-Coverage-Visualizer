# Real-Time-3D-Cloud-Coverage-Visualizer

## Overview

This project is a prototype for a real-time 3D cloud coverage visualizer focused on the canton of Uri. This project demonstrates the potential for dynamic, web-based visualization of cloud coverage using Three.js and Metomatics' weather data.

![Demo](demo.gif)

## Features

- **Real-Time Data:** Fetches cloud coverage data from the Metomatics API.
- **3D Visualization:** Renders a 3D model of the canton of Uri with overlaid cloud coverage data.
- **Multiple Cloud Layers:** Visualizes low, medium, and high cloud layers at different heights.
- **Interactive 3D Scene:** Users can orbit, zoom, and pan the 3D model.

## How It Works

1. **Backend Service:** An Express server retrieves cloud coverage data from the Metomatics API.
2. **3D Rendering:** Three.js is used to render the 3D scene and display cloud data.
3. **User Interaction:** Users can select a specific date to visualize corresponding cloud coverage in the 3D model.

## Installation

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Replace the API authentication credentials in the server code with your own.
4. Start the server with `node server.js`.
5. Open `index.html` in your browser to view the prototype.

## Notes

This is a prototype and should be considered a proof of concept for future development and enhancements.
