import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">I</span>
                </div>
                <span className="text-xl font-bold text-[var(--text)]">Imhotep Finance</span>
              </Link>
            </div>
            <Link to="/" className="text-[var(--text-secondary)] hover:text-primary transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--border)] p-8 sm:p-12 transition-colors duration-300">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-[var(--text-secondary)] mb-8 italic">Last Updated: May 27, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Welcome to Imhotep Financial Manager. We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you as to how we look after your personal data when you use our web application and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="space-y-3 pl-5 list-disc text-[var(--text-secondary)] marker:text-primary">
              <li><strong className="text-[var(--text)]">Identity Data:</strong> Includes first name, last name, and username.</li>
              <li><strong className="text-[var(--text)]">Contact Data:</strong> Includes email address.</li>
              <li><strong className="text-[var(--text)]">Financial Data:</strong> Includes transaction details, income, expenses, budgets, financial targets, and preferred currency that you input into the app.</li>
              <li><strong className="text-[var(--text)]">Technical Data:</strong> Includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="space-y-3 pl-5 list-disc text-[var(--text-secondary)] marker:text-primary">
              <li>To register you as a new user and manage your account.</li>
              <li>To provide the financial tracking and management services within the app.</li>
              <li>To manage our relationship with you, including notifying you about changes to our terms or privacy policy.</li>
              <li>To improve our app, products/services, marketing, customer relationships, and experiences.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know. They will only process your personal data on our instructions and they are subject to a duty of confidentiality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention & Deletion</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for. If you wish to delete your account or request that we delete your personal data, you can do so by contacting us. Upon request, all your financial and personal data will be permanently removed from our active systems.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Legal Rights</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, or to object to processing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:{' '}
              <a href="mailto:imhoteptech@outlook.com" className="text-primary hover:underline font-medium">
                imhoteptech@outlook.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
