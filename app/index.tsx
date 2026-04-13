import { Redirect } from 'expo-router';
import { useStore } from '../src/store';

const Index = () => {
  const onboardingDone = useStore((s) => s.onboardingDone);
  return <Redirect href={onboardingDone ? '/(tabs)' : '/onboarding/welcome'} />;
};

export default Index;
