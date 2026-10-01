truncate table public.leads restart identity;

insert into public.leads (nome, telefone, imovel_interesse, origem, status, created_at, updated_at)
select nome, telefone, imovel, origem, status, criado::timestamptz, criado::timestamptz
from (values
('Mariana Albuquerque', '+55 11 98712-3401', 'Cobertura duplex em Moema com 3 suítes, terraço e 3 vagas. Orçamento até R$ 6 milhões.', 'whatsapp', 'qualificado', '2026-08-04 10:12-03'),
('Ricardo Tavares',     '+55 11 99231-7788', 'Casa em condomínio fechado em Alphaville, 4 suítes, piscina e área gourmet.',           'whatsapp', 'em_contato',  '2026-08-11 19:40-03'),
('Fernanda Lopes',      '+55 11 97456-2210', 'Apartamento no Itaim Bibi perto do Parque do Povo, uns 200 m².',                        'whatsapp', 'perdido',     '2026-08-15 21:05-03'),
('Eduardo Nogueira',    '+55 11 98800-1453', 'Quero saber valores.',                                                                  'whatsapp', 'perdido',     '2026-08-20 22:30-03'),
('Camila Rezende',      '+55 11 99654-0921', 'Apartamento alto padrão na Vila Nova Conceição, varanda gourmet, 3 vagas, andar alto.', 'whatsapp', 'qualificado', '2026-08-27 09:48-03'),
('Gustavo Pimentel',    '+55 11 97321-6604', 'Studio para investimento na Vila Olímpia, perto do metrô.',                             'whatsapp', 'em_contato',  '2026-09-03 13:15-03'),
('Juliana Castro',      '+55 11 98143-5572', 'Casa na Granja Viana com espaço para home office e quintal para cachorro.',            'whatsapp', 'em_contato',  '2026-09-10 18:22-03'),
('Thiago Moura',        '+55 11 99077-3318', 'Cobertura com vista em Perdizes.',                                                      'whatsapp', 'novo',        '2026-09-19 20:47-03'),
('Beatriz Fontes',      '+55 11 97988-4410', 'Apartamento de 4 dormitórios no Brooklin, perto de boas escolas.',                      'whatsapp', 'novo',        '2026-09-25 08:55-03'),
('André Siqueira',      '+55 11 98561-2097', 'Imóvel na planta nos Jardins.',                                                         'whatsapp', 'novo',        '2026-09-28 11:30-03'),
('Patrícia Almeida',    '+55 11 99412-8836', 'Apartamento em Higienópolis, prédio clássico, 250 m², 3 suítes, pé-direito alto.',      'site',      'qualificado', '2026-08-02 14:20-03'),
('Rodrigo Menezes',     '+55 11 97633-1904', 'Casa térrea no Morumbi.',                                                               'site',      'perdido',     '2026-08-07 16:05-03'),
('Luciana Barros',      '+55 11 98274-6650', 'Gostaria de mais informações.',                                                         'site',      'perdido',     '2026-08-13 23:10-03'),
('Felipe Arantes',      '+55 11 99845-0317', 'Cobertura em Pinheiros.',                                                               'site',      'perdido',     '2026-08-22 15:45-03'),
('Aline Duarte',        '+55 11 97119-2263', 'Apartamento com 3 suítes no Campo Belo, lazer completo no condomínio.',                 'site',      'em_contato',  '2026-09-01 10:30-03'),
('Marcelo Viana',       '+55 11 98390-7741', 'Loft na Vila Madalena.',                                                                'site',      'novo',        '2026-09-08 17:12-03'),
('Renata Cordeiro',     '+55 11 99506-3389', 'Apartamento de frente para o Parque Ibirapuera, mínimo 180 m².',                         'site',      'novo',        '2026-09-14 12:40-03'),
('Vinícius Prado',      '+55 11 97240-5518', 'Casa em condomínio em Cotia, 3 quartos.',                                               'site',      'novo',        '2026-09-24 09:05-03'),
('Helena Martins',      '+55 11 99187-6602', 'Cobertura no Jardim Europa, indicada pela família Rocha. Busca 4 suítes e piscina privativa.', 'indicacao', 'qualificado', '2026-08-05 11:00-03'),
('Otávio Ramos',        '+55 11 98655-2034', 'Casa na Cidade Jardim com terreno amplo, para mudança no 1º semestre de 2027.',              'indicacao', 'qualificado', '2026-08-18 15:30-03'),
('Leonardo Queiroz',    '+55 11 97802-9147', 'Casa de campo em condomínio em Itu.',                                                         'indicacao', 'perdido',     '2026-08-25 17:50-03'),
('Sofia Bittencourt',   '+55 11 99930-4476', 'Apartamento na Vila Nova Conceição com 4 suítes, vista para o parque. Indicação do Dr. Paulo.', 'indicacao', 'qualificado', '2026-09-02 10:10-03'),
('Isabela Monteiro',    '+55 11 98027-1185', 'Apartamento no Pacaembu, prédio com poucos andares e segurança 24h.',                          'indicacao', 'em_contato',  '2026-09-16 14:00-03'),
('Caio Ferraz',         '+55 11 97714-8820', 'Cobertura na Vila Mariana.',                                                                  'indicacao', 'novo',        '2026-09-27 16:25-03')
) as v(nome, telefone, imovel, origem, status, criado);
