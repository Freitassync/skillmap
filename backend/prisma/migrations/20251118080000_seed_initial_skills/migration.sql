-- Migration: Seed Initial Skills
-- Description: Populates the skills table with initial data for the application

-- Insert skills (idempotent - will not duplicate if already exists)
INSERT INTO skills (id, name, description, type, category) VALUES
-- Programming Languages
(gen_random_uuid(), 'JavaScript', 'Linguagem de programação essencial para desenvolvimento web', 'hard', 'Programming Languages'),
(gen_random_uuid(), 'TypeScript', 'Superset do JavaScript com tipagem estática', 'hard', 'Programming Languages'),
(gen_random_uuid(), 'Python', 'Linguagem versátil para web, data science e automação', 'hard', 'Programming Languages'),
(gen_random_uuid(), 'Java', 'Linguagem robusta para aplicações enterprise', 'hard', 'Programming Languages'),
(gen_random_uuid(), 'C#', 'Linguagem Microsoft para desenvolvimento .NET', 'hard', 'Programming Languages'),
(gen_random_uuid(), 'Go', 'Linguagem do Google para sistemas e microserviços', 'hard', 'Programming Languages'),
(gen_random_uuid(), 'Rust', 'Linguagem focada em segurança e performance', 'hard', 'Programming Languages'),
(gen_random_uuid(), 'PHP', 'Linguagem server-side para desenvolvimento web', 'hard', 'Programming Languages'),
(gen_random_uuid(), 'Ruby', 'Linguagem elegante focada em produtividade', 'hard', 'Programming Languages'),
(gen_random_uuid(), 'Swift', 'Linguagem da Apple para desenvolvimento iOS', 'hard', 'Programming Languages'),
(gen_random_uuid(), 'Kotlin', 'Linguagem moderna para Android e JVM', 'hard', 'Programming Languages'),

-- Frontend Development
(gen_random_uuid(), 'React', 'Biblioteca JavaScript para interfaces de usuário', 'hard', 'Frontend Development'),
(gen_random_uuid(), 'Vue.js', 'Framework progressivo para interfaces web', 'hard', 'Frontend Development'),
(gen_random_uuid(), 'Angular', 'Framework completo do Google para SPAs', 'hard', 'Frontend Development'),
(gen_random_uuid(), 'Next.js', 'Framework React para produção', 'hard', 'Frontend Development'),
(gen_random_uuid(), 'HTML/CSS', 'Fundamentos de marcação e estilização web', 'hard', 'Frontend Development'),
(gen_random_uuid(), 'Tailwind CSS', 'Framework CSS utility-first', 'hard', 'Frontend Development'),
(gen_random_uuid(), 'Redux', 'Gerenciamento de estado para aplicações JavaScript', 'hard', 'Frontend Development'),
(gen_random_uuid(), 'Webpack', 'Bundler de módulos para aplicações JavaScript', 'hard', 'Frontend Development'),
(gen_random_uuid(), 'Responsive Design', 'Criação de interfaces adaptáveis', 'hard', 'Frontend Development'),
(gen_random_uuid(), 'Web Accessibility', 'Desenvolvimento inclusivo e acessível', 'hard', 'Frontend Development'),

-- Backend Development
(gen_random_uuid(), 'Node.js', 'Runtime JavaScript server-side', 'hard', 'Backend Development'),
(gen_random_uuid(), 'Express.js', 'Framework web minimalista para Node.js', 'hard', 'Backend Development'),
(gen_random_uuid(), 'Django', 'Framework Python de alto nível', 'hard', 'Backend Development'),
(gen_random_uuid(), 'Flask', 'Micro framework Python flexível', 'hard', 'Backend Development'),
(gen_random_uuid(), 'Spring Boot', 'Framework Java para aplicações enterprise', 'hard', 'Backend Development'),
(gen_random_uuid(), 'NestJS', 'Framework Node.js progressivo com TypeScript', 'hard', 'Backend Development'),
(gen_random_uuid(), 'GraphQL', 'Linguagem de consulta para APIs', 'hard', 'Backend Development'),
(gen_random_uuid(), 'RESTful APIs', 'Arquitetura de APIs web', 'hard', 'Backend Development'),
(gen_random_uuid(), 'Microservices', 'Arquitetura de serviços distribuídos', 'hard', 'Backend Development'),
(gen_random_uuid(), 'API Security', 'Segurança de APIs e autenticação', 'hard', 'Backend Development'),
(gen_random_uuid(), 'Estruturas de Dados e Algoritmos', 'Estruturas de dados e algoritmos fundamentais', 'hard', 'Backend Development'),

-- Database
(gen_random_uuid(), 'PostgreSQL', 'Banco de dados relacional avançado', 'hard', 'Database'),
(gen_random_uuid(), 'MongoDB', 'Banco de dados NoSQL orientado a documentos', 'hard', 'Database'),
(gen_random_uuid(), 'MySQL', 'Sistema de gerenciamento de banco relacional', 'hard', 'Database'),
(gen_random_uuid(), 'Redis', 'Armazenamento em memória para cache', 'hard', 'Database'),
(gen_random_uuid(), 'SQL', 'Linguagem de consulta estruturada', 'hard', 'Database'),
(gen_random_uuid(), 'Database Design', 'Modelagem e otimização de dados', 'hard', 'Database'),
(gen_random_uuid(), 'ORM (Prisma/TypeORM)', 'Mapeamento objeto-relacional', 'hard', 'Database'),

-- DevOps & Cloud
(gen_random_uuid(), 'Docker', 'Plataforma de containerização', 'hard', 'DevOps & Cloud'),
(gen_random_uuid(), 'Kubernetes', 'Orquestração de containers', 'hard', 'DevOps & Cloud'),
(gen_random_uuid(), 'AWS', 'Amazon Web Services', 'hard', 'DevOps & Cloud'),
(gen_random_uuid(), 'CI/CD', 'Integração e entrega contínuas', 'hard', 'DevOps & Cloud'),
(gen_random_uuid(), 'Linux', 'Sistema operacional e administração', 'hard', 'DevOps & Cloud'),
(gen_random_uuid(), 'Nginx', 'Servidor web e proxy reverso', 'hard', 'DevOps & Cloud'),
(gen_random_uuid(), 'Terraform', 'Infrastructure as Code', 'hard', 'DevOps & Cloud'),

-- Testing
(gen_random_uuid(), 'Jest', 'Framework de testes JavaScript', 'hard', 'Testing'),
(gen_random_uuid(), 'Unit Testing', 'Testes de unidades de código', 'hard', 'Testing'),
(gen_random_uuid(), 'Integration Testing', 'Testes de integração entre componentes', 'hard', 'Testing'),
(gen_random_uuid(), 'E2E Testing', 'Testes end-to-end de aplicações', 'hard', 'Testing'),
(gen_random_uuid(), 'TDD', 'Test-Driven Development', 'hard', 'Testing'),

-- Soft Skills
(gen_random_uuid(), 'Comunicação', 'Capacidade de expressar ideias claramente', 'soft', 'Communication'),
(gen_random_uuid(), 'Trabalho em Equipe', 'Colaboração efetiva com colegas', 'soft', 'Teamwork'),
(gen_random_uuid(), 'Resolução de Problemas', 'Análise e solução de desafios', 'soft', 'Problem Solving'),
(gen_random_uuid(), 'Pensamento Crítico', 'Avaliação lógica e objetiva', 'soft', 'Critical Thinking'),
(gen_random_uuid(), 'Gestão de Tempo', 'Organização e priorização de tarefas', 'soft', 'Time Management'),
(gen_random_uuid(), 'Liderança', 'Influência e orientação de equipes', 'soft', 'Leadership'),
(gen_random_uuid(), 'Criatividade', 'Geração de ideias inovadoras', 'soft', 'Creativity'),
(gen_random_uuid(), 'Aprendizado Contínuo', 'Busca constante por conhecimento', 'soft', 'Learning'),
(gen_random_uuid(), 'Inteligência Emocional', 'Gestão de emoções próprias e alheias', 'soft', 'Emotional Intelligence')
ON CONFLICT (name) DO NOTHING;
