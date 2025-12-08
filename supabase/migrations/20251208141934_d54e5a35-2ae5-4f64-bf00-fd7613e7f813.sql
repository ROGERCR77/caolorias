-- Create dog_breed_reference table
CREATE TABLE public.dog_breed_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed_name text NOT NULL UNIQUE,
  porte text NOT NULL CHECK (porte IN ('pequeno', 'medio', 'grande', 'gigante')),
  peso_min_kg numeric NOT NULL,
  peso_max_kg numeric NOT NULL,
  energia_padrao text NOT NULL CHECK (energia_padrao IN ('baixa', 'moderada', 'alta')),
  braquicefalico boolean NOT NULL DEFAULT false,
  descricao_resumida text,
  created_at timestamptz DEFAULT now()
);

-- Create activity_reference table
CREATE TABLE public.activity_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  porte text NOT NULL CHECK (porte IN ('pequeno', 'medio', 'grande', 'gigante')),
  energia text NOT NULL CHECK (energia IN ('baixa', 'moderada', 'alta')),
  minutos_min_dia integer NOT NULL,
  minutos_max_dia integer NOT NULL,
  observacao text,
  UNIQUE (porte, energia)
);

-- Enable RLS
ALTER TABLE public.dog_breed_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_reference ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Read only for authenticated users
CREATE POLICY "Authenticated users can view breed references"
ON public.dog_breed_reference FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view activity references"
ON public.activity_reference FOR SELECT
TO authenticated
USING (true);

-- Seed breed references
INSERT INTO public.dog_breed_reference (breed_name, porte, peso_min_kg, peso_max_kg, energia_padrao, braquicefalico, descricao_resumida) VALUES
('Labrador Retriever', 'grande', 25, 36, 'alta', false, 'Cão ativo, amigável e muito versátil. Precisa de bastante exercício físico e estímulo mental diário. Adora nadar e buscar objetos.'),
('Golden Retriever', 'grande', 25, 34, 'alta', false, 'Muito sociável e energético, ótimo para famílias. Precisa de boas caminhadas diárias e adora atividades ao ar livre.'),
('Bulldog Inglês', 'medio', 18, 25, 'baixa', true, 'Tende a ser tranquilo e afetuoso. Intolerante a calor e exercícios intensos devido à sua anatomia. Caminhadas curtas e frequentes são ideais.'),
('Pug', 'pequeno', 6, 8, 'baixa', true, 'Companheiro carinhoso, muitas vezes sedentário. Necessita controle rigoroso de peso e cuidado especial com calor devido ao focinho curto.'),
('Shih Tzu', 'pequeno', 4, 7, 'moderada', false, 'Companheiro de colo por excelência, mas se beneficia de caminhadas leves e brincadeiras diárias para manter a saúde.'),
('Border Collie', 'medio', 14, 20, 'alta', false, 'Extremamente ativo e inteligente. Precisa de muito exercício físico e mental. Ideal para tutores ativos e esportes caninos.'),
('Pastor Alemão', 'grande', 22, 40, 'alta', false, 'Cão de trabalho versátil e leal. Exige caminhadas longas, atividades de obediência e estímulo mental constante.'),
('Vira-lata (SRD) pequeno', 'pequeno', 5, 10, 'moderada', false, 'Porte pequeno com personalidade única. Nível de energia varia, mas costuma gostar de caminhadas e brincadeiras diárias.'),
('Vira-lata (SRD) médio', 'medio', 11, 25, 'moderada', false, 'Porte médio, muito adaptável. Precisa de rotinas regulares de passeio e exercício para manter a saúde física e mental.'),
('Vira-lata (SRD) grande', 'grande', 26, 45, 'moderada', false, 'Porte grande com necessidades proporcionais. O ideal é manter rotina de exercício regular com caminhadas diárias.'),
('Yorkshire Terrier', 'pequeno', 2, 4, 'moderada', false, 'Pequeno mas cheio de energia. Apesar do tamanho, gosta de brincar e explorar. Caminhadas curtas diárias são suficientes.'),
('Poodle Toy', 'pequeno', 2, 4, 'moderada', false, 'Inteligente e ativo para seu tamanho. Precisa de estímulo mental e caminhadas leves diárias.'),
('Poodle Médio', 'medio', 10, 15, 'alta', false, 'Muito inteligente e energético. Precisa de exercício regular e adora aprender truques novos.'),
('Poodle Standard', 'grande', 20, 32, 'alta', false, 'Atlético e elegante. Precisa de bastante exercício e estímulo mental. Excelente nadador.'),
('Beagle', 'medio', 9, 14, 'alta', false, 'Farejador nato, muito ativo e curioso. Precisa de caminhadas longas e adoram seguir trilhas de cheiros.'),
('Rottweiler', 'grande', 35, 60, 'moderada', false, 'Forte e protetor. Precisa de exercício regular e treinamento consistente. Caminhadas longas são importantes.'),
('Dachshund (Salsicha)', 'pequeno', 4, 9, 'moderada', false, 'Corajoso e curioso. Cuidado com a coluna - evitar saltos e escadas. Caminhadas regulares são importantes.'),
('Boxer', 'grande', 25, 32, 'alta', false, 'Muito energético e brincalhão mesmo adulto. Precisa de bastante exercício e atividades que gastem energia.'),
('Husky Siberiano', 'medio', 16, 27, 'alta', false, 'Extremamente ativo e resistente. Precisa de muito exercício - foi criado para puxar trenós. Cuidado com calor.'),
('Chihuahua', 'pequeno', 1, 3, 'moderada', false, 'O menor cão do mundo, mas com personalidade grande. Caminhadas curtas e brincadeiras em casa são suficientes.'),
('Pastor Suíço', 'grande', 25, 40, 'alta', false, 'Versátil e inteligente, semelhante ao Pastor Alemão. Precisa de exercício regular e estímulo mental.'),
('Maltês', 'pequeno', 2, 4, 'moderada', false, 'Companheiro gentil e afetuoso. Caminhadas leves e brincadeiras diárias mantêm sua saúde.'),
('Buldogue Francês', 'pequeno', 8, 14, 'baixa', true, 'Companheiro adaptável e afetuoso. Sensível ao calor devido ao focinho curto. Exercícios leves são ideais.'),
('Schnauzer Miniatura', 'pequeno', 5, 9, 'moderada', false, 'Alerta e esperto. Gosta de atividades e caminhadas regulares. Boa energia para brincadeiras.'),
('Cocker Spaniel', 'medio', 12, 16, 'moderada', false, 'Alegre e afetuoso. Precisa de exercício moderado e adora brincar. Atenção especial às orelhas.'),
('Doberman', 'grande', 27, 45, 'alta', false, 'Atlético e inteligente. Precisa de muito exercício e treinamento mental. Excelente para esportes caninos.'),
('Akita', 'grande', 32, 59, 'moderada', false, 'Forte e independente. Precisa de exercício regular e socialização. Leal à família.'),
('Bernese Mountain Dog', 'gigante', 35, 55, 'moderada', false, 'Gentil gigante, afetuoso com a família. Exercício moderado - cuidado com calor e articulações.'),
('São Bernardo', 'gigante', 54, 82, 'baixa', false, 'Gigante gentil e calmo. Exercício moderado é suficiente. Atenção especial a articulações e calor.'),
('Dogue Alemão', 'gigante', 50, 79, 'moderada', false, 'O maior cão do mundo em altura. Apesar do tamanho, é gentil. Exercício moderado, cuidado com articulações.'),
('Mastiff', 'gigante', 54, 100, 'baixa', false, 'Calmo e protetor. Exercício leve a moderado. Atenção especial a articulações devido ao peso.');

-- Seed activity references
INSERT INTO public.activity_reference (porte, energia, minutos_min_dia, minutos_max_dia, observacao) VALUES
('pequeno', 'baixa', 20, 40, 'Passeios curtos e leves, divididos em 1-2 momentos por dia. Ideal para cães calmos ou braquicefálicos.'),
('pequeno', 'moderada', 30, 60, 'Caminhadas diárias regulares e brincadeiras em casa. Boa opção para a maioria dos cães pequenos.'),
('pequeno', 'alta', 45, 75, 'Várias caminhadas curtas e bastante brincadeira, respeitando os limites do cão e evitando horários muito quentes.'),
('medio', 'baixa', 30, 45, 'Rotina moderada de passeio, sem muito impacto. Bom para cães mais tranquilos ou em recuperação.'),
('medio', 'moderada', 45, 90, 'Uma boa caminhada diária combinada com sessões de brincadeiras. Equilibra exercício e descanso.'),
('medio', 'alta', 60, 105, 'Precisa de atividade mais intensa, como corridas leves, trilhas ou esportes caninos. Ideal para cães atléticos.'),
('grande', 'baixa', 30, 45, 'Caminhadas regulares em ritmo tranquilo, sem esforço excessivo. Adequado para cães mais calmos.'),
('grande', 'moderada', 60, 90, 'Caminhadas mais longas e boas sessões de brincadeiras ou natação. Importante para manter o peso.'),
('grande', 'alta', 60, 120, 'Cães muito ativos e de trabalho precisam de exercícios físicos e mentais prolongados, divididos ao longo do dia.'),
('gigante', 'baixa', 20, 40, 'Cuidado extra com articulações. Caminhadas suaves e regulares, evitando superfícies duras.'),
('gigante', 'moderada', 40, 60, 'Manter rotina de caminhada em ritmo moderado, evitando esforço intenso e saltos.'),
('gigante', 'alta', 45, 75, 'Mesmo com alta energia, sempre com cuidado extra com articulações. Consulte um veterinário antes de atividades intensas.');