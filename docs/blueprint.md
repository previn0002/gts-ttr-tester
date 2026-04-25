# **App Name**: TTR Test Calculator

## Core Features:

- Input Form: User interface for entering HV Line Voltage, LV Line Voltage, selecting Vector Group, and providing Measured Ratio for each phase (R, Y, B).
- Calculations Engine: Automatically calculates Expected Ratio based on HV/LV phase voltages and the selected vector group, Measured Ratio, and Percentage Error for each phase.
- Results Display: Presents the Expected Ratio, Measured Ratio (R, Y, B), and Percentage Error for each phase in a clear, organized format below the input section.
- Pass/Fail Status: Visually indicates 'Pass' (error <= 0.5%) or 'Fail' (error > 0.5%) for each phase, utilizing distinct color coding.
- Interactive Calculations: Automatically updates calculated results and status display in real-time as input values are modified.
- Export Report as PDF: Allows users to generate and download a PDF document containing all input values, calculated results, and pass/fail statuses.
- Save Test Report Details: Provides an option to input and associate additional test report metadata (date, transformer ID, operator name) with the calculated results, stored locally.

## Style Guidelines:

- Color scheme: Light theme, emphasizing clarity and technical professionalism. Primary interactions and highlights use a clear, deep blue (#2D7ADF). A very light, cool-toned off-white (#F6F8FB) serves as the background, providing a clean canvas. An accent color of vibrant indigo (#4D4DEF) will be used for secondary interactive elements or headings, providing good contrast. Green (#28A745) signifies 'Pass' status, while red (#DC3545) indicates 'Fail' status, for immediate visual feedback.
- Body and headline font: 'Inter', a grotesque-style sans-serif known for its modern, machined, and objective aesthetic, ensuring high readability for numerical data and technical descriptions across all screen sizes.
- Use a set of minimalistic and functional line icons, consistent with an engineering and data-driven aesthetic, avoiding unnecessary embellishments. Icons should clearly communicate their purpose without distraction.
- The layout features a distinct two-section structure: input fields are clearly organized at the top, followed by a separate, dedicated area for calculation results. This arrangement maintains logical flow and supports intuitive interaction. The design ensures mobile responsiveness, adapting input fields and result tables gracefully to smaller viewports.
- Subtle and purposeful animations. Focus on transitions that provide visual feedback, such as slight hover effects on interactive elements or a smooth reveal of calculation results, enhancing usability without creating distractions.