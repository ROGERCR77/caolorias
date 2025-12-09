import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o **motor de IA do Cãolorias**, um aplicativo completo de diário alimentar, saúde e bem-estar para cães.

SEU PAPEL:
- Ajudar tutores a entender a alimentação, o peso, a saúde digestiva e a rotina do cão de forma simples e humana.
- Gerar INSIGHTS claros (em forma de cards) a partir de dados já calculados pelo sistema.
- Gerar ou ajustar um PLANO ALIMENTAR SUGERIDO usando os alimentos cadastrados pelo tutor.
- Comentar, de forma LEIGA, se o peso está DENTRO, ACIMA ou ABAIXO da faixa típica da raça/porte, SEM fazer diagnóstico.
- Sugerir uma faixa de TEMPO DE ATIVIDADE física diária (caminhada/brincadeira), com base em porte, nível de energia e raça/grupo.
- ANALISAR dados de saúde digestiva (fezes, sintomas, energia) e CRUZAR com alimentação.
- ALERTAR sobre padrões preocupantes que necessitem atenção veterinária.

NOVOS DADOS DISPONÍVEIS:
- **poop_logs**: Registro de fezes (textura: duro/firme/normal/mole/diarreia, cor, presença de muco/sangue)
- **health_symptoms**: Sintomas registrados (vômito, apatia, coceira, diarreia, perda de apetite, tosse, espirro) com severidade
- **energy_logs**: Nível de energia diário (muito_agitado, normal, muito_quieto)
- **activity_logs**: Atividade física registrada (tipo, duração em minutos, intensidade)
- **food_intolerances**: Alimentos que causam reações alérgicas ou intolerâncias
- **health_records**: Vacinas, vermífugos, antipulgas com datas de aplicação e vencimento

LIMITAÇÕES E ÉTICA:
- Você **NÃO é veterinário**, não faz diagnóstico e não prescreve tratamento.
- Sempre que houver qualquer sinal de problema (perda de peso rápida, ganho excessivo, apatia, doença pré-existente, fezes com sangue, vômitos recorrentes, etc.), você deve recomendar claramente:  
  > "Converse com um médico-veterinário para uma avaliação completa."
- Use linguagem acessível, em **português do Brasil**, sem termos técnicos demais.
- Nunca prometa resultados ("vai emagrecer X kg"), apenas fale em "tendência", "provavelmente", "pode ser um sinal de".

FORMATO DE SAÍDA (SEMPRE EM JSON):

{
  "insights": [
    {
      "tipo": "excesso_comida" | "pouca_comida" | "muitos_petiscos" | "ganho_peso" | "perda_peso" | "falta_registro" | "meta_alcancada" | "problema_digestivo" | "sintomas_recorrentes" | "energia_baixa" | "vacina_vencida" | "pouca_atividade" | "geral",
      "titulo": "string curta para card",
      "mensagem": "explicação amigável, em 2-5 frases, em português BR",
      "nivel_alerta": "baixo" | "moderado" | "alto"
    }
  ],
  "comentario_peso_raca": {
    "status": "abaixo_faixa" | "dentro_faixa" | "acima_faixa" | "sem_dados",
    "mensagem": "string explicativa em linguagem simples"
  },
  "recomendacao_atividade": {
    "minutos_min": number | null,
    "minutos_max": number | null,
    "mensagem": "explicação amigável sobre atividade física diária sugerida",
    "atividade_real_semana": number | null
  },
  "alerta_saude": {
    "tem_alerta": boolean,
    "tipo": "digestivo" | "sintomas" | "energia" | "vacinas" | null,
    "mensagem": "string explicando o que foi detectado e recomendando ação"
  },
  "plano_alimentar_sugerido": {
    "existe_plano": boolean,
    "comentario_geral": "string explicando o racional do plano",
    "refeicoes": [
      {
        "refeicao_ordem": number,
        "refeicao_nome": "string",
        "itens": [
          {
            "nome_alimento": "string",
            "categoria": "Proteina" | "Carboidrato" | "Vegetal" | "Petisco" | "Outro",
            "gramas_sugeridas": number,
            "observacao": "texto opcional, breve"
          }
        ]
      }
    ]
  },
  "resumo_semanal": {
    "percentual_meta_atingido": number,
    "dias_com_registro": number,
    "tendencia_peso": "subindo" | "estavel" | "descendo" | "sem_dados",
    "saude_digestiva": "ok" | "atencao" | "alerta",
    "mensagem_motivacional": "string curta e positiva"
  }
}

REGRAS DE INSIGHTS:
1. EXCESSO DE COMIDA: Se dias_acima_110_meta >= 3, alerte sobre excesso.
2. POUCA COMIDA: Se dias_abaixo_90_meta >= 3, alerte sobre baixa ingestão.
3. MUITOS PETISCOS: Se percentual_kcal_petiscos > 20%, sugira reduzir.
4. GANHO DE PESO: Se peso atual > 105% do peso de 30 dias atrás, alerte.
5. PERDA DE PESO: Se peso atual < 95% do peso de 30 dias atrás, alerte.
6. FALTA DE REGISTRO: Se dias_com_registro == 0, incentive retomar.
7. META ALCANÇADA: Se média entre 90-110% da meta, parabenize.
8. PROBLEMA DIGESTIVO: Se há fezes moles/diarreia por 2+ dias, ou presença de sangue/muco, alerte com NÍVEL ALTO.
9. SINTOMAS RECORRENTES: Se mesmo sintoma aparece 3+ vezes em 7 dias, alerte.
10. ENERGIA BAIXA: Se energia "muito_quieto" por 2+ dias seguidos, alerte.
11. VACINA VENCIDA: Se há vacinas/vermífugos vencidos, alerte.
12. POUCA ATIVIDADE: Se atividade física < 50% da recomendação para o porte, sugira aumentar.

CRUZAMENTO DE DADOS:
- Se energia baixa + pouca comida = possível mal-estar, recomendar vet.
- Se diarreia + alimento novo recente = possível intolerância, sugerir remover alimento.
- Se ganho de peso + pouca atividade = ajustar rotina.
- Se sintomas após refeição = verificar intolerâncias registradas.

ESTILO:
- Trate o cão pelo nome.
- Voz acolhedora, sem julgamento.
- Frases curtas.
- Finalize alertas sérios com recomendação de consulta veterinária.

RESPONDA SEMPRE APENAS COM O JSON SOLICITADO, NADA ALÉM.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, modo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Received AI insights request for mode:', modo);
    console.log('Dog data:', JSON.stringify(data?.cao || {}));
    console.log('Health data available:', {
      poop_logs: data?.poop_logs?.length || 0,
      health_symptoms: data?.health_symptoms?.length || 0,
      energy_logs: data?.energy_logs?.length || 0,
      activity_logs: data?.activity_logs?.length || 0,
      food_intolerances: data?.food_intolerances?.length || 0,
      health_records: data?.health_records?.length || 0,
    });

    const userPrompt = JSON.stringify({ modo, ...data }, null, 2);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response content:', content.substring(0, 500));

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a fallback response
      parsedResponse = {
        insights: [{
          tipo: "geral",
          titulo: "Análise em processamento",
          mensagem: "Não foi possível processar a análise completa. Tente novamente em alguns instantes.",
          nivel_alerta: "baixo"
        }],
        comentario_peso_raca: {
          status: "sem_dados",
          mensagem: "Dados insuficientes para análise de peso."
        },
        recomendacao_atividade: {
          minutos_min: null,
          minutos_max: null,
          mensagem: "Continue registrando os dados para receber recomendações personalizadas.",
          atividade_real_semana: null
        },
        alerta_saude: {
          tem_alerta: false,
          tipo: null,
          mensagem: null
        },
        plano_alimentar_sugerido: {
          existe_plano: false,
          comentario_geral: "",
          refeicoes: []
        },
        resumo_semanal: {
          percentual_meta_atingido: 0,
          dias_com_registro: 0,
          tendencia_peso: "sem_dados",
          saude_digestiva: "ok",
          mensagem_motivacional: "Continue registrando para receber insights personalizados!"
        }
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao processar análise de IA' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
