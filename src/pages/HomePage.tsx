import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { FeaturesSection } from '../components/home/FeaturesSection';
import { AdditionalFeaturesSection } from '../components/home/AdditionalFeaturesSection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';

export const HomePage: React.FC = () => {
  return (
    <main className="flex-1">
      <HeroSection />
      <FeaturesSection />
      <AdditionalFeaturesSection />
      <HowItWorksSection />
    </main>
  );
};
