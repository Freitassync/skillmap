export type RootStackParamList = {
  OnboardingCadastro: undefined;
  Login: undefined;
  Cadastro: undefined;
  OnboardingLogin: undefined;
  MainTabs: undefined; // Bottom Tab Navigator
  Home: undefined;
  GeradorRoadmap: undefined;
  RoadmapTracker: undefined;
  ChatBot: undefined;
  SkillDetail: {
    skillId: string;
    roadmapId: string;
  };
};

export type TabParamList = {
  Home: undefined;
  GeradorRoadmap: undefined;
  RoadmapTracker: undefined;
  ChatBot: undefined;
};
