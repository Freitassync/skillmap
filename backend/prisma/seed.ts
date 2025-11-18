import { PrismaClient } from '@prisma/client';
import logger from '../src/lib/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Seeding database...');

  // Seed skills data
  const skills = [
    // Programming Languages
    { name: 'JavaScript', description: 'Linguagem de programação essencial para desenvolvimento web', type: 'hard', category: 'Programming Languages' },
    { name: 'TypeScript', description: 'Superset do JavaScript com tipagem estática', type: 'hard', category: 'Programming Languages' },
    { name: 'Python', description: 'Linguagem versátil para web, data science e automação', type: 'hard', category: 'Programming Languages' },
    { name: 'Java', description: 'Linguagem robusta para aplicações enterprise', type: 'hard', category: 'Programming Languages' },
    { name: 'C#', description: 'Linguagem Microsoft para desenvolvimento .NET', type: 'hard', category: 'Programming Languages' },
    { name: 'Go', description: 'Linguagem do Google para sistemas e microserviços', type: 'hard', category: 'Programming Languages' },
    { name: 'Rust', description: 'Linguagem focada em segurança e performance', type: 'hard', category: 'Programming Languages' },
    { name: 'PHP', description: 'Linguagem server-side para desenvolvimento web', type: 'hard', category: 'Programming Languages' },
    { name: 'Ruby', description: 'Linguagem elegante focada em produtividade', type: 'hard', category: 'Programming Languages' },
    { name: 'Swift', description: 'Linguagem da Apple para desenvolvimento iOS', type: 'hard', category: 'Programming Languages' },
    { name: 'Kotlin', description: 'Linguagem moderna para Android e JVM', type: 'hard', category: 'Programming Languages' },
    
    // Frontend Development
    { name: 'React', description: 'Biblioteca JavaScript para interfaces de usuário', type: 'hard', category: 'Frontend Development' },
    { name: 'Vue.js', description: 'Framework progressivo para interfaces web', type: 'hard', category: 'Frontend Development' },
    { name: 'Angular', description: 'Framework completo do Google para SPAs', type: 'hard', category: 'Frontend Development' },
    { name: 'Next.js', description: 'Framework React para produção', type: 'hard', category: 'Frontend Development' },
    { name: 'HTML/CSS', description: 'Fundamentos de marcação e estilização web', type: 'hard', category: 'Frontend Development' },
    { name: 'Tailwind CSS', description: 'Framework CSS utility-first', type: 'hard', category: 'Frontend Development' },
    { name: 'Redux', description: 'Gerenciamento de estado para aplicações JavaScript', type: 'hard', category: 'Frontend Development' },
    { name: 'Webpack', description: 'Bundler de módulos para aplicações JavaScript', type: 'hard', category: 'Frontend Development' },
    { name: 'Responsive Design', description: 'Criação de interfaces adaptáveis', type: 'hard', category: 'Frontend Development' },
    { name: 'Web Accessibility', description: 'Desenvolvimento inclusivo e acessível', type: 'hard', category: 'Frontend Development' },
    
    // Backend Development
    { name: 'Node.js', description: 'Runtime JavaScript server-side', type: 'hard', category: 'Backend Development' },
    { name: 'Express.js', description: 'Framework web minimalista para Node.js', type: 'hard', category: 'Backend Development' },
    { name: 'Django', description: 'Framework Python de alto nível', type: 'hard', category: 'Backend Development' },
    { name: 'Flask', description: 'Micro framework Python flexível', type: 'hard', category: 'Backend Development' },
    { name: 'Spring Boot', description: 'Framework Java para aplicações enterprise', type: 'hard', category: 'Backend Development' },
    { name: 'NestJS', description: 'Framework Node.js progressivo com TypeScript', type: 'hard', category: 'Backend Development' },
    { name: 'GraphQL', description: 'Linguagem de consulta para APIs', type: 'hard', category: 'Backend Development' },
    { name: 'RESTful APIs', description: 'Arquitetura de APIs web', type: 'hard', category: 'Backend Development' },
    { name: 'Microservices', description: 'Arquitetura de serviços distribuídos', type: 'hard', category: 'Backend Development' },
    { name: 'API Security', description: 'Segurança de APIs e autenticação', type: 'hard', category: 'Backend Development' },
    
    // Database
    { name: 'PostgreSQL', description: 'Banco de dados relacional avançado', type: 'hard', category: 'Database' },
    { name: 'MongoDB', description: 'Banco de dados NoSQL orientado a documentos', type: 'hard', category: 'Database' },
    { name: 'MySQL', description: 'Sistema de gerenciamento de banco relacional', type: 'hard', category: 'Database' },
    { name: 'Redis', description: 'Armazenamento em memória para cache', type: 'hard', category: 'Database' },
    { name: 'SQL', description: 'Linguagem de consulta estruturada', type: 'hard', category: 'Database' },
    { name: 'Database Design', description: 'Modelagem e otimização de dados', type: 'hard', category: 'Database' },
    { name: 'ORM (Prisma/TypeORM)', description: 'Mapeamento objeto-relacional', type: 'hard', category: 'Database' },
    
    // DevOps & Cloud
    { name: 'Docker', description: 'Plataforma de containerização', type: 'hard', category: 'DevOps & Cloud' },
    { name: 'Kubernetes', description: 'Orquestração de containers', type: 'hard', category: 'DevOps & Cloud' },
    { name: 'AWS', description: 'Amazon Web Services', type: 'hard', category: 'DevOps & Cloud' },
    { name: 'CI/CD', description: 'Integração e entrega contínuas', type: 'hard', category: 'DevOps & Cloud' },
    { name: 'Linux', description: 'Sistema operacional e administração', type: 'hard', category: 'DevOps & Cloud' },
    { name: 'Nginx', description: 'Servidor web e proxy reverso', type: 'hard', category: 'DevOps & Cloud' },
    { name: 'Terraform', description: 'Infrastructure as Code', type: 'hard', category: 'DevOps & Cloud' },
    
    // Testing
    { name: 'Jest', description: 'Framework de testes JavaScript', type: 'hard', category: 'Testing' },
    { name: 'Unit Testing', description: 'Testes de unidades de código', type: 'hard', category: 'Testing' },
    { name: 'Integration Testing', description: 'Testes de integração entre componentes', type: 'hard', category: 'Testing' },
    { name: 'E2E Testing', description: 'Testes end-to-end de aplicações', type: 'hard', category: 'Testing' },
    { name: 'TDD', description: 'Test-Driven Development', type: 'hard', category: 'Testing' },
    
    // Soft Skills
    { name: 'Comunicação', description: 'Capacidade de expressar ideias claramente', type: 'soft', category: 'Communication' },
    { name: 'Trabalho em Equipe', description: 'Colaboração efetiva com colegas', type: 'soft', category: 'Teamwork' },
    { name: 'Resolução de Problemas', description: 'Análise e solução de desafios', type: 'soft', category: 'Problem Solving' },
    { name: 'Pensamento Crítico', description: 'Avaliação lógica e objetiva', type: 'soft', category: 'Critical Thinking' },
    { name: 'Adaptabilidade', description: 'Flexibilidade a mudanças', type: 'soft', category: 'Adaptability' },
    { name: 'Gestão de Tempo', description: 'Organização e priorização de tarefas', type: 'soft', category: 'Time Management' },
    { name: 'Liderança', description: 'Influência e orientação de equipes', type: 'soft', category: 'Leadership' },
    { name: 'Criatividade', description: 'Geração de ideias inovadoras', type: 'soft', category: 'Creativity' },
    { name: 'Aprendizado Contínuo', description: 'Busca constante por conhecimento', type: 'soft', category: 'Learning' },
    { name: 'Inteligência Emocional', description: 'Gestão de emoções próprias e alheias', type: 'soft', category: 'Emotional Intelligence' },
  ];

  for (const skill of skills) {
    await prisma.skill.create({
      data: skill as any,
    });
  }

  logger.info('Seeding completed!');
}

main()
  .catch((e) => {
    logger.error(' Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
