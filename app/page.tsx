import ChatUI from "./components/ChatUI";

export default function Home() {
  return (
    <main className="st-bg min-h-screen text-fg">
      {/* HEADER */}
      <header className="st-header">
        <div className="logo">SUBSCRIPTION AUDITOR</div>
        <nav>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
          <a href="#testimonials">Testimonials</a>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <h1>Uncover Hidden Subscriptions.</h1>
        <h2>Powered by AI. Inspired by the Upside Down.</h2>
        <p>Your wallet has secrets. We help you find them.</p>
      </section>

      {/* CHATBOT SECTION */}
      <section className="chat-section">
        <ChatUI />
      </section>

      {/* FEATURES */}
      <section id="features" className="section">
        <h2 className="section-title">Features</h2>
        <ul className="st-list">
          <li>🧠 AI-powered subscription optimization</li>
          <li>💸 Detect wasteful “ghost” payments</li>
          <li>🔮 Personalized downgrade & switch suggestions</li>
          <li>📉 Expense scoring with recommendations</li>
          <li>🔗 Deep links to cancellation pages</li>
        </ul>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section">
        <h2 className="section-title">Pricing</h2>
        <p className="pricing-note">
          Free during beta. Paid plans coming soon.
        </p>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="section">
        <h2 className="section-title">What People Say</h2>
        <div className="testimonials">
          <p>“It found 3 subscriptions I forgot existed!” – Arjun</p>
          <p>“Looks like Stranger Things, but saves me money.” – Riddhi</p>
          <p>“I saved ₹2,400/month. Worth it.” – Manish</p>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <h2 className="section-title">About Us</h2>
        <p>
          Subscription Auditor (Lite) is an AI tool designed to help users
          uncover unnecessary expenses, discover cheaper alternatives, and take
          control of their financial lives — wrapped in a stylish Stranger
          Things theme.
        </p>
      </section>

      {/* FOOTER / DISCLAIMER */}
      <footer className="footer">
        <p>
          ⚠ Disclaimer: This tool provides estimated suggestions only. Pricing,
          availability, and recommendations may vary by region and change over
          time. Always double-check final prices and terms with the provider.
        </p>
      </footer>
    </main>
  );
}
