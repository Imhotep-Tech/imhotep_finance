import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/common/Footer';
import Logo from '../../assets/Logo.jpeg';
import LanguageToggle from '../../components/common/LanguageToggle';
import { useTranslation } from '../../contexts/LanguageContext';
import { versionEntries } from '../../utils/versionData';

// Features data with emojis
const features = [
  {
    icon: "💸",
    titleKey: "landing.featuresList.expenseTracking.title",
    descKey: "landing.featuresList.expenseTracking.desc"
  },
  {
    icon: "📱",
    titleKey: "landing.featuresList.crossPlatform.title",
    descKey: "landing.featuresList.crossPlatform.desc"
  },
  {
    icon: "🌍",
    titleKey: "landing.featuresList.multiCurrency.title",
    descKey: "landing.featuresList.multiCurrency.desc"
  },
  {
    icon: "📍",
    titleKey: "landing.featuresList.analyticsPlaces.title",
    descKey: "landing.featuresList.analyticsPlaces.desc"
  },
  {
    icon: "🛡️",
    titleKey: "landing.featuresList.securePrivate.title",
    descKey: "landing.featuresList.securePrivate.desc"
  },
  {
    icon: "⏰",
    titleKey: "landing.featuresList.scheduledTrans.title",
    descKey: "landing.featuresList.scheduledTrans.desc"
  },
];

const featuresAdded = versionEntries.reduce((total, entry) => total + entry.bullets.length, 0);

const calculateDevelopmentMonths = () => {
  if (versionEntries.length < 2) {
    return 0;
  }

  const latestRelease = new Date(versionEntries[0].date);
  const earliestRelease = new Date(versionEntries[versionEntries.length - 1].date);

  if (Number.isNaN(latestRelease.getTime()) || Number.isNaN(earliestRelease.getTime())) {
    return 0;
  }

  let months = (latestRelease.getFullYear() - earliestRelease.getFullYear()) * 12
    + (latestRelease.getMonth() - earliestRelease.getMonth());

  if (latestRelease.getDate() < earliestRelease.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
};

const developmentMonths = calculateDevelopmentMonths();

function LandingPage() {
  const { t } = useTranslation();
  const [currentFeature, setCurrentFeature] = useState(0);

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-[var(--bg)] text-[var(--text)] transition-colors"
    >
      {/* Top right language switch */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full filter blur-xl opacity-18 animate-float bg-[rgba(26,53,53,0.9)] dark:bg-teal-800/40" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full filter blur-xl opacity-16 animate-float bg-[#2f7775] dark:bg-cyan-700/30 dark:mix-blend-screen" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <div className="inline-block p-4 bg-white dark:bg-gray-900 rounded-full mb-6 shadow-2xl border border-gray-100 dark:border-gray-800">
            <img src={Logo} alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
            {t('landing.hero.titlePre')}{' '}
            <span className="bg-gradient-to-r from-[#366c6b] to-[#1a3535] bg-clip-text text-transparent">
              {t('landing.hero.titleHighlight')}
            </span>
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl text-[#1a3535] dark:text-gray-300 mb-8 font-medium max-w-4xl mx-auto leading-relaxed opacity-90">
            {t('landing.hero.description')}
          </p>
          <div className="max-w-4xl mx-auto mb-10 rounded-2xl border border-[#366c6b]/20 bg-white/80 dark:bg-gray-900/70 p-5 sm:p-6 shadow-lg">
            <p className="text-base sm:text-lg text-[#1a3535] dark:text-gray-200 font-medium mb-3">
              {t('landing.hero.selfHostTitle')}
            </p>
            <p className="text-sm sm:text-base text-[#366c6b] dark:text-emerald-400">
              {t('landing.hero.selfHostDocs')}
              {' '}
              <a
                href="https://github.com/Imhotep-Tech/imhotep_finance/blob/main/.docs/SELF_HOSTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:opacity-80"
              >
                {t('landing.hero.selfHostGuide')}
              </a>
              {' '}
              {t('landing.hero.and')}
              {' '}
              <a
                href="https://github.com/Imhotep-Tech/imhotep_finance/blob/main/.docs/DEVELOPMENT_WORKFLOW.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:opacity-80"
              >
                {t('landing.hero.devWorkflow')}
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/register"
              className="chef-button text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
              }}
            >
              🚀 {t('landing.hero.cta')}
            </Link>
            <Link
              to="/login"
              className="chef-button text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg border-2 border-white transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
              }}
            >
              🔓 {t('landing.hero.login')}
            </Link>
            <Link
              to="/download-app"
              className="chef-button text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg border-2 border-white transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
              }}
            >
              📥 {t('common.navigation.downloadApp')}
            </Link>
          </div>
          {/* Stats */}
          <div className="mt-16 flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
              <div className="glass-effect rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-300 bg-white/80 dark:bg-gray-900/60">
                <div className="text-3xl font-bold text-[#366c6b] dark:text-emerald-400 mb-2">170+</div>
                <div className="text-[#1a3535] dark:text-gray-300 opacity-90">{t('landing.stats.currenciesSupported')}</div>
              </div>
              <div className="glass-effect rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-300 bg-white/80 dark:bg-gray-900/60">
                <div className="text-3xl font-bold text-[#366c6b] dark:text-emerald-400 mb-2">{featuresAdded}+</div>
                <div className="text-[#1a3535] dark:text-gray-300 opacity-90">{t('landing.stats.featuresAdded')}</div>
              </div>
              <div className="glass-effect rounded-lg p-6 text-center transform hover:scale-105 transition-all duration-300 bg-white/80 dark:bg-gray-900/60">
                <div className="text-3xl font-bold text-[#366c6b] dark:text-emerald-400 mb-2">{developmentMonths} {t('landing.stats.months')}</div>
                <div className="text-[#1a3535] dark:text-gray-300 opacity-90">{t('landing.stats.developmentTime')}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-[#366c6b] animate-bounce">
          <i className="fas fa-chevron-down text-2xl"></i>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1a3535] dark:text-gray-100 mb-4">
              {t('landing.featuresSection.title')}
            </h2>
            <p className="text-xl text-[#366c6b] dark:text-emerald-400">
              {t('landing.featuresSection.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 bg-[#eaf6f6] dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#1a3535] dark:text-gray-100 mb-4">{t(feature.titleKey)}</h3>
                <p className="text-[#366c6b] dark:text-emerald-400">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1a3535] dark:text-gray-100 mb-4">
              {t('landing.steps.title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-[#366c6b] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-[#1a3535] dark:text-gray-100 mb-4">{t('landing.steps.step1Title')}</h3>
              <p className="text-[#366c6b] dark:text-emerald-400">{t('landing.steps.step1Desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-[#366c6b] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-[#1a3535] dark:text-gray-100 mb-4">{t('landing.steps.step2Title')}</h3>
              <p className="text-[#366c6b] dark:text-emerald-400">{t('landing.steps.step2Desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-[#366c6b] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-[#1a3535] dark:text-gray-100 mb-4">{t('landing.steps.step3Title')}</h3>
              <p className="text-[#366c6b] dark:text-emerald-400">{t('landing.steps.step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('landing.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="chef-button text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
              }}
            >
              🚀 {t('landing.cta.startJourney')}
            </Link>
            <Link
              to="/login"
              className="chef-button text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg border-2 border-white transition-all duration-300 transform hover:scale-105"
              style={{
                background: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
              }}
            >
              🔓 {t('landing.cta.signIn')}
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
export default LandingPage;