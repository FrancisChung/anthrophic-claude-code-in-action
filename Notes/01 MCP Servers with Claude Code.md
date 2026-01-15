# Prompt :
❯ Your goal is to improve the component generation prompt at @../src/lib/prompts/generation.tsx. Here's how:

1. Open a browser and navigate to localhost:3000
2. Request a basic component to be generated
3. Review the generated component and its source code
4. Identify areas for improvement
5. Update the prompt to produce better components going forward.

For now, only evaluate visual styling aspects. We don't want components generated that look like typical tailwindcss components - we want        
something more original.  


# Result:

![img.png](img.png)

Summary of Changes

Before: The generated pricing card used generic Tailwind defaults:
- bg-white, bg-gray-50 backgrounds
- Standard text-gray-900, text-gray-600 colors
- Basic rounded-lg shadow-lg
- Stock text-green-500 checkmarks
- Plain blue button

After: The same prompt now produces distinctive styling:
- Dark gradient background: bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
- Glass-morphism card: bg-white/10 backdrop-blur-xl border border-white/10
- Colored hover shadows: hover:shadow-2xl hover:shadow-indigo-500/20
- Gradient price text and button with indigo/violet tones
- Smooth transitions: transition-all duration-300
- Softer corners: rounded-2xl

Guidelines Added

The new prompt includes sections on:
- Color Palette - Use slate/zinc/stone scales, avoid default grays
- Depth & Dimension - Layered shadows, backdrop-blur, subtle borders
- Typography - tracking-tight, text gradients, purposeful font weights
- Interactive Elements - Hover transitions, transforms, focus states
- Spacing & Layout - Generous padding, rounded-xl/2xl corners
- Finishing Touches - Decorative elements, gradient dividers
