# Mind Forge

Mind Forge is a professional cognitive training platform designed to enhance mental arithmetic and memory skills through focused, distraction-free exercises. Built with a "dark mode first" philosophy, it prioritizes visual clarity and cognitive engagement.

## Features

### Flash Mental Arithmetic
A rapid-fire arithmetic training module where numbers flash on the screen in quick succession.
*   Configurable difficulty: 1-5 digits per number
*   Adjustable sequence length: 3-20 numbers
*   Speed control: 10ms to 2000ms display intervals
*   Instant visual feedback with audio cues

### Chimpanzee Memory Test
Based on primate cognitive research, this test challenges working memory and spatial tracking.
*   Grid-based layout (8x5)
*   Flash memorization of number positions (0-9)
*   Sequential recall requirement
*   Adaptive recall phases

### Advanced Sequential Memory Cards
A demanding test of sequential visual memory involving object permanence and tracking.
*   5 unique symbol cards
*   10 consecutive shuffle rounds
*   Explicit card state management (Face Up/Down)
*   Comprehensive scoring system

## Tech Stack

*   **Framework**: Next.js 15+ (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Animations**: GSAP (GreenSock Animation Platform)
*   **Audio**: Web Audio API

## Design Philosophy

The platform follows a strict design ethos:
*   **Serious & Professional**: No gamified clutter or distractions.
*   **Visual Clarity**: High-contrast dark theme (`#0a0a0a`) with crimson accents (`#c41e3a`) for focus.
*   **Input Precision**: Custom-styled controls for scientifically accurate settings.
*   **Performance**: Optimized animations and instant state updates for accurate timing.

## Getting Started

### Prerequisites
*   Node.js 18.17.0 or later

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/mind-forge.git
    cd mind-forge
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm start`: Runs the built application in production mode.
*   `npm run lint`: Runs ESLint to check for code quality issues.

## License

This project is licensed under the MIT License.
