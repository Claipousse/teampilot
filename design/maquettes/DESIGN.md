---
name: TeamPilot Athletic Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#434655'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#006e2d'
  on-secondary: '#ffffff'
  secondary-container: '#7cf994'
  on-secondary-container: '#007230'
  tertiary: '#753000'
  on-tertiary: '#ffffff'
  tertiary-container: '#9a4200'
  on-tertiary-container: '#ffcab0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#7ffc97'
  secondary-fixed-dim: '#62df7d'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  stat-value:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  sidebar-width: 280px
  gutter: 20px
---

## Brand & Style

The visual identity of this design system centers on "Athletic Precision." It bridges the gap between a high-performance sports laboratory and a cutting-edge AI software suite. The goal is to evoke the feeling of elite tactical control—organized, fast, and authoritative.

The style is a hybrid of **Corporate Modern** and **High-Contrast Bold**. It borrows the rigorous density and clarity of tools like Linear, while injecting the kinetic energy found in modern sports broadcasting. White space is used intentionally to create focus, while subtle "AI-driven" accents provide a futuristic layer that distinguishes automated insights from manual data entry.

**Key Brand Attributes:**
- **Calculated:** Data is the core; every pixel feels intentional and measured.
- **Kinetic:** UI elements feel ready for action, mirroring the speed of the pitch.
- **Expert:** The interface communicates professional-grade reliability for high-stakes decision-making.

## Colors

The palette is rooted in functional athletics. The **Sporty Blue** (Primary) acts as the foundation for navigation and core actions, representing the professional stability of the platform. **Pitch Green** (Secondary) is used exclusively for positive growth, fitness readiness, and "on-pitch" success metrics.

**Energy Orange** (Accent) is the signature color for AI-driven logic. It highlights recommendations, automated insights, and areas requiring immediate tactical attention. **Functional Red** is reserved for high-friction states: player fatigue, critical injury risks, or disciplinary alerts.

The background uses a clean, cool-tinted light gray to reduce eye strain during long analytical sessions, while deep charcoal provides high-legibility contrast for typography.

## Typography

This design system utilizes **Inter** for its systematic, utilitarian clarity. The type hierarchy is designed to handle dense data without feeling cluttered. 

**Key Principles:**
- **Heavy Weights for Hierarchy:** Use Bold (700) and Extra Bold (800) for section headers and key metrics to instill a sense of athletic power.
- **Tight Letter Spacing:** Headlines use slightly negative tracking to appear more compact and "impactful," reminiscent of sports headlines.
- **Labeling:** Small, uppercase labels with increased letter spacing are used for secondary data categories, ensuring they remain legible even at minute sizes.
- **Mobile Adaptation:** Large display titles scale down aggressively on mobile to ensure tactical dashboards remain visible above the fold.

## Layout & Spacing

This design system follows a **12-column fluid grid** for desktop, optimized for a sidebar-heavy navigation model. 

**Structure:**
- **Desktop:** A fixed 280px sidebar on the left houses the main navigation. The content area uses a fluid grid with 24px margins. Cards and data visualizations should span 3, 4, 6, or 12 columns depending on importance.
- **Mobile:** Transition to a bottom-tab navigation system. Margins shrink to 16px to maximize data real estate. Content flows in a single-column stack.
- **Rhythm:** An 8px base unit (stepping down to 4px for tight internal card spacing) ensures a mathematical, "engineered" feel to the layout.

## Elevation & Depth

This design system prioritizes **Tonal Layers** over traditional heavy shadows to maintain the clean SaaS aesthetic. Depth is used to distinguish "The Field" (background) from "The Players" (interactive elements).

- **Surface Levels:** The main background is the lowest level. Cards use a pure white background with a subtle 1px border (#E5E7EB) to pop against the light gray.
- **The AI Glow:** To represent AI-powered insights, use a soft, localized outer glow in Energy Orange (#F97316) with 10% opacity. This "halo" effect signifies that a piece of data has been processed or recommended by the AI.
- **Interactive States:** On hover, buttons and cards lift slightly using a very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) to provide tactile feedback without breaking the flat, professional aesthetic.

## Shapes

The shape language balances friendliness with professional structure. **Rounded (Level 2)** is the standard, giving buttons and cards a 0.5rem base radius.

- **Standard Elements:** 0.5rem (8px) for cards, buttons, and input fields.
- **Status Badges:** Use **rounded-xl** (1.5rem / 24px) to create pill-shaped chips for status indicators like "Active," "Injured," or "Fit."
- **Data Containers:** Internal sections within cards (like heatmap containers) use a smaller **rounded-sm** (4px) to maintain a sharp, technical appearance.

## Components

### Buttons & Inputs
- **Primary Action:** Solid Sporty Blue with white text. High-contrast and bold.
- **Secondary Action:** Ghost style with #E5E7EB borders and #1F2937 text.
- **Input Fields:** Minimalist with 1px borders. Focus states use a 2px Sporty Blue outline.

### AI Insight Cards
- Distinguished by a thin Energy Orange left-border accent and the signature "AI Glow." They often contain "AI Recommendations" for squad rotation or training intensity.

### Data Visualization
- **Radar Charts:** Use for player attributes. Lines should be thin (1px) with semi-transparent Sporty Blue fills.
- **Heatmaps:** Use Pitch Green for high-intensity zones, fading to transparent. Avoid using "hot" colors (red/orange) for heatmaps to prevent confusion with injury alerts.

### Navigation
- **Desktop Sidebar:** Dark-themed (#1F2937) to provide a strong anchor to the light-themed content.
- **Mobile Bottom Nav:** High-blur frosted glass effect (Glassmorphism) to allow content to peek through while maintaining legibility of the icons.

### Status Indicators
- **Fitness Chips:** Small pill-shapes using Secondary Green for high fitness and Functional Red for fatigue. Include a small sparkline or percentage indicator for immediate context.