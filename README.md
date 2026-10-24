# Fix It First – "Think before you throw."

> Frontend-Only Decision Helper Web Application for Damaged & Unwanted Items

## Overview
"Fix It First" guides users through an intuitive, evidence-based decision framework when dealing with broken, damaged, or unwanted items. Instead of defaulting to buying new, the app evaluates five distinct options:
1. **Repair**
2. **Reuse**
3. **Repurpose**
4. **Replace**
5. **Recycle / Discard**

## Key Features
- **Transparent Rule-Based Scoring Engine**: Evaluates item category, age, condition, issue severity, repair vs replace costs, safety risks, and sentimental value.
- **Replacing is Never the Default**: Replaces are treated as just one of five weighted choices.
- **Live "What If I Change...?" Simulator**: Real-time sliders allow tweaking inputs to immediately observe fit score changes.
- **Smart Cost & Eco Estimator**: Shows direct dollar savings vs replacement and kilograms of CO₂ / landfill waste avoided.
- **Safety Hazard Flagging**: Detects high-voltage electrical, lithium battery, structural, and sharp tool risks.
- **Side-by-Side Comparison Matrix**: Compare all 5 options simultaneously across cost, time, difficulty, eco score, and safety.
- **Interactive DIY Step-by-Step Guides**: Visual cards showing tools, estimated time, and actionable steps.
- **Session Storage History & LocalStorage Favorites**: Fast session tracking and persistent favoriting with zero backend.
- **Before / After Inspiration Gallery**: Real-world repair, reuse, and upcycling ideas.
- **Accessibility & Theming**: Dark mode, light mode, and high-contrast mode with full keyboard navigation and print styles.

## Running Locally
You can open `index.html` directly in any modern browser, or host with a simple static server:
```bash
python3 -m http.server 8080
```
Then visit `http://localhost:8080/`.
