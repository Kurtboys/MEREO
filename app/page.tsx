export default function DesignSystemTest() {
  return (
    <div className="min-h-screen p-8 md:p-12 lg:p-16">
      {/* Header */}
      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
          MEREO
        </h1>
        <p className="text-text-secondary text-lg">
          Brutalist Void Calendar - Design System Test
        </p>
      </header>

      {/* Timer Sample */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Timer Display (JetBrains Mono)
        </h2>
        <div className="bg-surface rounded-lg p-8 inline-block">
          <span className="timer-display text-text-primary">47:23</span>
        </div>
        <div className="mt-4 bg-surface rounded-lg p-8 inline-block ml-4">
          <span className="timer-display text-status-warning animate-pulse-slow">
            +03:45
          </span>
        </div>
      </section>

      {/* Typography */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Typography
        </h2>
        <div className="space-y-4 bg-surface rounded-lg p-8">
          <p className="text-3xl font-semibold">
            Mission Title (24-32px, Semibold)
          </p>
          <p className="text-lg text-text-primary">
            Body text in Inter - Primary color (#E5E5E5)
          </p>
          <p className="text-lg text-text-secondary">
            Secondary text for less important info (#737373)
          </p>
          <p className="text-lg text-text-disabled">
            Disabled text state (#525252)
          </p>
          <p className="font-mono text-lg">
            Monospace text in JetBrains Mono for code and timers
          </p>
        </div>
      </section>

      {/* Background Colors */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Background Colors
        </h2>
        <div className="flex flex-wrap gap-4">
          <ColorSwatch
            name="Void"
            color="bg-void"
            hex="#0A0A0A"
            textLight
          />
          <ColorSwatch
            name="Surface"
            color="bg-surface"
            hex="#141414"
            textLight
          />
          <ColorSwatch
            name="Surface Hover"
            color="bg-surface-hover"
            hex="#1A1A1A"
            textLight
          />
        </div>
      </section>

      {/* Border Colors */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Border Colors
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="w-32 h-32 bg-surface border-2 border-border-subtle rounded-lg flex flex-col items-center justify-center p-4">
            <span className="text-sm text-text-secondary">Subtle</span>
            <span className="text-xs text-text-disabled mt-1">#2A2A2A</span>
          </div>
          <div className="w-32 h-32 bg-surface border-2 border-border-focus rounded-lg flex flex-col items-center justify-center p-4 animate-glow">
            <span className="text-sm text-text-secondary">Focus</span>
            <span className="text-xs text-text-disabled mt-1">#3B82F6</span>
          </div>
        </div>
      </section>

      {/* Accent Colors */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Accent Colors
        </h2>
        <div className="flex flex-wrap gap-4">
          <ColorSwatch
            name="Accent"
            color="bg-accent"
            hex="#3B82F6"
          />
          <ColorSwatch
            name="Accent Hover"
            color="bg-accent-hover"
            hex="#2563EB"
          />
        </div>
      </section>

      {/* Status Colors */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Status Colors
        </h2>
        <div className="flex flex-wrap gap-4">
          <ColorSwatch
            name="Warning"
            color="bg-status-warning"
            hex="#F59E0B"
          />
          <ColorSwatch
            name="Success"
            color="bg-status-success"
            hex="#10B981"
          />
          <ColorSwatch
            name="Bottleneck"
            color="bg-status-bottleneck"
            hex="#EF4444"
          />
        </div>
      </section>

      {/* Sticky Note Colors */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Sticky Note Colors (Muted/Dark)
        </h2>
        <div className="flex flex-wrap gap-4">
          <ColorSwatch
            name="Yellow"
            color="bg-sticky-yellow"
            hex="#78716C"
          />
          <ColorSwatch
            name="Pink"
            color="bg-sticky-pink"
            hex="#9D7A8C"
          />
          <ColorSwatch
            name="Blue"
            color="bg-sticky-blue"
            hex="#64748B"
          />
          <ColorSwatch
            name="Green"
            color="bg-sticky-green"
            hex="#5F7A6A"
          />
          <ColorSwatch
            name="Purple"
            color="bg-sticky-purple"
            hex="#7C6F93"
          />
        </div>
      </section>

      {/* Edge/Arrow Colors */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Edge/Arrow Colors
        </h2>
        <div className="flex flex-wrap gap-4">
          <ColorSwatch
            name="Default"
            color="bg-edge"
            hex="#3A3A3A"
            textLight
          />
          <ColorSwatch
            name="Active"
            color="bg-edge-active"
            hex="#3B82F6"
          />
          <ColorSwatch
            name="Complete"
            color="bg-edge-complete"
            hex="#10B981"
          />
        </div>
      </section>

      {/* Interactive Elements */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Interactive Elements
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <button className="px-6 py-3 bg-accent hover:bg-accent-hover text-void font-semibold rounded-lg transition-colors duration-200">
            Primary Button
          </button>
          <button className="px-6 py-3 bg-surface hover:bg-surface-hover border border-border-subtle text-text-primary rounded-lg transition-colors duration-200">
            Secondary Button
          </button>
          <button className="px-6 py-3 bg-status-bottleneck hover:opacity-90 text-void font-semibold rounded-lg transition-opacity duration-200">
            Bottleneck
          </button>
        </div>
      </section>

      {/* Sample Mission Card */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Sample Mission Node
        </h2>
        <div className="max-w-xs">
          <div className="bg-surface rounded-lg border-l-4 border-accent p-5 hover:bg-surface-hover transition-colors duration-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              <span className="text-xs font-medium text-accent uppercase tracking-wide">
                Active
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Design System Setup</h3>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <span>90 min</span>
              <span className="text-border-subtle">|</span>
              <span>5 checkpoints</span>
            </div>
          </div>
        </div>
      </section>

      {/* Animation Demos */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Animations
        </h2>
        <div className="flex flex-wrap gap-8 items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-surface rounded-lg animate-pulse-slow flex items-center justify-center">
              <span className="text-accent font-mono">8s</span>
            </div>
            <span className="text-sm text-text-secondary">Slow Pulse</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-surface rounded-lg animate-glow border border-accent flex items-center justify-center">
              <span className="text-accent font-mono">2s</span>
            </div>
            <span className="text-sm text-text-secondary">Glow</span>
          </div>
        </div>
      </section>

      {/* Spacing Demo */}
      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-6 text-text-secondary">
          Generous Spacing (The Void IS the Feature)
        </h2>
        <div className="flex gap-8">
          <div className="bg-surface rounded-lg p-4 w-24 h-24 flex items-center justify-center">
            <span className="text-xs text-text-secondary">16px</span>
          </div>
          <div className="bg-surface rounded-lg p-8 w-32 h-32 flex items-center justify-center">
            <span className="text-xs text-text-secondary">32px</span>
          </div>
          <div className="bg-surface rounded-lg p-12 w-40 h-40 flex items-center justify-center">
            <span className="text-xs text-text-secondary">48px</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-border-subtle">
        <div className="flex items-center justify-between">
          <p className="text-text-secondary text-sm">
            MEREO Design System v1.0 - Ready for Implementation
          </p>
          <a
            href="/store-test"
            className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border-subtle text-text-primary rounded-lg transition-colors text-sm"
          >
            Test Store &rarr;
          </a>
        </div>
      </footer>
    </div>
  );
}

function ColorSwatch({
  name,
  color,
  hex,
  textLight = false,
}: {
  name: string;
  color: string;
  hex: string;
  textLight?: boolean;
}) {
  return (
    <div
      className={`w-32 h-32 ${color} rounded-lg flex flex-col items-center justify-center p-4 transition-transform duration-200 hover:scale-105`}
    >
      <span
        className={`text-sm font-medium ${textLight ? "text-text-primary" : "text-void"}`}
      >
        {name}
      </span>
      <span
        className={`text-xs mt-1 font-mono ${textLight ? "text-text-secondary" : "text-void/70"}`}
      >
        {hex}
      </span>
    </div>
  );
}
