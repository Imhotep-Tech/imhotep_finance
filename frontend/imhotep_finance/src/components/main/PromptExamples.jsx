import React from "react";

const PROMPTS = [
  "Create a portfolio website for a frontend developer named Sarah, with a modern design, a hero section, about, projects, and contact form. Use HTML, CSS, and JavaScript in one file. For images, use only links from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
  "Generate a single-file HTML/CSS/JS portfolio for a graphic designer named Alex, with a gallery section (use imgur or flickr images), animated transitions, and a dark theme. Only use images from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
  "Build a responsive portfolio page for a data scientist named Priya, including sections for bio, skills, projects (with charts using only CSS/HTML), and contact info. Use only HTML, CSS, and JavaScript. Images must be from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
  "Create a one-page resume website for a backend engineer named Ahmed, with a timeline of experience, skills, and a downloadable CV button. Use HTML, CSS, and JavaScript in one file. Images only from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
  "Make a creative portfolio for a photographer named Emily, with a fullscreen color slider, about section, and contact form. Use imgur or flickr images only (https://i.imgur.com/ or https://live.staticflickr.com/). Do not include navigation bars or navigation links.",
  "Design a portfolio for a UI/UX designer named Lucas, with a case studies section, testimonials, and a minimal, clean layout. Use HTML, CSS, and JavaScript in one file. Images only from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
  "Create a personal landing page for a student named Maria, with sections for education, projects, and social links (as text or <a> tags). Use only HTML, CSS, and JavaScript. Images only from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
  "Build a portfolio for a mobile app developer named John, featuring app screenshots as imgur or flickr images, skills, and a contact form. All code in one HTML file. Images only from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
  "Create a portfolio for a digital marketer named Zoe, with a blog section, portfolio, and contact form. Use HTML, CSS, and JavaScript. Images only from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
  "Generate a portfolio for a DevOps engineer named Max, with a section for certifications, tools, and a projects timeline. Use only HTML, CSS, and JavaScript. Images only from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
  "Build a portfolio for a game developer named Sam, with a playable mini-game demo, about section, and contact info. All code in one HTML file. Images only from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
  "Create a portfolio for a writer named Olivia, with a blog, published works, and a contact form. Use HTML, CSS, and JavaScript in one file. Images only from https://i.imgur.com/ or https://live.staticflickr.com/. Do not include navigation bars or navigation links.",
];

function PromptExamples() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-700">AI Prompt Examples</h1>
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs text-left">
          <b>Security Notice:</b> For your safety, <b>only &lt;img&gt; tags with src from <span className="underline">https://i.imgur.com/</span> or <span className="underline">https://live.staticflickr.com/</span> are allowed</b>. 
          All other images and all navigation bars/links will be removed. You may use <b>&lt;a&gt;</b> tags for external links. 
          To add images, upload them to <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">imgur.com</a> or <a href="https://www.flickr.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">flickr.com</a> and use the direct image link (starts with <span className="underline">https://i.imgur.com/</span> or <span className="underline">https://live.staticflickr.com/</span>).
          <br />
          <b>Navigation bars and navigation links are not allowed and will be removed for security.</b>
        </div>
        <p className="text-gray-600 mb-6 text-center">
          Use these prompts with your favorite AI to generate amazing portfolio pages. Click the copy icon to copy a prompt!
        </p>
        <ul className="space-y-4">
          {PROMPTS.map((prompt, idx) => (
            <PromptExample key={idx} text={prompt} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function PromptExample({ text }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };
  return (
    <li className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
      <span className="flex-1">{text}</span>
      <button
        onClick={handleCopy}
        title="Copy prompt"
        className="ml-2 text-gray-400 hover:text-purple-600 transition"
        style={{ minWidth: 24 }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" />
          <rect x="3" y="3" width="13" height="13" rx="2" stroke="currentColor" />
        </svg>
      </button>
    </li>
  );
}

export default PromptExamples;
