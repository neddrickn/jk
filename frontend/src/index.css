@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

html, body, #root {
  height: 100%;
}

body {
  @apply bg-oxide-900 text-oxide-100 font-sans antialiased;
  font-feature-settings: "ss01", "cv11";
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(240, 141, 27, 0.08), transparent 70%),
    radial-gradient(ellipse 60% 50% at 100% 100%, rgba(240, 141, 27, 0.04), transparent 70%);
}

/* Hairline borders everywhere */
* {
  border-color: rgba(232, 230, 224, 0.08);
}

/* Custom scrollbar — looks less like a generic SaaS app */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  @apply bg-oxide-600 rounded-full;
}
::-webkit-scrollbar-thumb:hover {
  @apply bg-oxide-500;
}

/* Reusable utility classes */
@layer components {
  .section-num {
    @apply font-mono text-[11px] tracking-widest text-signal-400 uppercase;
  }

  .card {
    @apply bg-oxide-800/50 border border-oxide-700 backdrop-blur-sm;
  }

  .hairline {
    @apply border-t border-oxide-700;
  }

  .btn-primary {
    @apply inline-flex items-center gap-2 px-4 py-2 bg-signal-500 hover:bg-signal-400 text-oxide-950 font-medium text-sm transition-colors;
  }

  .btn-ghost {
    @apply inline-flex items-center gap-2 px-3 py-1.5 border border-oxide-600 hover:border-oxide-400 text-oxide-200 text-sm transition-colors;
  }

  .input-field {
    @apply w-full bg-oxide-900 border border-oxide-600 focus:border-signal-500 px-3 py-2 text-oxide-100 text-sm outline-none transition-colors placeholder:text-oxide-400;
  }

  .status-pill {
    @apply inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest;
  }

  /* Staggered fade-up on mount */
  .fade-up {
    animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-beacon {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}
.beacon {
  animation: pulse-beacon 1.6s ease-in-out infinite;
}
