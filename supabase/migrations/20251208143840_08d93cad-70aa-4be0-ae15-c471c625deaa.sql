-- Adicionar mais raças populares à tabela dog_breed_reference
INSERT INTO public.dog_breed_reference (breed_name, porte, peso_min_kg, peso_max_kg, energia_padrao, braquicefalico, descricao_resumida) VALUES
-- Raças Brasileiras e Muito Populares no Brasil
('Fila Brasileiro', 'gigante', 40, 50, 'moderada', false, 'Cão brasileiro de guarda, leal e protetor. Precisa de socialização desde filhote e espaço para se movimentar.'),
('Terrier Brasileiro', 'pequeno', 7, 10, 'alta', false, 'Também conhecido como Fox Paulistinha, é ágil, brincalhão e cheio de energia. Ótimo para famílias ativas.'),
('Spitz Alemão Anão', 'pequeno', 1.5, 3, 'alta', false, 'Conhecido como Lulu da Pomerânia, é pequeno mas cheio de personalidade. Pelagem densa exige escovação frequente.'),
('Pinscher Miniatura', 'pequeno', 3, 5, 'alta', false, 'Pequeno, corajoso e muito alerta. Apesar do tamanho, tem energia de sobra e precisa de passeios diários.'),
('Lhasa Apso', 'pequeno', 5, 8, 'moderada', false, 'Originário do Tibete, é independente e afetuoso com a família. Pelagem longa requer cuidados regulares.'),

-- Raças de Pequeno Porte
('Cavalier King Charles Spaniel', 'pequeno', 5, 8, 'moderada', false, 'Dócil, carinhoso e excelente companheiro. Adapta-se bem a apartamentos e famílias com crianças.'),
('Papillon', 'pequeno', 3, 5, 'alta', false, 'Pequeno e elegante, com orelhas em formato de borboleta. Inteligente e fácil de treinar.'),
('West Highland White Terrier', 'pequeno', 6, 10, 'alta', false, 'O Westie é alegre, confiante e cheio de energia. Pelagem branca precisa de cuidados para manter a cor.'),
('Scottish Terrier', 'pequeno', 8, 10, 'moderada', false, 'Independente e determinado, com aparência distinta. Leal à família mas pode ser reservado com estranhos.'),
('Jack Russell Terrier', 'pequeno', 5, 8, 'alta', false, 'Extremamente energético e inteligente. Precisa de muito exercício e estímulo mental para ficar equilibrado.'),
('Bichon Frisé', 'pequeno', 3, 5, 'alta', false, 'Alegre, brincalhão e hipoalergênico. Adora companhia e não gosta de ficar sozinho por longos períodos.'),
('Pequinês', 'pequeno', 3, 6, 'baixa', true, 'Cão real chinês, independente e digno. Por ser braquicefálico, evite exercícios em dias quentes.'),
('Affenpinscher', 'pequeno', 3, 6, 'moderada', false, 'Pequeno com cara de macaquinho, é curioso e brincalhão. Corajoso apesar do tamanho diminuto.'),
('Boston Terrier', 'pequeno', 5, 11, 'moderada', true, 'Gentil, inteligente e de fácil convivência. Por ser braquicefálico, cuidado com exercícios intensos.'),
('Cairn Terrier', 'pequeno', 6, 8, 'alta', false, 'Corajoso e aventureiro, adora explorar. Resistente e adaptável a diferentes ambientes.'),

-- Raças de Médio Porte
('Shar-Pei', 'medio', 18, 25, 'moderada', false, 'Leal e protetor, com rugas características. Pode ser reservado com estranhos mas é devotado à família.'),
('Staffordshire Bull Terrier', 'medio', 11, 17, 'alta', false, 'Forte, corajoso e extremamente afetuoso com pessoas. Conhecido como "cão-babá" pelo carinho com crianças.'),
('American Staffordshire Terrier', 'medio', 25, 35, 'alta', false, 'Atlético e confiante, muito leal à família. Precisa de socialização e exercícios regulares.'),
('Bull Terrier', 'medio', 22, 32, 'alta', false, 'Brincalhão e cheio de energia, com cabeça em formato de ovo característico. Precisa de atividade física diária.'),
('Schnauzer Standard', 'medio', 14, 20, 'alta', false, 'Inteligente, alerta e versátil. Excelente cão de família que se adapta bem a diferentes rotinas.'),
('Basset Hound', 'medio', 20, 29, 'baixa', false, 'Calmo e de boa índole, com faro excepcional. Pode ser teimoso mas é muito afetuoso.'),
('Welsh Corgi Pembroke', 'medio', 10, 14, 'alta', false, 'Inteligente e ativo, apesar das pernas curtas. Precisa de exercício regular para manter o peso saudável.'),
('Welsh Corgi Cardigan', 'medio', 11, 17, 'alta', false, 'Semelhante ao Pembroke mas com cauda. Versátil, leal e bom com famílias.'),
('Whippet', 'medio', 9, 14, 'alta', false, 'Elegante e velocista, mas tranquilo em casa. Combina explosões de energia com longos períodos de descanso.'),
('Springer Spaniel Inglês', 'medio', 18, 25, 'alta', false, 'Alegre, afetuoso e cheio de energia. Excelente companheiro para famílias ativas.'),
('Cocker Spaniel Americano', 'medio', 10, 14, 'alta', false, 'Alegre e brincalhão, com pelagem sedosa. Precisa de escovação regular e exercícios diários.'),
('Shetland Sheepdog', 'medio', 6, 12, 'alta', false, 'Inteligente e obediente, excelente em obediência. Leal à família e reservado com estranhos.'),
('Australian Cattle Dog', 'medio', 15, 22, 'alta', false, 'Trabalhador incansável e muito inteligente. Precisa de muito exercício físico e mental.'),
('Australian Shepherd', 'medio', 18, 29, 'alta', false, 'Versátil e energético, adora ter tarefas. Excelente para famílias ativas e esportes caninos.'),

-- Raças de Grande Porte
('Weimaraner', 'grande', 25, 40, 'alta', false, 'Atlético e elegante, com pelagem cinza característica. Precisa de muito exercício e companhia.'),
('Vizsla', 'grande', 20, 30, 'alta', false, 'Afetuoso e energético, conhecido como "cão velcro" por seguir o dono. Excelente para famílias ativas.'),
('Pointer Inglês', 'grande', 20, 34, 'alta', false, 'Atlético e gracioso, originalmente cão de caça. Precisa de espaço e exercício intenso.'),
('Setter Irlandês', 'grande', 27, 32, 'alta', false, 'Elegante, amigável e cheio de energia. Pelagem vermelha exuberante requer escovação regular.'),
('Dálmata', 'grande', 23, 32, 'alta', false, 'Energético e resistente, famoso pelas pintas. Precisa de muito exercício para gastar energia.'),
('Chow Chow', 'grande', 20, 32, 'baixa', false, 'Independente e leal, com aparência de leão. Pode ser reservado mas é devotado à família.'),
('Samoieda', 'grande', 17, 30, 'alta', false, 'Amigável e brincalhão, com sorriso característico. Pelagem branca e densa precisa de escovação frequente.'),
('Malamute do Alasca', 'grande', 34, 45, 'alta', false, 'Forte e resistente, feito para puxar trenós. Precisa de exercício intenso e não tolera bem o calor.'),
('Collie Pelo Longo', 'grande', 20, 34, 'alta', false, 'Inteligente, leal e gentil, famoso por Lassie. Excelente com crianças e fácil de treinar.'),
('Rhodesian Ridgeback', 'grande', 29, 41, 'alta', false, 'Atlético e independente, com crista no dorso. Leal à família mas precisa de socialização.'),
('Cane Corso', 'grande', 40, 50, 'moderada', false, 'Protetor e imponente, excelente guardião. Precisa de dono experiente e socialização desde filhote.'),

-- Raças Gigantes
('Leonberger', 'gigante', 45, 77, 'moderada', false, 'Gentil gigante, calmo e afetuoso. Apesar do tamanho, é dócil e bom com crianças.'),
('Terra Nova', 'gigante', 45, 70, 'moderada', false, 'Conhecido como Newfoundland, é dócil e excelente nadador. Protetor natural, especialmente com crianças.'),
('Irish Wolfhound', 'gigante', 48, 70, 'moderada', false, 'O maior cão do mundo em altura, mas gentil e calmo. Precisa de espaço mas não de exercício intenso.'),
('Dogo Argentino', 'gigante', 35, 45, 'alta', false, 'Atlético e corajoso, originalmente cão de caça. Leal e protetor, precisa de dono experiente.')

ON CONFLICT (breed_name) DO NOTHING;