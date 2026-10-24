const RAW=[
["rol_esferas","Rolamento de esferas","Rolamentos e mancais",1.5,45000,3,"mec","fadiga de contato (spalling), contaminação, lubrificação deficiente, falso brinelamento, corrente elétrica (fluting)",2000,"vibração e envelope (BPFO/BPFI), temperatura, ultrassom, análise de graxa"],
["rol_rolos","Rolamento de rolos cilíndricos/esféricos","Rolamentos e mancais",1.5,50000,3.33,"mec","spalling, desgaste de gaiola, contaminação, sobrecarga axial, folga inadequada",2000,"vibração e envelope, temperatura, ultrassom, análise de óleo"],
["rol_conicos","Rolamento de rolos cônicos","Rolamentos e mancais",1.5,40000,3.33,"mec","spalling, pré-carga errada, desgaste de flange, contaminação",1800,"vibração, temperatura, folga axial"],
["mancal_desliz","Mancal de deslizamento (bucha/babbitt)","Rolamentos e mancais",2.0,60000,2,"mec","perda de filme de óleo, desgaste, fadiga do babbitt, contaminação, instabilidade (oil whirl)",1500,"temperatura de metal, sensores de proximidade (órbita), análise de óleo"],
["mancal_bucha","Bucha / pino articulado","Rolamentos e mancais",2.5,15000,2,"mec","desgaste adesivo, engripamento por falta de graxa, ovalização",800,"folga medida, inspeção visual, temperatura"],
["engrenagem","Redutor de engrenagens","Transmissão",2.5,60000,3,"mec","pitting, desgaste, quebra de dente, scuffing, falha de rolamento interno, vazamento",3000,"vibração (GMF e bandas laterais), análise de óleo/ferrografia, temperatura"],
["acop_flex","Acoplamento flexível (elastômero)","Transmissão",2.0,25000,2,"mec","degradação do elemento elástico, desalinhamento, fadiga",1200,"inspeção visual, vibração 1x/2x, alinhamento a laser"],
["acop_eng","Acoplamento de engrenagem/grade","Transmissão",2.2,40000,2.5,"mec","desgaste de dentes por falta de graxa, desalinhamento",1500,"vibração 2x, inspeção de graxa, alinhamento"],
["correia_v","Correia em V","Transmissão",2.2,12000,2.5,"mec","desgaste de flanco, trincas, alongamento, patinação",600,"tensão, termografia, inspeção visual, estroboscópio"],
["correia_sinc","Correia sincronizadora","Transmissão",2.5,15000,2.5,"mec","quebra de dentes, desgaste, alongamento",500,"inspeção visual, tensão, ruído"],
["corrente","Corrente de rolos","Transmissão",2.4,15000,2.5,"mec","alongamento por desgaste de pinos, fadiga de elos, corrosão",800,"medição de alongamento, lubrificação, inspeção"],
["eixo","Eixo (fadiga/desgaste)","Transmissão",3.0,150000,5,"mec","fadiga por flexão/torção em rasgo de chaveta ou ombro, desgaste em assento",1000,"vibração 1x/2x, ultrassom e partículas magnéticas, inspeção de assentos"],
["cardan","Eixo cardã","Transmissão",2.0,30000,3,"mec","desgaste de cruzetas, desbalanceamento, folga em estrias",1000,"vibração, folga, lubrificação"],
["embreagem","Embreagem / freio industrial","Transmissão",2.5,20000,2,"mec","desgaste de material de atrito, superaquecimento, fadiga de mola",500,"espessura de lona, temperatura, tempo de atuação"],
["selo_mec","Selo mecânico de bomba","Bombas e compressores",1.4,18000,1.5,"mec","desgaste/trinca das faces, operação a seco, dano de elastômero, cristalização",300,"vazamento, temperatura da sobreposta, ultrassom"],
["gaxeta","Gaxeta / engaxetamento","Bombas e compressores",1.6,6000,1.5,"mec","desgaste, endurecimento, desgaste da luva do eixo",300,"vazamento, temperatura"],
["impelidor","Rotor / impelidor de bomba","Bombas e compressores",2.0,50000,2,"mec","cavitação, erosão, corrosão, desbalanceamento, desgaste do anel",3000,"vibração, desempenho (pressão x vazão), ruído de cavitação"],
["bomba_centrif","Bomba centrífuga (conjunto)","Bombas e compressores",1.3,25000,2,"mec","selo, rolamento, cavitação, desalinhamento, operação fora do BEP",1500,"vibração, desempenho, temperatura, corrente do motor"],
["bomba_desloc","Bomba de deslocamento positivo","Bombas e compressores",1.6,20000,2,"mec","desgaste de engrenagens/palhetas/pistões, válvulas, vazamento interno",1000,"vazão volumétrica, pressão, vibração, análise de óleo"],
["bomba_polpa","Bomba de polpa / lama","Bombas e compressores",2.2,8000,2.5,"mec","desgaste erosivo do revestimento e impelidor, selo",500,"desempenho, espessura de revestimento, vibração"],
["bomba_vacuo","Bomba de vácuo","Bombas e compressores",1.5,30000,2,"mec","desgaste de palhetas/anel líquido, incrustação, rolamento",1000,"nível de vácuo, vibração, temperatura"],
["comp_parafuso","Compressor de parafuso (elemento)","Bombas e compressores",2.0,40000,2,"mec","desgaste de rolamentos do elemento, contato de rotores, separador de óleo",2000,"vibração, análise de óleo, temperatura de descarga"],
["comp_altern","Válvula de compressor alternativo","Bombas e compressores",1.6,8000,2,"mec","quebra de placa/mola, carbonização, desgaste de sede",400,"temperatura de válvula, pressões, vibração/ultrassom"],
["comp_centrif","Compressor centrífugo","Bombas e compressores",1.5,60000,2,"mec","surge, incrustação, mancal, selo seco",2500,"vibração (proximidade), desempenho, temperatura de mancal"],
["ventilador","Ventilador / exaustor industrial","Bombas e compressores",1.6,40000,2,"mec","desbalanceamento por acúmulo ou erosão, rolamento, trinca no rotor, base solta",1500,"vibração 1x, temperatura de mancal, inspeção do rotor"],
["soprador","Soprador (roots)","Bombas e compressores",1.6,35000,2,"mec","desgaste de engrenagens de sincronismo, rolamentos, contato de lóbulos",1200,"vibração, análise de óleo, temperatura"],
["mangueira_hid","Mangueira hidráulica","Hidráulica e pneumática",2.0,15000,2,"mec","fadiga por pulsação, abrasão externa, falha no terminal, envelhecimento",400,"inspeção visual, termografia, histórico de pressão"],
["cil_hid","Cilindro hidráulico (vedações)","Hidráulica e pneumática",1.8,40000,2,"mec","desgaste de vedações, risco na haste, flambagem, contaminação",1500,"vazamento interno (by-pass), inspeção de haste, análise de óleo"],
["bomba_hid","Bomba hidráulica (pistões/palhetas)","Hidráulica e pneumática",1.6,15000,2,"mec","desgaste por contaminação, cavitação, vazamento interno",1000,"vazão de dreno, ISO 4406, ruído, temperatura"],
["valv_dir","Válvula direcional / proporcional","Hidráulica e pneumática",1.4,40000,1.5,"mec","travamento por contaminação, bobina queimada, desgaste de carretel",300,"tempo de resposta, corrente de bobina, ISO 4406"],
["acumulador","Acumulador (bexiga/pistão)","Hidráulica e pneumática",1.5,40000,1.5,"mec","perda de pré-carga, ruptura de bexiga",2000,"verificação de pré-carga de N2"],
["filtro_hid","Elemento filtrante hidráulico","Hidráulica e pneumática",3.0,3000,1,"mec","saturação, colapso, by-pass aberto",300,"diferencial de pressão, ISO 4406"],
["cil_pneu","Cilindro pneumático","Hidráulica e pneumática",1.8,35000,1.5,"mec","desgaste de vedações, amortecimento, haste",1000,"vazamento por ultrassom, tempo de ciclo"],
["valv_solen","Válvula solenoide","Hidráulica e pneumática",1.5,30000,1.5,"ele","bobina queimada, travamento, vedação",200,"corrente da bobina, tempo de atuação, vazamento"],
["oring","Vedação estática (O-ring/junta)","Hidráulica e pneumática",2.0,25000,1.5,"mec","endurecimento térmico, extrusão, ataque químico",500,"vazamento, inspeção"],
["valv_controle","Válvula de controle","Válvulas e tubulação",1.5,30000,1.5,"mec","desgaste de sede/obturador, gaxeta, atuador, posicionador",1000,"assinatura de válvula, desvio de controle, vazamento"],
["valv_bloqueio","Válvula gaveta/esfera/borboleta","Válvulas e tubulação",1.3,80000,1.5,"mec","passagem interna, travamento, gaxeta",2000,"teste de estanqueidade, ultrassom, torque de manobra"],
["psv","Válvula de segurança (PSV)","Válvulas e tubulação",1.2,40000,1,"mec","travamento, abertura abaixo do set, passagem",2000,"teste de bancada, ultrassom"],
["valv_retencao","Válvula de retenção","Válvulas e tubulação",1.4,40000,1.5,"mec","desgaste de articulação, batimento (golpe), passagem",1500,"ultrassom, ruído, pressão"],
["tubulacao","Tubulação (corrosão/erosão)","Válvulas e tubulação",2.5,120000,1.5,"mec","corrosão interna/externa, erosão em curvas, corrosão sob isolamento",8000,"medição de espessura por ultrassom, inspeção, END"],
["junta_exp","Junta de expansão","Válvulas e tubulação",2.0,50000,2,"mec","fadiga de fole, corrosão, deformação",2000,"inspeção visual, medição de deslocamento"],
["purgador","Purgador de vapor","Válvulas e tubulação",1.5,15000,1.5,"mec","passagem de vapor, entupimento",500,"ultrassom, termografia"],
["trocador","Trocador de calor","Válvulas e tubulação",1.8,40000,1.5,"mec","incrustação, vazamento de tubos, corrosão, vibração de tubos",3000,"desempenho térmico, correntes parasitas, pressão diferencial"],
["motor_bt","Motor elétrico BT (isolação do estator)","Motores e geradores",2.0,90000,1.5,"ele","degradação térmica da isolação, contaminação, umidade, surtos de inversor, curto entre espiras",4000,"resistência de isolação e índice de polarização, termografia, análise de corrente (MCSA)"],
["motor_mt","Motor MT (isolação)","Motores e geradores",2.2,120000,1.5,"ele","descargas parciais, contaminação de bobinas, afrouxamento de cunhas",6000,"descargas parciais, tg delta, IP, termografia"],
["motor_cc","Motor CC (escovas/comutador)","Motores e geradores",2.5,8000,1.5,"ele","desgaste de escovas, faiscamento, comutador ovalizado",500,"inspeção de escovas, termografia, faiscamento"],
["gerador","Gerador (estator/rotor)","Motores e geradores",2.0,100000,1.5,"ele","isolação, excitação, mancais",5000,"descargas parciais, IR/IP, vibração"],
["escovas","Escovas de carvão / anéis coletores","Motores e geradores",3.0,5000,1.5,"ele","desgaste, faiscamento, contaminação",300,"comprimento de escova, termografia"],
["freio_eletromag","Freio eletromagnético de motor","Motores e geradores",2.2,20000,2,"mec","desgaste de lona, entreferro fora, bobina",500,"entreferro, tempo de frenagem"],
["disj_bt","Disjuntor BT (caixa moldada / aberto)","Distribuição elétrica",1.6,100000,1.5,"ele","pontos quentes nas garras/conexões, falha de mecanismo, desgaste de contatos",3000,"termografia, resistência de contato, teste de disparo"],
["disj_mt","Disjuntor MT (vácuo/SF6)","Distribuição elétrica",1.6,150000,1.5,"ele","perda de vácuo/SF6, mecanismo, bobinas, contatos",4000,"resistência de contato, tempos de manobra, integridade de vácuo, pressão de SF6"],
["contator","Contator / relé auxiliar","Distribuição elétrica",1.8,40000,1.5,"ele","desgaste de contatos por arco, bobina, mecanismo",500,"termografia, contagem de manobras, inspeção de contatos"],
["rele_prot","Relé de proteção digital","Distribuição elétrica",1.1,150000,1,"elo","falha de fonte, entradas/saídas, firmware",100,"autodiagnóstico, injeção secundária"],
["trafo_oleo","Transformador a óleo","Distribuição elétrica",2.5,200000,2,"ele","degradação de papel/óleo, gases dissolvidos, buchas, comutador",8000,"cromatografia (DGA), físico-química, furfuraldeído, termografia"],
["trafo_seco","Transformador a seco","Distribuição elétrica",2.2,180000,2,"ele","degradação térmica, descargas parciais, contaminação",6000,"termografia, descargas parciais, IR"],
["cabo_bt","Cabo de potência BT","Distribuição elétrica",2.2,200000,1.5,"ele","envelhecimento térmico, dano mecânico, umidade",5000,"resistência de isolação, termografia em terminações"],
["cabo_mt","Cabo de potência MT","Distribuição elétrica",2.5,180000,1.5,"ele","arborescência elétrica/água, falha em emendas e terminações",6000,"descargas parciais, VLF/tg delta"],
["terminacao","Conexão / terminação / emenda","Distribuição elétrica",1.8,60000,1.5,"ele","aquecimento por aperto insuficiente, oxidação, fadiga térmica",1500,"termografia, resistência de contato, reaperto por torque"],
["barramento","Barramento / CCM (conexões)","Distribuição elétrica",1.8,80000,1.5,"ele","pontos quentes, rastreamento por contaminação, afrouxamento",2000,"termografia, ultrassom (corona/rastreamento)"],
["banco_cap","Banco de capacitores","Distribuição elétrica",1.5,60000,1.5,"ele","perda de capacitância, abaulamento, harmônicos",1500,"capacitância, termografia, corrente"],
["bateria_vrla","Bateria estacionária VRLA","Distribuição elétrica",3.0,35000,1.5,"ele","sulfatação, secagem, corrosão de grade (vida cai à metade a cada 10 °C acima de 25 °C)",2000,"impedância interna, teste de capacidade, temperatura"],
["ups","Nobreak / UPS","Distribuição elétrica",1.2,70000,1.2,"elo","capacitores, ventiladores, IGBTs",500,"alarmes, termografia, teste de autonomia"],
["seccionadora","Chave seccionadora","Distribuição elétrica",1.5,120000,1.5,"ele","contatos oxidados, mecanismo travado",3000,"termografia, resistência de contato"],
["luminaria","Luminária LED industrial","Distribuição elétrica",2.5,50000,1.2,"elo","falha de driver, depreciação luminosa",1000,"luxímetro, temperatura"],
["inversor","Inversor de frequência","Eletrônica e automação",1.3,60000,1.2,"elo","capacitores do barramento CC, ventiladores, IGBTs, sujeira e umidade",800,"histórico de falhas, ripple do barramento CC, termografia, ventiladores"],
["softstarter","Soft-starter","Eletrônica e automação",1.2,90000,1.2,"elo","tiristores, contator de by-pass, ventilação",500,"termografia, histórico de partidas"],
["fonte_cc","Fonte chaveada 24 Vcc","Eletrônica e automação",1.3,60000,1.2,"elo","capacitores eletrolíticos secos, sobretemperatura",300,"ripple, tensão de saída, temperatura"],
["clp","CLP / cartão de E/S","Eletrônica e automação",1.0,150000,1,"elo","falha aleatória de componentes, surtos, umidade",50,"diagnóstico do CLP, temperatura do painel"],
["ihm","IHM / painel de operação","Eletrônica e automação",1.2,50000,1,"elo","tela touch, backlight, cartão de memória",200,"inspeção, diagnóstico"],
["rede_ind","Switch / rede industrial","Eletrônica e automação",1.0,120000,1,"elo","fonte, portas, conectores",50,"diagnóstico de rede, erros de CRC"],
["cap_eletrol","Capacitor eletrolítico","Eletrônica e automação",2.5,50000,1.2,"elo","secagem do eletrólito (vida cai à metade a cada 10 °C)",500,"ESR, capacitância, temperatura"],
["vent_painel","Ventilador de painel","Eletrônica e automação",2.0,40000,1.2,"mec","rolamento/bucha, acúmulo de poeira",500,"ruído, rotação, temperatura do painel"],
["encoder","Encoder / resolver","Eletrônica e automação",1.4,50000,1.5,"elo","rolamento do encoder, contaminação do disco, cabo",300,"erros de contagem, vibração"],
["drive_cc","Conversor CA/CC (drive CC)","Eletrônica e automação",1.2,60000,1.2,"elo","tiristores, fusíveis, placas de controle",300,"alarmes, termografia"],
["sensor_ind","Sensor indutivo / fim de curso","Instrumentação",1.0,60000,1,"elo","dano mecânico, cabo, contaminação",50,"diagnóstico IO-Link, inspeção"],
["transm_press","Transmissor de pressão","Instrumentação",1.0,90000,1,"elo","deriva, diafragma danificado, umidade",500,"calibração, comparação redundante"],
["termopar","Termopar / RTD","Instrumentação",1.5,15000,1.5,"ele","deriva, ruptura por alta temperatura, isolação",300,"comparação, resistência de malha"],
["vazao","Medidor de vazão","Instrumentação",1.1,80000,1,"elo","deriva, incrustação de eletrodos, obstrução",500,"verificação in situ, balanço de massa"],
["analisador","Analisador de gás / qualidade","Instrumentação",1.3,15000,1,"elo","células sensoras, sistema de amostragem",300,"verificação com padrão, alarmes"],
["celula_carga","Célula de carga","Instrumentação",1.2,60000,1,"elo","sobrecarga, umidade, cabo",300,"teste de zero e span"],
["posicionador","Posicionador de válvula","Instrumentação",1.3,50000,1.5,"elo","desgaste mecânico, contaminação do ar, eletrônica",500,"assinatura de válvula, desvio"],
["pirometro","Pirômetro","Instrumentação",1.1,50000,1,"elo","sujeira na lente, refrigeração, eletrônica",300,"comparação, limpeza"],
["radar_nivel","Medidor de nível radar/ultrassônico","Instrumentação",1.1,80000,1,"elo","incrustação na antena, eletrônica",300,"curva de eco, comparação"],
["cabo_aco","Cabo de aço de elevação","Movimentação de carga",3.0,8000,3,"mec","fios rompidos por fadiga de flexão, corrosão, amassamento, gaiola de passarinho",500,"inspeção por norma (ISO 4309), ensaio eletromagnético, diâmetro"],
["roda_ponte","Roda / trilho de ponte rolante","Movimentação de carga",2.5,30000,3,"mec","desgaste de friso por desalinhamento, trincas, lascamento",2000,"diâmetro e friso, alinhamento do caminho de rolamento"],
["tambor_ponte","Tambor e polias de cabo","Movimentação de carga",2.5,60000,3,"mec","desgaste de canais, trincas, rolamentos",3000,"medição de canal, END, vibração"],
["freio_ponte","Freio de ponte rolante","Movimentação de carga",2.8,9000,2,"mec","desgaste de lonas, fadiga de mola, atuador eletro-hidráulico",500,"espessura, torque de frenagem, tempo de atuação"],
["gancho","Gancho / moitão","Movimentação de carga",3.0,100000,4,"mec","abertura da garganta, trincas por fadiga, desgaste",3000,"abertura da garganta, partículas magnéticas"],
["redutor_elev","Redutor de elevação","Movimentação de carga",2.5,50000,3,"mec","pitting, rolamentos, vazamento",3000,"vibração, análise de óleo"],
["coletor_corr","Coletor de corrente / barramento da ponte","Movimentação de carga",2.5,8000,1.5,"ele","desgaste de sapatas, arco, desalinhamento",400,"inspeção, termografia"],
["correia_transp","Correia transportadora (cinta)","Movimentação de carga",2.5,25000,2,"mec","desgaste da cobertura, rasgos, falha de emenda, desalinhamento",1500,"espessura, inspeção de emendas, scanner de cabos de aço"],
["rolete","Rolete de transportador","Movimentação de carga",1.8,30000,2,"mec","rolamento travado, desgaste do tubo",800,"termografia, ruído, acústica"],
["tambor_transp","Tambor de transportador","Movimentação de carga",2.2,40000,3,"mec","desgaste do revestimento, rolamentos, trinca na solda do disco",2000,"vibração, END, inspeção"],
["talha","Talha elétrica","Movimentação de carga",1.6,20000,2.5,"mec","freio, corrente/cabo, fim de curso",500,"inspeção por norma, teste de freio"],
["rolo_lam","Cilindro de laminação","Siderurgia e laminação",3.0,2500,3,"mec","desgaste de canal/superfície, trinca térmica (fire cracks), lascamento",200,"perfil, ultrassom e correntes parasitas, toneladas laminadas"],
["mancal_lam","Mancal de cilindro de laminação (chock)","Siderurgia e laminação",1.8,15000,3.33,"mec","contaminação por água e carepa, spalling, vedação",800,"análise de graxa/óleo, temperatura, vibração"],
["guia_lam","Guia / caixa de guia de laminação","Siderurgia e laminação",2.5,1500,2,"mec","desgaste de roletes e insertos, travamento",100,"inspeção a cada troca de cilindro"],
["tesoura","Lâmina de tesoura","Siderurgia e laminação",3.0,3000,2,"mec","desgaste de gume, lascamento",200,"qualidade do corte, inspeção"],
["rolo_mesa","Rolo de mesa de rolos","Siderurgia e laminação",2.0,20000,3,"mec","rolamentos, desgaste da superfície, motor do rolo",1000,"corrente do motor, temperatura, vibração"],
["rolo_lc","Rolo de lingotamento contínuo","Siderurgia e laminação",2.5,6000,3,"mec","trinca térmica, desgaste, travamento de rolamento",500,"gap do segmento, medição de rolos"],
["molde_lc","Molde / placas de cobre do LC","Siderurgia e laminação",3.0,3000,2,"mec","desgaste, trincas, perda de revestimento",300,"conicidade, superfície, termopares do molde"],
["painel_fea","Painel refrigerado do forno elétrico","Siderurgia e laminação",2.2,8000,2,"mec","furo por arco/erosão, fadiga térmica",300,"vazão e delta T da água, inspeção visual"],
["refrat_panela","Refratário de panela","Siderurgia e laminação",3.5,300,2,"mec","erosão química por escória, lascamento térmico",50,"espessura por laser, número de corridas, termografia da carcaça"],
["refrat_forno","Refratário de forno (soleira/paredes)","Siderurgia e laminação",3.0,4000,2,"mec","erosão, penetração de metal, lascamento",300,"termografia da carcaça, laser"],
["valv_gaveta_panela","Placas de válvula gaveta de panela","Siderurgia e laminação",3.0,40,2,"mec","erosão do furo, trincas",5,"inspeção a cada corrida"],
["lanca_o2","Lança de oxigênio","Siderurgia e laminação",2.5,200,2,"mec","furo do bico por cascão/erosão",20,"vazão e delta T da água, inspeção do bico"],
["fieira","Fieira de trefilação","Siderurgia e laminação",2.5,400,2,"mec","desgaste da zona de redução, trinca do núcleo",40,"diâmetro do fio, acabamento, força de trefilação"],
["bico_descarep","Bico descarepador","Siderurgia e laminação",2.2,3000,2,"mec","desgaste do orifício, entupimento",200,"pressão, padrão de jato"],
["britador_mand","Mandíbula de britador","Mineração e britagem",3.0,1500,2,"mec","desgaste abrasivo",150,"perfil, granulometria do produto"],
["britador_conico","Manto/côncavo de britador cônico","Mineração e britagem",3.0,1200,2,"mec","desgaste abrasivo, folga",120,"perfil, posição do manto"],
["revest_moinho","Revestimento de moinho","Mineração e britagem",3.0,8000,2,"mec","desgaste, quebra de placas, afrouxamento de parafusos",500,"espessura por laser, acústica do moinho"],
["peneira_tela","Tela de peneira","Mineração e britagem",2.5,1500,2,"mec","desgaste, rasgo, cegamento",150,"inspeção, granulometria"],
["dente_cacamba","Dente de caçamba","Mineração e britagem",3.0,400,2,"mec","desgaste, quebra",40,"inspeção visual, câmera"],
["chapa_desgaste","Chapa de desgaste / revestimento de chute","Mineração e britagem",2.5,3000,2,"mec","desgaste abrasivo/impacto",200,"espessura por ultrassom"],
["hidrociclone","Hidrociclone","Mineração e britagem",2.5,3000,2,"mec","desgaste do ápex e revestimento",200,"pressão, corte granulométrico"],
["turbina_gas","Turbina a gás (seção quente)","Óleo, gás e naval",2.5,25000,2,"mec","fluência e oxidação de palhetas, trincas, depósitos",2000,"boroscopia, temperatura de exaustão, vibração, desempenho"],
["motor_diesel","Motor diesel (até overhaul)","Óleo, gás e naval",2.2,20000,2,"mec","desgaste de camisa/anéis, bronzinas, injetores, turbo",1500,"análise de óleo, blow-by, temperatura de exaustão por cilindro, compressão"],
["injetor","Bico injetor diesel","Óleo, gás e naval",2.0,8000,1.5,"mec","desgaste, gotejamento, entupimento",500,"temperatura de exaustão por cilindro, bancada"],
["turbo","Turbocompressor","Óleo, gás e naval",1.8,15000,2,"mec","mancais por óleo contaminado, erosão do rotor",500,"vibração, pressão de sobrealimentação, análise de óleo"],
["helice","Hélice / eixo propulsor","Óleo, gás e naval",2.0,60000,3,"mec","cavitação, erosão, fadiga, mancal de popa",3000,"vibração, inspeção subaquática, folga do mancal"],
["selo_popa","Selo de eixo de popa","Óleo, gás e naval",1.8,25000,1.5,"mec","desgaste de lábios, entrada de água",1000,"vazamento, análise do óleo do tubo telescópico"],
["flexivel_offshore","Duto flexível / mangote offshore","Óleo, gás e naval",2.5,80000,2,"mec","fadiga da armadura, colapso, ruptura da capa",5000,"monitoramento de anular, inspeção por ROV"],
["bcs","Bomba centrífuga submersa (BCS)","Óleo, gás e naval",1.3,12000,2,"mec","falha de motor/cabo, desgaste por areia, selo",500,"corrente e isolação do motor de fundo, vibração, temperatura"],
["turbofan","Motor turbofan (remoção não programada)","Aeronáutico",1.8,15000,2,"mec","erosão e trincas de palhetas, rolamentos, degradação de EGT",1500,"tendência de EGT, boroscopia, análise de óleo, vibração"],
["atuador_aero","Atuador hidráulico de controle de voo","Aeronáutico",1.3,30000,1.5,"mec","vazamento de vedação, desgaste",1000,"teste funcional, vazamento"],
["apu","APU (unidade auxiliar de potência)","Aeronáutico",1.5,5000,2,"mec","partida, ignição, combustor",300,"tendência de EGT, partidas falhadas"],
["pastilha_freio","Pastilha / lona de freio veicular","Frota e automotivo",3.0,1500,2,"mec","desgaste",150,"espessura, ruído"],
["pneu","Pneu de veículo / fora de estrada","Frota e automotivo",3.0,2500,2,"mec","desgaste de banda, corte, separação",250,"profundidade de sulco, pressão, temperatura"],
["bateria_auto","Bateria automotiva","Frota e automotivo",2.5,25000,1.5,"ele","sulfatação, perda de capacidade",1000,"condutância, tensão de partida"],
["embreagem_veic","Embreagem veicular","Frota e automotivo",2.5,4000,2,"mec","desgaste de disco, platô",300,"curso de pedal, patinação"],
["alternador","Alternador","Frota e automotivo",1.8,6000,1.5,"ele","diodos, regulador, rolamento, escovas",300,"tensão de carga, ripple"],
["motor_partida","Motor de partida","Frota e automotivo",1.8,5000,1.5,"ele","escovas, solenoide, bendix",200,"corrente e tempo de partida"],
["amortecedor","Amortecedor","Frota e automotivo",2.5,3000,2,"mec","perda de óleo, desgaste de vedação",300,"inspeção, bancada"],
["tubo_caldeira","Tubo de caldeira","Utilidades e HVAC",2.5,80000,2,"mec","corrosão, erosão por fuligem, sobreaquecimento, fluência",5000,"espessura, inspeção, química da água"],
["queimador","Queimador","Utilidades e HVAC",1.6,20000,1.5,"mec","bico obstruído, ignitor, fotocélula",500,"análise de combustão, chama"],
["torre_resfr","Torre de resfriamento (enchimento/ventilador)","Utilidades e HVAC",2.0,40000,2,"mec","incrustação do enchimento, redutor do ventilador, desbalanceamento",2000,"vibração, approach térmico, inspeção"],
["comp_refrig","Compressor de refrigeração","Utilidades e HVAC",1.6,40000,2,"mec","retorno de líquido, perda de óleo, válvulas, motor hermético",1500,"superaquecimento, pressões, corrente, análise de óleo"],
["filtro_ar","Filtro de ar","Utilidades e HVAC",3.0,2000,1,"mec","saturação",200,"pressão diferencial"],
["secador","Secador de ar comprimido","Utilidades e HVAC",1.4,30000,1.5,"mec","dessecante saturado, válvulas, compressor frigorífico",1000,"ponto de orvalho, ciclos"],
["membrana_ro","Membrana de osmose reversa","Utilidades e HVAC",2.5,25000,1.5,"mec","incrustação, fouling biológico, oxidação por cloro",2000,"pressão diferencial, rejeição de sais, vazão normalizada"],
["solda_estrut","Junta soldada estrutural (fadiga)","Estruturas",3.0,150000,4,"mec","trinca de fadiga no pé da solda, corrosão",5000,"partículas magnéticas, ultrassom, inspeção visual"],
["fixacao","Fixação aparafusada","Estruturas",1.8,40000,2,"mec","afrouxamento por vibração, fadiga, corrosão",500,"torque de verificação, marcação, vibração"],
["base_chumbador","Base / chumbadores / grout","Estruturas",2.5,200000,2,"mec","trinca do grout, chumbador solto, pé manco",3000,"vibração de fase, inspeção, pé manco"],
["feltro_papel","Feltro de máquina de papel","Papel e celulose",2.5,1200,2,"mec","compactação, entupimento, desgaste, perda de permeabilidade",150,"permeabilidade, umidade da folha, vácuo das caixas de sucção"],
["tela_formadora","Tela formadora","Papel e celulose",2.5,1500,2,"mec","desgaste abrasivo por cargas minerais, rasgo, falha de emenda",150,"espessura, marcas na folha, inspeção"],
["cil_secador","Cilindro secador / Yankee","Papel e celulose",2.0,80000,2,"mec","desgaste e corrosão da superfície, falha de junta rotativa e sifão",3000,"espessura por ultrassom, perfil térmico, vibração"],
["junta_rotativa","Junta rotativa de vapor","Papel e celulose",1.8,15000,1.5,"mec","desgaste do anel de vedação, vazamento",500,"vazamento, temperatura"],
["refinador","Discos de refinador","Papel e celulose",3.0,1500,2,"mec","desgaste das barras, cavitação, contato disco-disco",150,"potência específica, folga, qualidade da fibra"],
["lamina_raspa","Lâmina raspadora (doctor blade)","Papel e celulose",3.0,200,2,"mec","desgaste, lascamento",20,"inspeção, ângulo de contato"],
["manta_prensa","Manta de prensa de sapata","Papel e celulose",2.5,6000,2,"mec","trinca, delaminação, vazamento de óleo",400,"inspeção, pressão de óleo"],
["digestor","Digestor / vaso de cozimento","Papel e celulose",2.5,150000,2,"mec","corrosão cáustica, trinca por corrosão sob tensão",8000,"espessura, END, inspeção interna"],
["caldeira_recup","Tubos de caldeira de recuperação","Papel e celulose",2.5,60000,2,"mec","corrosão e erosão por licor e fundido, trincas nas aberturas de ar",5000,"espessura, inspeção, química"],
["homogeneizador","Homogeneizador (pistões e válvulas)","Alimentos e bebidas",2.0,6000,2,"mec","desgaste de válvulas, vedações de pistão, trinca no bloco",400,"pressão de homogeneização, vibração, vazamento"],
["pasteurizador","Pasteurizador de placas (gaxetas)","Alimentos e bebidas",2.5,8000,1.5,"mec","degradação de gaxetas, furos por corrosão, incrustação",500,"teste de estanqueidade, delta T, pressão diferencial"],
["envasadora","Válvula de enchimento de envasadora","Alimentos e bebidas",2.0,5000,1.5,"mec","desgaste de vedações e molas, sujeira",300,"precisão de enchimento, vazamento"],
["faca_corte","Faca / lâmina de corte e embalagem","Alimentos e bebidas",3.0,800,2,"mec","desgaste do gume, lascamento",80,"qualidade do corte, inspeção"],
["esteira_modular","Esteira modular plástica","Alimentos e bebidas",2.2,15000,2,"mec","desgaste de pinos e articulações, alongamento",800,"alongamento, inspeção"],
["comp_amonia","Compressor de amônia (refrigeração)","Alimentos e bebidas",1.8,40000,2,"mec","desgaste de rolamentos e rotores, selo",2000,"vibração, análise de óleo, temperatura de descarga"],
["refrat_rotativo","Refratário de forno rotativo","Cimento e cal",3.0,7000,2,"mec","erosão, ataque químico, lascamento",400,"scanner de carcaça, inspeção"],
["rolete_forno","Rolete de apoio de forno rotativo","Cimento e cal",2.5,60000,3,"mec","desgaste superficial, trincas, mancais",3000,"temperatura de mancal, alinhamento, inspeção"],
["prensa_rolos","Superfície de prensa de rolos","Cimento e cal",3.0,10000,2,"mec","desgaste, lascamento do revestimento",600,"perfil, inspeção"],
["manga_filtro","Manga de filtro de mangas","Cimento e cal",2.5,20000,1.5,"mec","rasgo, abrasão, colmatação, ataque químico",800,"pressão diferencial, particulado na chaminé, inspeção"],
["agitador","Agitador / misturador","Química e petroquímica",1.6,30000,2,"mec","selo, rolamentos, redutor, erosão das pás",1500,"vibração, vazamento, corrente"],
["palheta_vapor","Palhetas de turbina a vapor","Energia",2.5,80000,2,"mec","erosão por gotículas, fadiga, depósitos",4000,"vibração, desempenho, boroscopia"],
["mancal_turbina","Mancal de turbina","Energia",2.0,80000,2,"mec","perda de filme de óleo, desgaste, contaminação",2000,"proximidade (órbita), temperatura de metal, análise de óleo"],
["redutor_robo","Redutor de robô (harmônico/cicloidal)","Robótica e movimento",2.0,25000,3,"mec","desgaste, perda de rigidez, folga, vazamento de graxa",1500,"corrente do eixo, folga, análise de graxa"],
["servomotor","Servomotor","Robótica e movimento",1.6,30000,1.5,"ele","rolamentos, encoder, isolação, freio",1000,"corrente, temperatura, erros de encoder"],
["guia_linear","Guia linear / patim","Robótica e movimento",2.0,20000,3,"mec","desgaste, contaminação, perda de pré-carga",1000,"vibração, força de deslocamento, lubrificação"],
["fuso_esferas","Fuso de esferas","Robótica e movimento",2.0,20000,3,"mec","desgaste de pista, folga, contaminação",1000,"folga, precisão de posicionamento, vibração"],
["gen_mec","Outro: mecânico (fadiga/desgaste)","Genéricos",1.8,30000,2,"mec","desgaste, fadiga, corrosão",1000,"vibração, inspeção, análise de lubrificante"],
["gen_ele","Outro: elétrico","Genéricos",1.6,80000,1.5,"ele","isolação, contatos, conexões",2000,"termografia, IR, resistência de contato"],
["gen_elo","Outro: eletrônico","Genéricos",1.0,60000,1,"elo","falhas aleatórias, temperatura, surtos",100,"diagnóstico, temperatura"],
["gen_desgaste","Outro: peça de desgaste rápido","Genéricos",3.0,1500,2,"mec","desgaste abrasivo/erosivo",150,"espessura ou perfil"]];
const CATS=[...new Set(RAW.map(r=>r[2]))];
function parseDate(s){if(s instanceof Date)return isNaN(s)?null:new Date(s.getFullYear(),s.getMonth(),s.getDate());
  s=String(s||"").trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return new Date(+m[1],+m[2]-1,+m[3]);
  m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);if(m){let y=+m[3];if(y<100)y+=2000;const d=new Date(y,+m[2]-1,+m[1]);return +m[2]<=12?d:null}
  return null}
const iso=d=>d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`:"";
function randn(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function rgamma(a){if(a<1)return rgamma(a+1)*Math.pow(Math.random(),1/a);const d=a-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{x=randn();v=1+c*x}while(v<=0);v=v*v*v;const u=Math.random();if(u<1-.0331*x**4||Math.log(u)<.5*x*x+d*(1-v+Math.log(v)))return d*v}}
function weibullMLEbeta(t,cens){const all=t.concat(cens),ml=t.map(Math.log).reduce((a,b)=>a+b,0)/t.length,la=all.map(Math.log);
  const g=b=>{let s=0,sl=0;all.forEach((x,i)=>{const p=Math.pow(x,b);s+=p;sl+=p*la[i]});return sl/s-1/b-ml};
  let lo=.2,hi=12;if(g(lo)*g(hi)>0)return null;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(g(lo)*g(m)<=0)hi=m;else lo=m}return(lo+hi)/2}
function envFactor(f,c){const lev=[1,.85,.7,.55],parts={};
  const carga=Math.max(5,+f.carga||75);parts.carga=Math.min(3,Math.max(.25,Math.pow(75/carga,c.kLoad)));
  const T=+f.temp||30,tref=c.cls==="mec"?40:35,step=c.cls==="mec"?15:10;parts.temperatura=T>tref?Math.max(.15,Math.pow(2,-(T-tref)/step)):1.1;
  const w=c.cls==="mec"?1:.6;parts.poeira=1-(1-lev[+f.poeira||0])*w;parts.umidade=lev[+f.umidade||0];parts.corrosao=lev[+f.corros||0];
  parts.regime={corretiva:.8,preventiva:1,preditiva:1.15}[f.regime]||1;let tot=1;Object.values(parts).forEach(v=>tot*=v);
  return {tot:Math.max(.05,Math.min(3,tot)),parts}}
function effAge(age,beta,eta,hi){if(hi==null||isNaN(hi))return age;const tc=eta*Math.pow(-Math.log(Math.min(.99,Math.max(.01,hi))),1/beta);return Math.max(age*.5,.5*age+.5*tc)}
function toNum(v){if(typeof v==="number")return v;if(v instanceof Date)return NaN;let s=String(v??"").trim();if(!s)return NaN;
  if(/^-?[\d.]+,\d+$/.test(s))s=s.replace(/\./g,"").replace(",",".");const n=+s;return isFinite(n)?n:NaN}
function toTime(v){if(v instanceof Date)return isNaN(v)?NaN:v.getTime();
  if(typeof v==="number"){if(v>20000&&v<80000)return Math.round((v-25569)*864e5)+new Date().getTimezoneOffset()*6e4;if(v>1e11&&v<1e13)return v;return NaN}
  const s=String(v||"").trim();const ms=x=>+((x||"0")+"00").slice(0,3);
  let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?/);if(m)return new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0),ms(m[7])).getTime();
  m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})[ T,]+(\d{1,2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?\s*(AM|PM)?/i);
  if(m){let y=+m[3];if(y<100)y+=2000;let h=+m[4];let d=+m[1],mo=+m[2];if(m[8]){if(/pm/i.test(m[8])&&h<12)h+=12;if(/am/i.test(m[8])&&h===12)h=0;if(+m[1]<=12){mo=+m[1];d=+m[2]}}
    if(mo>12&&d<=12){const x=d;d=mo;mo=x}return new Date(y,mo-1,d,h,+m[5],+(m[6]||0),ms(m[7])).getTime()}
  const d=parseDate(s);return d?d.getTime():NaN}
function splitCSV(text){const first=text.split(/\r?\n/).slice(0,6).join("\n");let best=",",bc=-1;[";",",","\t","|"].forEach(c=>{const n=first.split(c).length;if(n>bc){bc=n;best=c}});
  const rows=[];let row=[],cur="",q=false;for(let i=0;i<text.length;i++){const ch=text[i];
    if(q){if(ch==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
    else if(ch==='"')q=true;else if(ch===best){row.push(cur);cur=""}
    else if(ch==="\n"||ch==="\r"){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(cur);rows.push(row);row=[];cur=""}else cur+=ch}
  if(cur||row.length){row.push(cur);rows.push(row)}return rows.filter(r=>r.some(c=>String(c).trim()))}
function headerRow(rows){for(let i=0;i<Math.min(20,rows.length);i++){if(rows[i].filter(c=>typeof c==="string"&&c.trim()&&isNaN(+c.replace(",","."))).length>=2)return i}return 0}
const fmtNum=v=>!isFinite(v)?"—":Math.abs(v)>=1000?v.toFixed(0):Math.abs(v)>=10?v.toFixed(1):v.toFixed(2);
const fmtDur=ms=>{const s=ms/1e3;return s<120?`${s.toFixed(0)} s`:s<7200?`${(s/60).toFixed(1)} min`:`${(s/3600).toFixed(1)} h`};
const pad2=n=>String(n).padStart(2,"0");
const fmtBR=t=>{const d=new Date(t);return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`};
const OPR_RE=/oper|user|usu[aá]r|write|escrit|comando|command|setpoint|alter|change|mudan|mode\b|modo|manual|bypass|forc|inib|shelv|supress/i;
function alKind(st){if(st==null)return "alm";st=String(st);if(!st.trim())return "alm";
  if(OPR_RE.test(st)&&!/unack|ack_|_alm|alm$/i.test(st))return "opr";
  if(/unack_?alm|unacked_alm|^alm$|in ?alarm|^ativ|^active|^come|^entr|^set$|^on$|^raise|^new/i.test(st))return "alm";
  if(/rtn|return|retorn|normal|clear|inativ|inactive|went ?out|^sai|^off$|reset/i.test(st))return "rtn";
  if(/ack|reconh/i.test(st))return "ack";return "alm"}
function detectFmt(name,t){const n=name.toLowerCase();
  if(/<RSLogix5000Content/i.test(t))return "Rockwell L5X";if(n.endsWith(".l5k"))return "Rockwell L5K";if(/plcopen\.org\/xml\/tc6/i.test(t))return "PLCopen XML";
  if(/<Document>[\s\S]*?<Engineering version|SW\.Blocks\./i.test(t))return "Siemens TIA Openness XML";
  if(/\b(ORGANIZATION_BLOCK|FUNCTION_BLOCK|FUNCTION|DATA_BLOCK)\b/i.test(t)&&/^\s*(NETWORK|U\(|UN\s|U\s|O\s|=\s)/m.test(t))return "Siemens AWL/STL";
  if(/\b(ORGANIZATION_BLOCK|FUNCTION_BLOCK|DATA_BLOCK)\b/i.test(t)&&(/\bBEGIN\b/i.test(t)||/FUNCTION_BLOCK\s+"/.test(t)||/#\w+\s*:=/.test(t)))return "Siemens SCL";
  if(/\b(PROGRAM|FUNCTION_BLOCK|FUNCTION)\b[\s\S]*\bEND_(PROGRAM|FUNCTION_BLOCK|FUNCTION)\b/i.test(t))return "IEC 61131-3 ST";
  if(/\b(XIC|XIO|OTE|OTL|OTU)\(/.test(t))return "Ladder em texto (Rockwell)";
  if(/^\s*(LD|LDI|OUT|AND|ANI|OR|ORI|SET|RST)\s+[XYMDTC]\d/im.test(t))return "Mitsubishi lista";
  if(/:=/.test(t))return "Texto estruturado";return "Texto ou tabela"}
const stripComments=s=>s.replace(/\(\*[\s\S]*?\*\)/g,"").replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/.*$/gm,"");
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function pdecl(name,type,src){if(!name)return;const k=String(name).trim();if(k&&!PLC.decl[k])PLC.decl[k]={type:String(type||""),src}}
function parseL5X(f){const doc=new DOMParser().parseFromString(f.text,"application/xml");
  [...doc.getElementsByTagName("Tag")].forEach(t=>pdecl(t.getAttribute("Name"),t.getAttribute("DataType")||t.getAttribute("TagType"),"tag"));
  [...doc.getElementsByTagName("Parameter")].forEach(t=>pdecl(t.getAttribute("Name"),t.getAttribute("DataType"),"param"));
  [...doc.getElementsByTagName("LocalTag")].forEach(t=>pdecl(t.getAttribute("Name"),t.getAttribute("DataType"),"local"));
  [...doc.getElementsByTagName("AddOnInstructionDefinition")].forEach(a=>PLC.routines.add(a.getAttribute("Name")));
  [...doc.getElementsByTagName("Routine")].forEach(r=>{const prog=r.closest("Program,AddOnInstructionDefinition"),pn=prog?.getAttribute("Name")||"",rn=r.getAttribute("Name"),type=r.getAttribute("Type");PLC.routines.add(rn);
    if(type==="RLL")[...r.getElementsByTagName("Rung")].forEach(g=>{const tx=(g.getElementsByTagName("Text")[0]?.textContent||"").trim(),cm=(g.getElementsByTagName("Comment")[0]?.textContent||"").trim();PLC.units.push({name:`${pn}/${rn} rung ${g.getAttribute("Number")}`,lang:"rung",text:tx,comment:cm,src:f.name})});
    else if(type==="ST")PLC.units.push({name:`${pn}/${rn}`,lang:"st",text:[...r.getElementsByTagName("Line")].map(l=>l.textContent).join("\n"),src:f.name});
    else PLC.units.push({name:`${pn}/${rn} (${type})`,lang:"txt",text:r.textContent.replace(/\s+/g," ").slice(0,20000),src:f.name})})}
function parsePLCopen(f){const doc=new DOMParser().parseFromString(f.text,"application/xml"),T=(el,n)=>[...el.getElementsByTagName(n)];
  T(doc,"variable").forEach(v=>{const nm=v.getAttribute("name");if(nm){const ty=v.getElementsByTagName("type")[0];pdecl(nm,ty?.firstElementChild?.getAttribute?.("name")||ty?.firstElementChild?.tagName||"","var")}});
  T(doc,"pou").forEach(p=>{const pn=p.getAttribute("name");PLC.routines.add(pn);const body=p.getElementsByTagName("body")[0];if(!body)return;const st=body.getElementsByTagName("ST")[0];
    if(st){PLC.units.push({name:pn,lang:"st",text:st.textContent,src:f.name});return}const ld=body.getElementsByTagName("LD")[0]||body.getElementsByTagName("FBD")[0];
    if(ld){const coils=T(ld,"coil").map(c=>{const v=c.getElementsByTagName("variable")[0]?.textContent.trim(),s=c.getAttribute("storage")||"";return s==="set"?`OTL(${v})`:s==="reset"?`OTU(${v})`:`OTE(${v})`}).join("");
      const ct=T(ld,"contact").map(c=>`XIC(${c.getElementsByTagName("variable")[0]?.textContent.trim()})`).join(""),bl=T(ld,"block").map(b=>`${b.getAttribute("typeName")}(${b.getAttribute("instanceName")||""})`).join("");
      PLC.units.push({name:pn,lang:"rung",text:ct+bl+coils,src:f.name})}else PLC.units.push({name:pn,lang:"txt",text:body.textContent.slice(0,20000),src:f.name})})}
function parseTIA(f){const doc=new DOMParser().parseFromString(f.text,"application/xml"),blocks=[...doc.getElementsByTagName("*")].filter(e=>/^SW\.Blocks\.(OB|FB|FC|GlobalDB|InstanceDB)$/.test(e.tagName));
  (blocks.length?blocks:[doc.documentElement]).forEach(b=>{const al=[...b.children].find(c=>c.tagName==="AttributeList"),name=[...(al?.children||[])].find(c=>c.tagName==="Name")?.textContent||b.tagName;PLC.routines.add(name);
    [...b.getElementsByTagName("Member")].forEach(m=>pdecl(m.getAttribute("Name"),m.getAttribute("Datatype"),name));const cus=[...b.getElementsByTagName("SW.Blocks.CompileUnit")];
    if(!cus.length){PLC.units.push({name,lang:"txt",text:b.textContent.replace(/\s+/g," ").slice(0,30000),src:f.name});return}
    cus.forEach((cu,i)=>{const lang=cu.getElementsByTagName("ProgrammingLanguage")[0]?.textContent||"",stEl=cu.getElementsByTagName("StructuredText")[0];
      if(stEl){const tk=[];[...stEl.getElementsByTagName("*")].forEach(n=>{const tg=n.tagName;if(tg==="Token")tk.push(n.getAttribute("Text"));else if(tg==="Blank")tk.push(" ".repeat(+(n.getAttribute("Num")||1)));else if(tg==="NewLine")tk.push("\n".repeat(+(n.getAttribute("Num")||1)));
          else if(tg==="Component"&&n.parentElement?.tagName==="Symbol"){tk.push(([...n.parentElement.children].indexOf(n)>0?".":"")+n.getAttribute("Name"))}else if(tg==="ConstantValue")tk.push(n.textContent)});
        PLC.units.push({name:`${name} rede ${i+1}`,lang:"st",text:tk.join(""),src:f.name});return}
      const fl=cu.getElementsByTagName("FlgNet")[0];if(!fl){PLC.units.push({name:`${name} rede ${i+1}`,lang:"txt",text:cu.textContent.replace(/\s+/g," ").slice(0,8000),src:f.name});return}
      const acc={},parts={};[...fl.getElementsByTagName("Access")].forEach(a=>{const cs=[...a.getElementsByTagName("Component")].map(c=>c.getAttribute("Name"));acc[a.getAttribute("UId")]=cs.length?cs.join("."):(a.getElementsByTagName("ConstantValue")[0]?.textContent||"?")});
      [...fl.getElementsByTagName("Part")].forEach(p=>parts[p.getAttribute("UId")]=p.getAttribute("Name"));const MAP={Contact:"XIC",Coil:"OTE",SCoil:"OTL",RCoil:"OTU",PContact:"ONS",NContact:"XIO"};let tx="";
      [...fl.getElementsByTagName("Wire")].forEach(w=>{const id=w.getElementsByTagName("IdentCon")[0],nc=w.getElementsByTagName("NameCon")[0];if(id&&nc){const part=parts[nc.getAttribute("UId")],op=acc[id.getAttribute("UId")];if(part)tx+=`${MAP[part]||part.toUpperCase().replace(/[^A-Z0-9_]/g,"_")}(${op})`}});
      PLC.units.push({name:`${name} rede ${i+1} (${lang})`,lang:"rung",text:tx,src:f.name})})})}
function parseText(f){const t=f.text,fmt=f.fmt;
  if(/AWL|STL|Mitsubishi/.test(fmt)){t.split(/^\s*(?:NETWORK|Network|NW|Rede)\b.*$/m).forEach((p,i)=>{if(p.trim())PLC.units.push({name:`${f.name} rede ${i}`,lang:/Mitsubishi/.test(fmt)?"il":"awl",text:p,src:f.name})})}
  else if(/Ladder em texto/.test(fmt))t.split(/;\s*/).forEach((r,i)=>{if(r.trim())PLC.units.push({name:`${f.name} rung ${i}`,lang:"rung",text:r.trim()+";",src:f.name})});
  else{const re=/\b(PROGRAM|FUNCTION_BLOCK|FUNCTION|ORGANIZATION_BLOCK|ACTION|METHOD)\s+"?([\w.]+)"?/gi;let m;const idx=[];while((m=re.exec(t)))idx.push({i:m.index,name:m[2]});if(!idx.length)idx.push({i:0,name:f.name});
    idx.forEach((x,k)=>{PLC.routines.add(x.name);PLC.units.push({name:x.name,lang:"st",text:t.slice(x.i,k+1<idx.length?idx[k+1].i:t.length),src:f.name})})}
  const vre=/\bVAR(?:_INPUT|_OUTPUT|_IN_OUT|_GLOBAL|_TEMP|_STAT|_EXTERNAL|_CONFIG)?(?:\s+CONSTANT|\s+RETAIN|\s+PERSISTENT)?\b([\s\S]*?)\bEND_VAR\b/gi;let vm;
  while((vm=vre.exec(t)))stripComments(vm[1]).split(/;/).forEach(l=>{const mm=l.match(/^\s*"?([A-Za-z_]\w*)"?\s*(?:\{[^}]*\})?\s*(?:AT\s+%\S+\s*)?:\s*(ARRAY[^;]*|[A-Za-z_][\w."]*)/i);if(mm)pdecl(mm[1],mm[2],f.name)})}
function evalExpr(x,P){if(typeof x==="number")return x;const s=String(x).replace(/(\d),(\d)/g,"$1.$2").replace(/\s*mm\b/gi,"").trim();let i=0;const sk=()=>{while(/\s/.test(s[i]||""))i++};
  function atom(){sk();let m=s.slice(i).match(/^(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?/i);if(m){i+=m[0].length;return +m[0]}m=s.slice(i).match(/^[A-Za-z_]\w*/);
    if(m){i+=m[0].length;const v=m[0];if(v in P)return P[v];if(/^pi$/i.test(v))return Math.PI;throw new Error(`parâmetro desconhecido: ${v}`)}
    if(s[i]==="("){i++;const v=add();sk();if(s[i]!==")")throw new Error("parêntese sem fechar");i++;return v}if(s[i]==="-"){i++;return -atom()}if(s[i]==="+"){i++;return atom()}throw new Error(`expressão inválida: ${s}`)}
  function mul(){let v=atom();for(;;){sk();if(s[i]==="*"){i++;v*=atom()}else if(s[i]==="/"){i++;v/=atom()}else return v}}
  function add(){let v=mul();for(;;){sk();if(s[i]==="+"){i++;v+=mul()}else if(s[i]==="-"){i++;v-=mul()}else return v}}
  const v=add();sk();if(i<s.length)throw new Error(`expressão inválida: ${s}`);return v}
const OPMAP={revolve:"revolucao","revolução":"revolucao",revolucao:"revolucao",lathe:"revolucao",cylinder:"cilindro",cilindro:"cilindro",box:"caixa",caixa:"caixa",hole:"furo",furo:"furo",furos:"furos_circulares",furos_circulares:"furos_circulares",hole_pattern:"furos_circulares",slot:"rasgo",rasgo:"rasgo",pocket:"rasgo"};
const SOLID=new Set(["revolucao","cilindro","caixa"]);
const CUT=new Set(["furo","furos_circulares","rasgo"]);
function bnds(ps){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const P=(x,y)=>{if(!isFinite(x)||!isFinite(y))return;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y};
  ps.forEach(p=>{if(p.t==="l"){P(p.x1,p.y1);P(p.x2,p.y2)}else if(p.t==="c"){P(p.cx-p.r,p.cy-p.r);P(p.cx+p.r,p.cy+p.r)}else if(p.t==="hatch")p.pts.forEach(q=>P(q[0],q[1]));
    else if(p.t==="d"){if(p.dir==="h"){P(p.x1,p.y);P(p.x2,p.y)}else{P(p.x,p.y1);P(p.x,p.y2)}}else if(p.t==="tx"){P(p.x,p.y);P(p.x+p.s.length*p.h*.6,p.y+p.h)}});
  if(!isFinite(x0)){x0=y0=0;x1=y1=1}return {x0,y0,x1,y1,w:x1-x0,h:y1-y0}}
function shiftP(p,dy){const q={...p};if(p.t==="l"){q.y1+=dy;q.y2+=dy}else if(p.t==="c")q.cy+=dy;else if(p.t==="hatch")q.pts=p.pts.map(([x,y])=>[x,y+dy]);return q}
const fmtMM=v=>String(+(+v).toFixed(2)).replace(".",",");
function cadLayout(){const F=CAD.feats,front=[],top=[],L=(a,x1,y1,x2,y2,st="v")=>a.push({t:"l",x1,y1,x2,y2,st}),Cc=(a,cx,cy,r,st="v")=>a.push({t:"c",cx,cy,r,st}),R=(a,x1,y1,x2,y2,st)=>{L(a,x1,y1,x2,y1,st);L(a,x2,y1,x2,y2,st);L(a,x2,y2,x1,y2,st);L(a,x1,y2,x1,y1,st)};
  const rev=F.find(f=>f.op==="revolucao");
  F.forEach(f=>{const hid=CUT.has(f.op)?"h":"v";
    if(f.op==="revolucao"){const p=f.perfil;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];L(front,a[0],a[1],b[0],b[1]);L(front,-a[0],a[1],-b[0],b[1])}
      front.push({t:"hatch",pts:p.map(q=>[q[0],q[1]])},{t:"hatch",pts:p.map(q=>[-q[0],q[1]])});const rs=[...new Set(p.map(q=>+q[0].toFixed(4)).filter(r=>r>1e-6))],rm=Math.max(...rs),zs=p.map(q=>q[1]);
      rs.forEach(r=>Cc(top,0,0,r));const e=rm*.12+3;L(front,0,Math.min(...zs)-e,0,Math.max(...zs)+e,"c");L(top,-rm-e,0,rm+e,0,"c");L(top,0,-rm-e,0,rm+e,"c")}
    else if(f.op==="cilindro"||f.op==="furo"){const r=f.d/2;if(f.eixo==="x"){R(front,f.x,f.z-r,f.x+f.h,f.z+r,hid);R(top,f.x,f.y-r,f.x+f.h,f.y+r,hid)}else if(f.eixo==="y"){Cc(front,f.x,f.z,r);R(top,f.x-r,f.y,f.x+r,f.y+f.h,hid)}else{R(front,f.x-r,f.z,f.x+r,f.z+f.h,hid);Cc(top,f.x,f.y,r)}}
    else if(f.op==="caixa"||f.op==="rasgo"){R(front,f.x-f.w/2,f.z,f.x+f.w/2,f.z+f.h,hid);R(top,f.x-f.w/2,f.y-f.p/2,f.x+f.w/2,f.y+f.p/2,hid)}
    else if(f.op==="furos_circulares"){Cc(top,0,0,f.pcd/2,"c");const xs=new Set();for(let i=0;i<f.n;i++){const a=(f.angulo0+i*360/f.n)*Math.PI/180,x=f.pcd/2*Math.cos(a),y=f.pcd/2*Math.sin(a);Cc(top,x,y,f.d/2);const k=x.toFixed(2);if(!xs.has(k)){xs.add(k);R(front,x-f.d/2,f.z,x+f.d/2,f.z+f.h,"h")}}}});
  const bf=bnds(front),bt0=bnds(top),md=Math.max(bf.w,bf.h,bt0.w,bt0.h,1),o1=md*.09+4,gap=md*.3+o1*2,dy=bf.y0-gap-bt0.y1,topS=top.map(p=>shiftP(p,dy)),bt=bnds(topS),dims=[];
  if(rev){const rs=[...new Set(rev.perfil.map(q=>+q[0].toFixed(3)))].filter(r=>r>0).sort((a,b)=>b-a).slice(0,3);rs.forEach((r,i)=>dims.push({t:"d",dir:"h",x1:-r,x2:r,y:bf.y1+o1*(i+1),ref:bf.y1,text:"Ø"+fmtMM(2*r)}));
    const zs=[...new Set(rev.perfil.map(q=>+q[1].toFixed(3)))].sort((a,b)=>a-b);dims.push({t:"d",dir:"v",y1:zs[0],y2:zs[zs.length-1],x:bf.x1+o1,ref:bf.x1,text:fmtMM(zs[zs.length-1]-zs[0])});
    for(let i=1;i<Math.min(zs.length-1,3);i++)dims.push({t:"d",dir:"v",y1:zs[0],y2:zs[i],x:bf.x1+o1*(i+1),ref:bf.x1,text:fmtMM(zs[i]-zs[0])})}
  else{dims.push({t:"d",dir:"h",x1:bf.x0,x2:bf.x1,y:bf.y1+o1,ref:bf.y1,text:fmtMM(bf.w)});dims.push({t:"d",dir:"v",y1:bf.y0,y2:bf.y1,x:bf.x1+o1,ref:bf.x1,text:fmtMM(bf.h)})}
  dims.push({t:"d",dir:"v",y1:bt.y0,y2:bt.y1,x:bt.x1+o1,ref:bt.x1,text:fmtMM(bt.h)});const fc=F.find(f=>f.op==="furos_circulares"),th=md*.035+2;
  const labels=[{t:"tx",x:bf.x0,y:bf.y0-o1,s:rev?"CORTE A-A":"VISTA FRONTAL",h:th},{t:"tx",x:bt.x0,y:bt.y0-o1,s:"VISTA SUPERIOR"+(fc?`  ·  ${fc.n} furos Ø${fmtMM(fc.d)} em PCD ${fmtMM(fc.pcd)}`:""),h:th}];
  return {all:[...front,...topS,...dims,...labels],md}}
function cadSVG(exp){const {all}=cadLayout(),b=bnds(all),W=760,m=40,s=Math.min((W-2*m)/Math.max(b.w,1e-6),640/Math.max(b.h,1e-6)),dh=b.h*s+2*m,TB=56,H=dh+TB;
  const C=exp?{ink:"#15232C",muted:"#5B6B74",steel:"#2F5D73",bg:"#FFFFFF"}:{ink:"var(--ink)",muted:"var(--muted)",steel:"var(--steel)",bg:"var(--panel)"};
  const X=x=>+(m+(x-b.x0)*s).toFixed(1),Y=y=>+(m+(b.y1-y)*s).toFixed(1),id="h"+Math.random().toString(36).slice(2,7),M=CAD.model;
  const sty={v:`stroke="${C.ink}" stroke-width="1.4"`,h:`stroke="${C.ink}" stroke-width=".9" stroke-dasharray="5 3"`,c:`stroke="${C.steel}" stroke-width=".8" stroke-dasharray="14 3 2 3"`};
  let g=`<defs><pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="${C.muted}" stroke-width=".7"/></pattern><marker id="${id}a" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto-start-reverse"><path d="M0,0 L7,3 L0,6 z" fill="${C.muted}"/></marker></defs><rect x="0" y="0" width="${W}" height="${H}" fill="${C.bg}"/>`;
  all.forEach(p=>{if(p.t==="hatch")g+=`<polygon points="${p.pts.map(q=>X(q[0])+","+Y(q[1])).join(" ")}" fill="url(#${id})" stroke="none"/>`});
  const ar=`stroke="${C.muted}" stroke-width=".8" marker-start="url(#${id}a)" marker-end="url(#${id}a)"`,ext=`stroke="${C.muted}" stroke-width=".5"`;
  all.forEach(p=>{if(p.t==="l")g+=`<line x1="${X(p.x1)}" y1="${Y(p.y1)}" x2="${X(p.x2)}" y2="${Y(p.y2)}" ${sty[p.st]||sty.v}/>`;
    else if(p.t==="c")g+=`<circle cx="${X(p.cx)}" cy="${Y(p.cy)}" r="${(p.r*s).toFixed(1)}" fill="none" ${sty[p.st]||sty.v}/>`;
    else if(p.t==="d"){if(p.dir==="h"){const y=Y(p.y);if(p.ref!=null)g+=`<line x1="${X(p.x1)}" y1="${Y(p.ref)}" x2="${X(p.x1)}" y2="${y-3}" ${ext}/><line x1="${X(p.x2)}" y1="${Y(p.ref)}" x2="${X(p.x2)}" y2="${y-3}" ${ext}/>`;
        g+=`<line x1="${X(p.x1)}" y1="${y}" x2="${X(p.x2)}" y2="${y}" ${ar}/><text x="${((X(p.x1)+X(p.x2))/2).toFixed(1)}" y="${y-4}" text-anchor="middle" font-size="10.5" fill="${C.ink}" font-family="monospace">${esc(p.text)}</text>`}
      else{const x=X(p.x),ym=((Y(p.y1)+Y(p.y2))/2).toFixed(1);if(p.ref!=null)g+=`<line x1="${X(p.ref)}" y1="${Y(p.y1)}" x2="${x+3}" y2="${Y(p.y1)}" ${ext}/><line x1="${X(p.ref)}" y1="${Y(p.y2)}" x2="${x+3}" y2="${Y(p.y2)}" ${ext}/>`;
        g+=`<line x1="${x}" y1="${Y(p.y1)}" x2="${x}" y2="${Y(p.y2)}" ${ar}/><text x="${x+11}" y="${ym}" text-anchor="middle" font-size="10.5" fill="${C.ink}" font-family="monospace" transform="rotate(-90 ${x+11} ${ym})">${esc(p.text)}</text>`}}
    else if(p.t==="tx")g+=`<text x="${X(p.x)}" y="${Y(p.y)}" font-size="11" fill="${C.ink}" font-family="sans-serif" font-weight="600" letter-spacing=".5">${esc(p.s)}</text>`});
  g+=`<rect x="12" y="${dh}" width="${W-24}" height="${TB-12}" fill="none" stroke="${C.ink}" stroke-width="1"/><line x1="${W*.62}" y1="${dh}" x2="${W*.62}" y2="${dh+TB-12}" stroke="${C.ink}"/>
    <text x="22" y="${dh+18}" font-size="13" font-weight="700" fill="${C.ink}" font-family="sans-serif">${esc(M.nome||"Peça")}</text><text x="22" y="${dh+35}" font-size="10.5" fill="${C.muted}" font-family="sans-serif">Material: ${esc(M.material_sugerido||"—")}</text>
    <text x="${W*.62+10}" y="${dh+18}" font-size="10.5" fill="${C.ink}" font-family="sans-serif">Unidade mm · sem escala · 1º diedro</text><text x="${W*.62+10}" y="${dh+35}" font-size="10.5" fill="${C.muted}" font-family="sans-serif">Prognos · engenharia reversa · ${new Date().toLocaleDateString("pt-BR")}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" style="${exp?"":"min-width:520px;"}max-width:100%">${g}</svg>`}
function toDXF(){const {all,md}=cadLayout(),o=["0","SECTION","2","ENTITIES"],LY={v:"VISIVEL",h:"OCULTO",c:"CENTRO"},f3=v=>(+v).toFixed(4),th=md*.03+1.5,clean=s=>String(s).replace(/Ø/g,"%%c").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7E]/g,"-");
  const line=(x1,y1,x2,y2,l)=>o.push("0","LINE","8",l,"10",f3(x1),"20",f3(y1),"30","0","11",f3(x2),"21",f3(y2),"31","0"),text=(x,y,s,l,rot)=>{o.push("0","TEXT","8",l,"10",f3(x),"20",f3(y),"30","0","40",f3(th),"1",clean(s));if(rot)o.push("50",String(rot))};
  all.forEach(p=>{if(p.t==="l")line(p.x1,p.y1,p.x2,p.y2,LY[p.st]||"VISIVEL");else if(p.t==="c")o.push("0","CIRCLE","8",LY[p.st]||"VISIVEL","10",f3(p.cx),"20",f3(p.cy),"30","0","40",f3(p.r));
    else if(p.t==="d"){if(p.dir==="h"){line(p.x1,p.y,p.x2,p.y,"COTAS");if(p.ref!=null){line(p.x1,p.ref,p.x1,p.y,"COTAS");line(p.x2,p.ref,p.x2,p.y,"COTAS")}text((p.x1+p.x2)/2-th*p.text.length*.3,p.y+th*.4,p.text,"COTAS")}
      else{line(p.x,p.y1,p.x,p.y2,"COTAS");if(p.ref!=null){line(p.ref,p.y1,p.x,p.y1,"COTAS");line(p.ref,p.y2,p.x,p.y2,"COTAS")}text(p.x-th*.4,(p.y1+p.y2)/2-th*p.text.length*.3,p.text,"COTAS",90)}}
    else if(p.t==="tx")text(p.x,p.y,p.s,"TEXTO")});o.push("0","ENDSEC","0","EOF");return o.join("\r\n")}
const E0=v=>v===undefined||v===null||v===""?"0":String(v);
function toSCAD(){const M=CAD.model;let s=`// ${M.nome||"Peça"}\n// Gerado pelo Prognos em ${new Date().toLocaleDateString("pt-BR")}. Unidade: mm. Edite os parâmetros e pressione F6 para exportar STL.\n$fn = 96;\n\n`;
  M.parametros.forEach(p=>s+=`${p.nome} = ${p.valor}; // ${(p.descricao||"").replace(/\n/g," ")}${p.origem?" ("+p.origem+")":""}\n`);
  s+=`\nmodule cil(d,h,x,y,z,eixo){ translate([x,y,z]) { if(eixo=="x") rotate([0,90,0]) cylinder(d=d,h=h); else if(eixo=="y") rotate([-90,0,0]) cylinder(d=d,h=h); else cylinder(d=d,h=h); } }\nmodule furo(d,h,x,y,z,eixo){ e=0.1; cil(d,h+2*e, x-(eixo=="x"?e:0), y-(eixo=="y"?e:0), z-((eixo!="x"&&eixo!="y")?e:0), eixo); }\nmodule caixa(w,p,h,x,y,z){ translate([x-w/2,y-p/2,z]) cube([w,p,h]); }\nmodule furos_circ(n,d,pcd,h,z,a0){ for(i=[0:n-1]) rotate([0,0,a0+i*360/n]) translate([pcd/2,0,z-0.1]) cylinder(d=d,h=h+0.2); }\n\ndifference() {\n  union() {\n`;
  const cuts=[];M.features.forEach(f=>{const a=`${E0(f.x)}, ${E0(f.y)}, ${E0(f.z)}, "${f.eixo||"z"}"`;
    if(f.op==="revolucao")s+=`    rotate_extrude() polygon(points=[${f.perfil.map(q=>`[${E0(q[0])}, ${E0(q[1])}]`).join(", ")}]);\n`;
    else if(f.op==="cilindro")s+=`    cil(${E0(f.d)}, ${E0(f.h)}, ${a});\n`;else if(f.op==="caixa")s+=`    caixa(${E0(f.w)}, ${E0(f.p)}, ${E0(f.h)}, ${E0(f.x)}, ${E0(f.y)}, ${E0(f.z)});\n`;
    else if(f.op==="furo")cuts.push(`  furo(${E0(f.d)}, ${E0(f.h)}, ${a});`);else if(f.op==="rasgo")cuts.push(`  translate([0,0,-0.01]) caixa(${E0(f.w)}, ${E0(f.p)}, (${E0(f.h)})+0.02, ${E0(f.x)}, ${E0(f.y)}, ${E0(f.z)});`);
    else if(f.op==="furos_circulares")cuts.push(`  furos_circ(${E0(f.n)}, ${E0(f.d)}, ${E0(f.pcd)}, ${E0(f.h)}, ${E0(f.z)}, ${E0(f.angulo0)});`)});
  s+=`  }\n${cuts.join("\n")}\n}\n`;if(M.observacoes)s+=`\n// Observações: ${String(M.observacoes).replace(/\n/g," ")}\n`;return s}
function toCQ(){const M=CAD.model;let s=`# ${M.nome||"Peça"}\n# Gerado pelo Prognos em ${new Date().toLocaleDateString("pt-BR")}. Unidade: mm.\n# Requer CadQuery (pip install cadquery). Rode: python este_arquivo.py  ->  gera peca.step e peca.stl\nimport cadquery as cq\n\n`;
  M.parametros.forEach(p=>s+=`${p.nome} = ${p.valor}  # ${(p.descricao||"").replace(/\n/g," ")}${p.origem?" ("+p.origem+")":""}\n`);
  s+=`\ndef cil(d, h, x, y, z, eixo="z"):\n    if eixo == "x":\n        return cq.Workplane("YZ").workplane(offset=x).center(y, z).circle(d / 2).extrude(h)\n    if eixo == "y":\n        return cq.Workplane("XZ").workplane(offset=-y).center(x, z).circle(d / 2).extrude(-h)\n    return cq.Workplane("XY").workplane(offset=z).center(x, y).circle(d / 2).extrude(h)\n\ndef furo(d, h, x, y, z, eixo="z"):\n    e = 0.1\n    return cil(d, h + 2 * e, x - (e if eixo == "x" else 0), y - (e if eixo == "y" else 0), z - (e if eixo not in ("x", "y") else 0), eixo)\n\ndef caixa(w, p, h, x, y, z):\n    return cq.Workplane("XY").box(w, p, h, centered=(True, True, False)).translate((x, y, z))\n\ndef revolucao(pts):\n    return cq.Workplane("XZ").polyline(pts).close().revolve(360, (0, 0, 0), (0, 1, 0))\n\nsolidos = []\ncortes = []\n`;
  M.features.forEach(f=>{const a=`${E0(f.x)}, ${E0(f.y)}, ${E0(f.z)}, "${f.eixo||"z"}"`;
    if(f.op==="revolucao")s+=`solidos.append(revolucao([${f.perfil.map(q=>`(${E0(q[0])}, ${E0(q[1])})`).join(", ")}]))\n`;else if(f.op==="cilindro")s+=`solidos.append(cil(${E0(f.d)}, ${E0(f.h)}, ${a}))\n`;
    else if(f.op==="caixa")s+=`solidos.append(caixa(${E0(f.w)}, ${E0(f.p)}, ${E0(f.h)}, ${E0(f.x)}, ${E0(f.y)}, ${E0(f.z)}))\n`;else if(f.op==="furo")s+=`cortes.append(furo(${E0(f.d)}, ${E0(f.h)}, ${a}))\n`;
    else if(f.op==="rasgo")s+=`cortes.append(caixa(${E0(f.w)}, ${E0(f.p)}, (${E0(f.h)}) + 0.02, ${E0(f.x)}, ${E0(f.y)}, (${E0(f.z)}) - 0.01))\n`;
    else if(f.op==="furos_circulares")s+=`import math\nfor i in range(int(${E0(f.n)})):\n    a = math.radians(${E0(f.angulo0)} + i * 360 / (${E0(f.n)}))\n    cortes.append(furo(${E0(f.d)}, ${E0(f.h)}, (${E0(f.pcd)}) / 2 * math.cos(a), (${E0(f.pcd)}) / 2 * math.sin(a), ${E0(f.z)}))\n`});
  s+=`\npeca = solidos[0]\nfor sld in solidos[1:]:\n    peca = peca.union(sld)\nfor c in cortes:\n    peca = peca.cut(c)\n\ncq.exporters.export(peca, "peca.step")\ncq.exporters.export(peca, "peca.stl")\n`;return s}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
const loaded={};
function loadScript(u){return loaded[u]||(loaded[u]=new Promise((res,rej)=>{const s=document.createElement("script");s.src=u;s.onload=res;s.onerror=()=>{delete loaded[u];rej(new Error("não consegui carregar o leitor deste formato"))};document.head.append(s)}))}
const LIBS={pdf:["vendor/pdf.worker.min.js","vendor/pdf.min.js"],docx:["vendor/mammoth.browser.min.js"],xlsx:["vendor/xlsx.full.min.js"],zip:["vendor/jszip.min.js"]}; /* bibliotecas hospedadas no próprio site: nenhum script de terceiros */
async function need(k){for(const u of LIBS[k])await loadScript(u)}
const LIB={};RAW.forEach(r=>LIB[r[0]]={k:r[0],n:r[1],cat:r[2],beta:r[3],eta:r[4],kLoad:r[5],cls:r[6],modos:r[7],pf:r[8],tec:r[9]});
