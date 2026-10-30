(() => {
  'use strict';

  const cfg = window.VIVA_CONFIG || {};
  const state = {
    resumo: [],
    historico: [],
    variacao: [],
    antecedencia: [],
    saude: [],
    classFilter: 'TODAS',
    dateFilter: 'TODAS',
    pointsChart: null,
    cashChart: null,
    leadChart: null,
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const configured = () =>
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_PUBLISHABLE_KEY &&
    !cfg.SUPABASE_URL.includes('COLE_AQUI') &&
    !cfg.SUPABASE_PUBLISHABLE_KEY.includes('COLE_AQUI');

  const fmtDate = (v) => {
    if (!v) return '—';
    const [y,m,d] = String(v).slice(0,10).split('-');
    return `${d}/${m}/${y}`;
  };

  const fmtDateTime = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return new Intl.DateTimeFormat('pt-BR',{
      dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'
    }).format(d);
  };

  const fmtPts = (v) =>
    v == null ? '—' : `${Number(v).toLocaleString('pt-BR')} pts`;

  const fmtMoney = (v) =>
    v == null ? '—' : `R$ ${Number(v).toLocaleString('pt-BR',{
      minimumFractionDigits:2,maximumFractionDigits:2
    })}`;

  const fmtTime = (v) => v ? String(v).slice(0,5) : '—';

  function toast(msg){
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(()=>t.classList.remove('show'),2600);
  }

  async function api(view, query=''){
    const base = cfg.SUPABASE_URL.replace(/\/$/,'');
    const url = `${base}/rest/v1/${view}${query ? '?' + query : ''}`;
    const r = await fetch(url,{
      headers:{
        apikey: cfg.SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`,
        Accept:'application/json'
      }
    });
    if(!r.ok){
      const body = await r.text();
      throw new Error(`${view}: HTTP ${r.status} — ${body.slice(0,250)}`);
    }
    return r.json();
  }

  function demoData(){
    const hist = [
      ['2026-10-03T16:17:28.454Z','MANUAL','2026-10-10',7,'DISPONIVEL','00:48:00','05:38:00','EXECUTIVO',2263,31.57],
      ['2026-10-03T16:17:28.454Z','MANUAL','2026-10-10',7,'DISPONIVEL','00:48:00','05:38:00','LEITO',5599,104.96],
      ['2026-10-03T16:17:31.841Z','MANUAL','2026-10-17',14,'DISPONIVEL','00:48:00','05:38:00','EXECUTIVO',4106,72.12],
      ['2026-10-03T16:17:31.841Z','MANUAL','2026-10-17',14,'DISPONIVEL','00:48:00','05:38:00','LEITO',6264,119.59],
      ['2026-10-03T16:17:33.652Z','MANUAL','2026-10-24',21,'DISPONIVEL','00:48:00','05:38:00','EXECUTIVO',4106,72.12],
      ['2026-10-03T16:17:33.652Z','MANUAL','2026-10-24',21,'DISPONIVEL','00:48:00','05:38:00','LEITO',6264,119.59],
      ['2026-10-03T16:17:35.430Z','MANUAL','2026-10-31',28,'DISPONIVEL','00:48:00','05:38:00','EXECUTIVO',4106,72.12],
      ['2026-10-03T16:17:35.430Z','MANUAL','2026-10-31',28,'DISPONIVEL','00:48:00','05:38:00','LEITO',6264,119.59],
      ['2026-10-03T16:17:36.704Z','MANUAL','2026-11-07',35,'SEM_VIAGENS',null,null,null,null,null],
    ].map((r,i)=>({
      coletado_em:r[0],coleta_slot:r[1],data_viagem:r[2],dias_antecedencia:r[3],status:r[4],
      horario_saida:r[5],horario_chegada:r[6],classe:r[7],pontos:r[8],valor_reais:r[9],id:i+1
    }));

    const resumo = hist.filter(x=>x.status==='DISPONIVEL').map(x=>({
      data_viagem:x.data_viagem,classe:x.classe,dias_antecedencia:x.dias_antecedencia,
      pontos_atual:x.pontos,reais_atual:x.valor_reais,observacoes:1,
      pontos_minimo:x.pontos,pontos_maximo:x.pontos,pontos_media:x.pontos,pontos_mediana:x.pontos,
      reais_minimo:x.valor_reais,reais_maximo:x.valor_reais,reais_media:x.valor_reais,reais_mediana:x.valor_reais,
      nivel_pontos:'AMOSTRA_INSUFICIENTE',nivel_reais:'AMOSTRA_INSUFICIENTE',
      atualizado_em:x.coletado_em,horario_saida:x.horario_saida,horario_chegada:x.horario_chegada
    }));

    return {
      resumo,
      historico:hist,
      variacao:[],
      antecedencia:[
        {classe:'EXECUTIVO',faixa_antecedencia:'4-7 dias',ordem_faixa:2,observacoes:1,pontos_media:2263,reais_media:31.57},
        {classe:'EXECUTIVO',faixa_antecedencia:'8-14 dias',ordem_faixa:3,observacoes:1,pontos_media:4106,reais_media:72.12},
        {classe:'EXECUTIVO',faixa_antecedencia:'15-21 dias',ordem_faixa:4,observacoes:1,pontos_media:4106,reais_media:72.12},
        {classe:'EXECUTIVO',faixa_antecedencia:'22-30 dias',ordem_faixa:5,observacoes:1,pontos_media:4106,reais_media:72.12},
        {classe:'LEITO',faixa_antecedencia:'4-7 dias',ordem_faixa:2,observacoes:1,pontos_media:5599,reais_media:104.96},
        {classe:'LEITO',faixa_antecedencia:'8-14 dias',ordem_faixa:3,observacoes:1,pontos_media:6264,reais_media:119.59},
        {classe:'LEITO',faixa_antecedencia:'15-21 dias',ordem_faixa:4,observacoes:1,pontos_media:6264,reais_media:119.59},
        {classe:'LEITO',faixa_antecedencia:'22-30 dias',ordem_faixa:5,observacoes:1,pontos_media:6264,reais_media:119.59},
      ],
      saude:[{
        ultima_coleta_br:'2026-10-03T13:17:36.704',
        ultima_coleta_slot:'MANUAL',
        registros_total:9,
        execucoes_total:1,
        datas_com_viagem:4,
        ultima_data_disponivel:'2026-10-31',
        primeira_data_sem_viagens:'2026-11-07'
      }]
    };
  }

  async function loadData(){
    const btn = $('#refreshBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    try{
      if(!configured()){
        Object.assign(state,demoData());
        toast('Modo demonstração — configure o Supabase em config.js');
      }else{
        const [resumo,historico,variacao,antecedencia,saude] = await Promise.all([
          api('viva_public_resumo','select=*&order=data_viagem.asc,classe.asc'),
          api('viva_public_historico','select=*&order=coletado_em.asc'),
          api('viva_public_variacao','select=*&order=data_viagem.asc,classe.asc'),
          api('viva_public_antecedencia','select=*&order=ordem_faixa.asc'),
          api('viva_public_saude','select=*')
        ]);
        state.resumo = resumo;
        state.historico = historico;
        state.variacao = variacao;
        state.antecedencia = antecedencia;
        state.saude = saude;
        toast('Dados atualizados');
      }

      populateDates();
      render();
    }catch(err){
      console.error(err);
      toast('Erro ao carregar dados');
      $('#healthBadge').className='status-pill status-warn';
      $('#healthBadge').innerHTML='<span class="status-dot"></span><span>Erro de conexão</span>';
    }finally{
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  function populateDates(){
    const select = $('#dateFilter');
    const current = select.value || 'TODAS';
    const dates = [...new Set(state.resumo.map(x=>x.data_viagem))].sort();
    select.innerHTML = `<option value="TODAS">Todas as datas</option>` +
      dates.map(d=>`<option value="${d}">${fmtDate(d)}</option>`).join('');
    if(dates.includes(current) || current==='TODAS') select.value=current;
  }

  function filteredResumo(){
    return state.resumo.filter(x =>
      (state.classFilter==='TODAS' || x.classe===state.classFilter) &&
      (state.dateFilter==='TODAS' || x.data_viagem===state.dateFilter)
    );
  }

  function filteredHistory(){
    return state.historico.filter(x =>
      (state.classFilter==='TODAS' || x.classe===state.classFilter || x.status!=='DISPONIVEL') &&
      (state.dateFilter==='TODAS' || x.data_viagem===state.dateFilter)
    );
  }

  function bestCurrent(){
    const rows = filteredResumo();
    return [...rows].sort((a,b)=>(a.pontos_atual??Infinity)-(b.pontos_atual??Infinity))[0] || null;
  }

  function renderHero(){
    const b = bestCurrent();

    if(!b){
      $('#heroPoints').textContent='—';
      $('#heroCash').textContent='Sem dados';
      return;
    }

    $('#heroPoints').textContent=fmtPts(b.pontos_atual);
    $('#heroCash').textContent=`+ ${fmtMoney(b.reais_atual)}`;
    $('#heroDate').textContent=fmtDate(b.data_viagem);
    $('#heroClass').textContent=b.classe || '—';
    $('#heroLead').textContent=`${b.dias_antecedencia} dias`;
    $('#heroTime').textContent=`${fmtTime(b.horario_saida)} → ${fmtTime(b.horario_chegada)}`;

    const badge=$('#heroLevel');
    const lvl=b.nivel_pontos || 'AMOSTRA_INSUFICIENTE';
    badge.className='level-badge ';
    if(lvl==='BAIXO'){badge.classList.add('level-low');badge.textContent='Preço baixo'}
    else if(lvl==='ALTO'){badge.classList.add('level-high');badge.textContent='Preço alto'}
    else if(lvl==='TIPICO'){badge.classList.add('level-typical');badge.textContent='Preço típico'}
    else{badge.classList.add('level-neutral');badge.textContent='Construindo histórico'}

    $('#dealNotice').classList.toggle('hidden',!(Number(b.pontos_atual)<3000));

    const rows=filteredResumo();
    const minPts=rows.length?Math.min(...rows.map(x=>Number(x.pontos_minimo)).filter(Number.isFinite)):null;
    const minCash=rows.length?Math.min(...rows.map(x=>Number(x.reais_minimo)).filter(Number.isFinite)):null;
    $('#minPoints').textContent=minPts==null?'—':Number(minPts).toLocaleString('pt-BR');
    $('#minCash').textContent=minCash==null?'—':fmtMoney(minCash);

    const vari=state.variacao.find(v=>v.data_viagem===b.data_viagem && v.classe===b.classe);
    if(vari && vari.variacao_pontos!=null){
      const vp=Number(vari.variacao_pontos);
      $('#variationPoints').textContent=`${vp>0?'+':''}${vp.toLocaleString('pt-BR')} pts`;
      const vr=Number(vari.variacao_reais);
      $('#variationCash').textContent=Number.isFinite(vr)?`${vr>0?'+':''}${fmtMoney(vr)}`:'sem comparação';
    }else{
      $('#variationPoints').textContent='—';
      $('#variationCash').textContent='sem coleta anterior';
    }
  }

  function renderDates(){
    const rows=filteredResumo();
    const byDate=new Map();

    rows.forEach(r=>{
      const prev=byDate.get(r.data_viagem);
      if(!prev || Number(r.pontos_atual)<Number(prev.pontos_atual)) byDate.set(r.data_viagem,r);
    });

    $('#dateCards').innerHTML=[...byDate.values()]
      .sort((a,b)=>a.data_viagem.localeCompare(b.data_viagem))
      .map(r=>`
        <article class="date-card ${Number(r.pontos_atual)<3000?'hot':''}">
          <div class="date-top">
            <div>
              <div class="date">${fmtDate(r.data_viagem)}</div>
              <div class="lead">${r.dias_antecedencia} dias de antecedência</div>
            </div>
            <span class="class-chip">${r.classe}</span>
          </div>
          <div>
            <div class="price">${fmtPts(r.pontos_atual)}</div>
            <div class="cash">+ ${fmtMoney(r.reais_atual)}</div>
          </div>
        </article>`).join('') || `<div class="muted">Nenhum preço disponível para os filtros atuais.</div>`;
  }

  function chartDefaults(){
    Chart.defaults.font.family='Inter, system-ui, sans-serif';
    Chart.defaults.color='#6b7280';
  }

  function destroyCharts(){
    for(const k of ['pointsChart','cashChart','leadChart']){
      if(state[k]){state[k].destroy();state[k]=null}
    }
  }

  function makeHistoryDatasets(field){
    const rows=filteredHistory().filter(x=>x.status==='DISPONIVEL' && x[field]!=null);
    const groups={};

    rows.forEach(r=>{
      const key=`${r.data_viagem} • ${r.classe}`;
      (groups[key] ||= []).push({
        x:new Date(r.coletado_em),
        y:Number(r[field]),
        meta:r
      });
    });

    return Object.entries(groups).map(([label,data])=>({
      label,
      data:data.sort((a,b)=>a.x-b.x),
      tension:.28,
      pointRadius:4,
      pointHoverRadius:6,
      borderWidth:2,
      fill:false
    }));
  }

  function renderCharts(){
    if(typeof Chart==='undefined') return;
    chartDefaults();
    destroyCharts();

    const common={
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:'nearest',intersect:false},
      plugins:{
        legend:{position:'bottom',labels:{boxWidth:10,usePointStyle:true}},
        tooltip:{
          callbacks:{
            title:(items)=>items[0]?.raw?.meta ? `${fmtDate(items[0].raw.meta.data_viagem)} • ${items[0].raw.meta.classe}` : '',
            afterLabel:(ctx)=>{
              const m=ctx.raw?.meta;
              return m?`Coleta: ${fmtDateTime(m.coletado_em)}\nAntecedência: ${m.dias_antecedencia} dias`:'';
            }
          }
        }
      },
      scales:{
        x:{
          type:'time',
          time:{unit:'day',tooltipFormat:'dd/MM/yyyy HH:mm'},
          grid:{display:false},
          ticks:{maxTicksLimit:6}
        },
        y:{grid:{color:'#eef1f5'}}
      }
    };

    // Chart.js time scale requires an adapter; use category fallback if no adapter.
    const buildCategory=(field)=>{
      // Somente nestes dois gráficos: esconder viagens cuja data já passou.
      // A comparação usa a data de São Paulo, que é o timezone oficial do projeto.
      const partesHoje = new Intl.DateTimeFormat('pt-BR',{
        timeZone:'America/Sao_Paulo',
        year:'numeric',
        month:'2-digit',
        day:'2-digit'
      }).formatToParts(new Date());

      const parte=(tipo)=>partesHoje.find(p=>p.type===tipo)?.value;
      const hojeISO=`${parte('year')}-${parte('month')}-${parte('day')}`;

      const rows=filteredHistory().filter(x=>
        x.status==='DISPONIVEL' &&
        x[field]!=null &&
        x.data_viagem>=hojeISO
      );
      const labels=[...new Set(rows.map(r=>fmtDateTime(r.coletado_em)))];
      const groups={};
      rows.forEach(r=>{
        const key=`${fmtDate(r.data_viagem)} • ${r.classe}`;
        groups[key] ||= {};
        groups[key][fmtDateTime(r.coletado_em)] = Number(r[field]);
      });
      return {
        labels,
        datasets:Object.entries(groups).map(([label,map])=>({
          label,
          data:labels.map(l=>map[l] ?? null),
          tension:.28,pointRadius:4,pointHoverRadius:6,borderWidth:2,spanGaps:true
        }))
      };
    };

    state.pointsChart=new Chart($('#pointsChart'),{
      type:'line',
      data:buildCategory('pontos'),
      options:{
        responsive:true,maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{
          legend:{position:'bottom',labels:{boxWidth:10,usePointStyle:true}},
          tooltip:{callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${fmtPts(ctx.parsed.y)}`}}
        },
        scales:{x:{grid:{display:false},ticks:{maxTicksLimit:6}},y:{grid:{color:'#eef1f5'}}}
      }
    });

    state.cashChart=new Chart($('#cashChart'),{
      type:'line',
      data:buildCategory('valor_reais'),
      options:{
        responsive:true,maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{
          legend:{position:'bottom',labels:{boxWidth:10,usePointStyle:true}},
          tooltip:{callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${fmtMoney(ctx.parsed.y)}`}}
        },
        scales:{x:{grid:{display:false},ticks:{maxTicksLimit:6}},y:{grid:{color:'#eef1f5'}}}
      }
    });

    const leadRows=state.antecedencia.filter(x=>state.classFilter==='TODAS' || x.classe===state.classFilter);
    const labels=[...new Set(leadRows.sort((a,b)=>a.ordem_faixa-b.ordem_faixa).map(x=>x.faixa_antecedencia))];
    const classes=[...new Set(leadRows.map(x=>x.classe))];

    state.leadChart=new Chart($('#leadChart'),{
      type:'bar',
      data:{
        labels,
        datasets:classes.map(c=>({
          label:c,
          data:labels.map(l=>{
            const r=leadRows.find(x=>x.classe===c && x.faixa_antecedencia===l);
            return r?Number(r.pontos_media):null;
          }),
          borderWidth:0,
          borderRadius:8
        }))
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'bottom',labels:{boxWidth:10,usePointStyle:true}}},
        scales:{x:{grid:{display:false}},y:{grid:{color:'#eef1f5'}}}
      }
    });
  }

  function renderInsights(){
    const rows=filteredResumo();
    const b=bestCurrent();
    const obs=rows.reduce((s,x)=>s+Number(x.observacoes||0),0);
    const below=rows.filter(x=>Number(x.pontos_atual)<3000);
    const nextStop=state.saude[0]?.primeira_data_sem_viagens;

    const items=[
      {
        icon:'📊',
        title: obs<6 ? 'Histórico em formação' : 'Base histórica disponível',
        text: obs<6
          ? 'Ainda há poucas observações para classificar preços como baixo, típico ou alto com segurança.'
          : `Há ${obs} observações disponíveis para esta seleção.`
      },
      {
        icon:below.length?'🔥':'🔎',
        title:below.length?'Existe oportunidade abaixo de 3.000':'Nenhum alerta ativo nesta seleção',
        text:below.length
          ? `${below.length} preço(s) atual(is) estão abaixo do limite configurado de 3.000 pontos.`
          : 'O monitor continuará verificando automaticamente às 11h e 19h.'
      },
      {
        icon:'🗓️',
        title:'Janela de disponibilidade',
        text:nextStop
          ? `A primeira data atualmente sem viagens é ${fmtDate(nextStop)}.`
          : 'Ainda não foi identificada uma data futura sem viagens.'
      },
      {
        icon:'🧠',
        title:'Pergunta principal',
        text:'Com o crescimento do histórico, o painel mostrará em qual faixa de antecedência os menores valores costumam aparecer.'
      }
    ];

    if(b){
      items.unshift({
        icon:'💡',
        title:`Melhor preço visível: ${fmtPts(b.pontos_atual)}`,
        text:`${fmtDate(b.data_viagem)} • ${b.classe} • + ${fmtMoney(b.reais_atual)} • ${b.dias_antecedencia} dias antes.`
      });
    }

    $('#insights').innerHTML=items.slice(0,5).map(i=>`
      <div class="insight">
        <div class="insight-icon">${i.icon}</div>
        <div>
          <div class="insight-title">${i.title}</div>
          <div class="insight-text">${i.text}</div>
        </div>
      </div>`).join('');
  }

  function renderTable(){
    const term=($('#tableSearch').value||'').trim().toLowerCase();
    let rows=filteredHistory();

    if(term){
      rows=rows.filter(r=>[
        r.coleta_slot,r.data_viagem,r.classe,r.pontos,r.valor_reais,r.status,r.dias_antecedencia
      ].some(v=>String(v??'').toLowerCase().includes(term)));
    }

    rows=[...rows].sort((a,b)=>String(b.coletado_em).localeCompare(String(a.coletado_em)));

    $('#rowCount').textContent=`${rows.length} registro${rows.length===1?'':'s'}`;
    $('#historyTable').innerHTML=rows.map(r=>`
      <tr>
        <td>${fmtDateTime(r.coletado_em)}<br><small>${r.coleta_slot||'—'}</small></td>
        <td><strong>${fmtDate(r.data_viagem)}</strong></td>
        <td>${r.classe||'—'}</td>
        <td>${fmtTime(r.horario_saida)}</td>
        <td class="${Number(r.pontos)<3000?'price-low':''}">${r.pontos==null?'—':fmtPts(r.pontos)}</td>
        <td>${r.valor_reais==null?'—':fmtMoney(r.valor_reais)}</td>
        <td>${r.dias_antecedencia==null?'—':`${r.dias_antecedencia} dias`}</td>
        <td><span class="status-text ${r.status==='DISPONIVEL'?'status-available':''}">${r.status}</span></td>
      </tr>`).join('');
  }

  function renderHealth(){
    const h=state.saude[0] || {};
    $('#healthLast').textContent=fmtDateTime(h.ultima_coleta_utc || h.ultima_coleta_br);
    $('#healthRows').textContent=h.registros_total ?? state.historico.length;
    $('#healthDates').textContent=h.datas_com_viagem ?? '—';
    $('#healthStop').textContent=fmtDate(h.primeira_data_sem_viagens);
    $('#lastCollection').textContent=fmtDateTime(h.ultima_coleta_utc || h.ultima_coleta_br);
    $('#lastSlot').textContent=h.ultima_coleta_slot ? `coleta ${h.ultima_coleta_slot}` : '—';

    const badge=$('#healthBadge');
    badge.className='status-pill status-ok';
    badge.innerHTML='<span class="status-dot"></span><span>Monitor operacional</span>';

    $('#footerUpdated').textContent=`Painel atualizado: ${new Intl.DateTimeFormat('pt-BR',{
      dateStyle:'short',timeStyle:'short'
    }).format(new Date())}`;
  }

  function render(){
    renderHero();
    renderDates();
    renderCharts();
    renderInsights();
    renderTable();
    renderHealth();
  }

  function bind(){
    $('#refreshBtn').addEventListener('click',loadData);

    $$('#classFilter .seg-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        $$('#classFilter .seg-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        state.classFilter=btn.dataset.class;
        render();
      });
    });

    $('#dateFilter').addEventListener('change',(e)=>{
      state.dateFilter=e.target.value;
      render();
    });

    $('#tableSearch').addEventListener('input',renderTable);
  }

  bind();
  loadData();

  const mins=Number(cfg.AUTO_REFRESH_MINUTES||5);
  if(Number.isFinite(mins) && mins>0){
    setInterval(loadData,mins*60*1000);
  }
})();
