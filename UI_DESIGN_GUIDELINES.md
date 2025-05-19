# Figma UI/UX Design Initial Prompt

**Objective:** To create consistent, high-quality, accessible, and scalable UI/UX designs by adhering to the following established guidelines and principles.

## I. Core Design Principles:

* **Visual Hierarchy:** Guide user attention effectively using variations in size, color, and spacing. Key information should be most prominent.
* **Consistency:** Maintain uniformity across the design system. This includes consistent spacing, color palettes, typography, and interaction patterns.
* **Accessibility:** Adhere to WCAG (Web Content Accessibility Guidelines). Pay close attention to contrast ratios, keyboard navigation, and ARIA landmarks.
* **Responsive Design:** Adopt a mobile-first approach. Design for the smallest screen first and then scale up to tablet and desktop.
* **Grid Systems:** Utilize an 8px base unit for all spacing and sizing. Implement 12 or 16 column grids for layout structure.

## II. Common UI Patterns Library:

### Navigation:
* **Top Navigation Bar:** Logo aligned to the left, menu items/actions to the right.
* **Bottom Tab Bar (Mobile/Tablet):** Limit to 3-5 essential items for primary navigation.
* **Hamburger Menu:** Use for secondary or less frequent navigation items, especially on mobile.
* **Breadcrumbs:** Implement for deep navigation hierarchies to show users their current location.

### Forms:
* **Labels:** Position labels clearly above their respective input fields.
* **Placeholder Text:** Use for hints or examples, not as a replacement for labels.
* **Error Messages:** Display concise and helpful error messages directly below the field in error.
* **Required Field Indicators:** Clearly mark required fields, typically with an asterisk (*).
* **Submit Buttons:** Ensure submit buttons are prominent and clearly indicate the primary action.

### Cards:
* **Structure:** Typically include an image, title, short description, and a clear call-to-action.
* **Border Radius:** Maintain consistent border radius across all cards (e.g., 4px, 8px, 12px).
* **Elevation:** Use subtle shadows to indicate elevation and differentiate cards from the background (e.g., 0-1px, 0-4px, 0-8px based on elevation level).

## III. Component Specifications:

### Buttons:
* **Primary:** Filled style with high contrast for main calls-to-action.
* **Secondary:** Outlined or ghost button style for less critical actions.
* **Minimum Size (Mobile):** Ensure touch targets are at least 44x44px.
* **States:** Design distinct states: Default, Hover, Active (Pressed), Disabled.

### Input Fields:
* **Height:** Maintain a consistent height, typically between 48px and 56px.
* **Border:** Use a 1-2px border.
* **Focus State:** Clearly indicate focus with a noticeable change in border color or shadow.
* **Validation States:** Design clear visual cues for error and success states.

### Typography:
* **H1 (Heading 1):** 32-48px
* **H2 (Heading 2):** 24-32px
* **Body Text:** 16px (ensure readability)
* **Caption/Small Text:** 12-14px
* **Line Height:** Use approximately 1.5 (150%) for body text for optimal readability. Adjust as needed for other text styles.

## IV. Industry-Specific Patterns (Adapt as Needed):

### E-commerce:
* **Product Grid Layout:** Clear, scannable grid for displaying multiple products.
* **Shopping Cart Icon:** Prominently displayed, usually in the top-right.
* **Price Prominence:** Ensure prices are clear, legible, and easily found.
* **Quick Add to Cart:** Allow users to add items to the cart with minimal friction.

### Food Delivery:
* **Category Cards:** Visually distinct cards for food categories.
* **Restaurant Cards:** Include key information like name, image, rating, and delivery time.
* **Order Tracking UI:** Intuitive interface for users to track their order status.
* **Menu Item Layouts:** Clear presentation of menu items with descriptions, prices, and customization options.

### Banking:
* **Security Indicators:** Visual cues to assure users of secure connections and actions.
* **Transaction Lists:** Clear, easy-to-scan lists of transactions with dates, amounts, and descriptions.
* **Account Balance Display:** Prominent and clear display of account balances.
* **Transfer Forms:** Secure and straightforward forms for money transfers.

## V. Color Psychology & Usage:

* **Red:** Urgency, errors, attention-grabbing (use judiciously). Suitable for food app accents.
* **Blue:** Trust, security, calmness. Often used in finance and healthcare.
* **Green:** Success, growth, confirmation, eco-friendly.
* **Orange:** Energy, enthusiasm, calls-to-action (CTAs), food-related apps.
* **Purple:** Luxury, creativity, premium branding.
* **Neutral Grays:** Ideal for backgrounds, borders, and supporting text to maintain focus on content.

## VI. Spacing & Layout Rules:

* **Base Unit:** Strictly adhere to an 8px base unit for all margins, paddings, and component dimensions.
* **Small Spacing:** 8px (1x base unit)
* **Medium Spacing:** 16px (2x base unit)
* **Large Spacing:** 24px (3x base unit)
* **Section Spacing:** 48px+ (6x base unit or more) for separating distinct content sections.
* **Container Padding:** Ensure consistent padding within all containers and content blocks.

## VII. Mobile-First Breakpoints:

* **Mobile:** Design for screen widths from 320px up to 768px.
* **Tablet:** Design for screen widths from 768px up to 1024px.
* **Desktop:** Design for screen widths 1024px and above.
* **Maximum Content Width:** Implement a maximum content width, typically between 1200px and 1400px, to maintain readability and layout integrity on very wide screens.

## VIII. Accessibility Guidelines (Reiteration & Emphasis):

* **Contrast Ratio:** Minimum 4.5:1 for normal text and 3:1 for large text (18pt or 14pt bold). Use contrast checkers.
* **Touch Targets:** Ensure all interactive elements have a minimum touch target size of 44x44px, especially on mobile.
* **Focus Indicators:** Provide clear and visible focus indicators for all interactive elements for keyboard navigation.
* **Alt Text:** Include descriptive alt text for all meaningful images.
* **Semantic HTML Structure:** While designing, think in terms of how the design would translate to semantic HTML (e.g., using proper heading tags, list elements, etc.). This aids developers in building accessible products.
* **Platform Conventions:** Be mindful of and, where appropriate, adhere to established UI conventions for target platforms (e.g., iOS Human Interface Guidelines, Android Material Design).

## IX. Initial Design Checklist (Apply during element creation):

1. **Grid Adherence:** Is the element aligned to the 8px grid system for spacing and sizing?
2. **Touch Target Size:** Is the interactive element at least 44x44px, especially on mobile views?
3. **Border Radius Consistency:** Are border radii consistent with the defined values (e.g., 4px, 8px, 12px)?
4. **Elevation & Shadows:** If using elevation, do shadows follow the defined subtle system (e.g., 0-1px, 0-4px, 0-8px)?
5. **Platform Awareness:** Does the element feel native or appropriate for the intended platform (iOS/Android/Web)?
6. **Accessibility Check:** Has contrast been checked? Is there a plan for focus states and alt text if applicable?

---

This prompt structure provides a robust foundation for UI/UX design work in Figma, promoting consistency, accessibility, and scalability. Treat this as a living document that can be refined and updated as your team or project evolves.
