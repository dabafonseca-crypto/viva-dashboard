VIVA FIDELIDADE — DASHBOARD

1. O que já está pronto
-----------------------
- Dashboard responsivo para desktop e celular.
- Filtro por classe: Todas / Executivo / Leito.
- Filtro por data de viagem.
- Melhor preço atual.
- Menor preço histórico.
- Menor valor adicional em R$.
- Variação desde a coleta anterior.
- Cards dos próximos sábados.
- Destaque visual para preços abaixo de 3.000 pontos.
- Gráfico de histórico em pontos.
- Gráfico de histórico em R$.
- Gráfico por faixa de antecedência.
- Insights automáticos.
- Histórico completo pesquisável.
- Saúde da automação.
- Atualização manual e automática.
- Modo demonstração enquanto o Supabase não estiver configurado.

2. Configuração do Supabase
---------------------------
Abra o arquivo:

  config.js

Substitua:

  COLE_AQUI_A_PROJECT_URL

pela Project URL do seu projeto Supabase.

Substitua:

  COLE_AQUI_A_PUBLISHABLE_KEY

pela Publishable Key / anon key apropriada para uso no navegador.

IMPORTANTE:
- NÃO usar Secret Key.
- NÃO usar service_role.
- NÃO colocar CPF, senha da Viva, token da Viva ou credenciais do n8n.

3. Como testar localmente no Zorin
----------------------------------
No terminal, entre na pasta do dashboard e execute:

  python3 -m http.server 8080

Depois abra:

  http://localhost:8080

Evite abrir o index.html diretamente via file:// para que o comportamento seja o mesmo de uma hospedagem web.

4. Views Supabase utilizadas
----------------------------
- viva_public_resumo
- viva_public_historico
- viva_public_variacao
- viva_public_antecedencia
- viva_public_saude

5. Modo demonstração
--------------------
Enquanto config.js não estiver preenchido, o painel utiliza os dados da primeira coleta válida já conhecida.
Isso serve apenas para visualizar o layout.
Quando as credenciais públicas forem preenchidas, o painel passa automaticamente para dados reais do Supabase.

6. Próxima etapa
----------------
Após validar localmente:
- publicar no GitHub Pages / Vercel;
- manter o repositório sem credenciais secretas;
- validar a primeira coleta automática das 11h/19h;
- criar alertas de novo mínimo histórico e queda relevante, além do alerta < 3.000 pontos.
