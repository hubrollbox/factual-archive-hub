import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSection } from '@/components/landing/HeroSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { NotServicesSection } from '@/components/landing/NotServicesSection';
import { MethodologySection } from '@/components/landing/MethodologySection';
import { ConditionsSection } from '@/components/landing/ConditionsSection';
import { ContactSection } from '@/components/landing/ContactSection';

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
        <NotServicesSection />
        <MethodologySection />
        <ConditionsSection />
        <ContactSection />
      </main>
      <PublicFooter />
    </div>
  );
}
