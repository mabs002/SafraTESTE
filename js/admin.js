(function(){
  const session = (()=>{try{return JSON.parse(localStorage.getItem('safralink_admin_session')||'null')}catch(_){return null}})();
  if (!session || session.admin !== true) { location.replace('admin-login.html'); return; }

  const DEMO_PRODUCTS = [
    {id:1,name:'Tomate',type:'Hortaliça',qty:'120 kg',price:'R$ 6,50/kg',location:'Itapetininga - SP',emoji:'🍅',seller:'Sítio Boa Terra',sellerEmail:'demo1@safralink.com'},
    {id:2,name:'Milho verde',type:'Cereal',qty:'300 kg',price:'R$ 4,20/kg',location:'Tatuí - SP',emoji:'🌽',seller:'Produtor João',sellerEmail:'demo2@safralink.com'},
    {id:3,name:'Alface',type:'Hortaliça',qty:'80 un.',price:'R$ 2,50/un.',location:'Itapetininga - SP',emoji:'🥬',seller:'Horta da Ana',sellerEmail:'demo3@safralink.com'},
    {id:4,name:'Abóbora',type:'Legume',qty:'180 kg',price:'R$ 3,80/kg',location:'Capão Bonito - SP',emoji:'🎃',seller:'Sítio Verde',sellerEmail:'demo4@safralink.com'},
    {id:5,name:'Mandioca',type:'Raiz',qty:'250 kg',price:'R$ 3,20/kg',location:'Itapetininga - SP',emoji:'🥔',seller:'Família Souza',sellerEmail:'demo5@safralink.com'},
    {id:6,name:'Morango',type:'Fruta',qty:'60 kg',price:'R$ 14,00/kg',location:'São Miguel Arcanjo - SP',emoji:'🍓',seller:'Chácara do Vale',sellerEmail:'demo6@safralink.com'}
  ];

  const defs = [
    {key:'users',label:'Usuários',storage:'safralink_users'},
    {key:'products',label:'Produtos',storage:'safralink_products',seed:DEMO_PRODUCTS},
    {key:'harvests',label:'Colheitas',storage:'safralink_harvests'},
    {key:'orders',label:'Pedidos',storage:'safralink_orders'},
    {key:'transports',label:'Transportes',storage:'safralink_transports'},
    {key:'leftovers',label:'Sobras',storage:'safralink_leftovers'}
  ];

  const esc = v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const FIELD_LABELS = {
    id:'Identificação', name:'Nome', email:'E-mail', password:'Senha', seller:'Vendedor', buyer:'Comprador',
    sellerEmail:'E-mail do vendedor', buyerEmail:'E-mail do comprador', sellerName:'Nome do vendedor', buyerName:'Nome do comprador',
    type:'Tipo', category:'Categoria', description:'Descrição', photoData:'Foto', image:'Imagem', emoji:'Ícone',
    qty:'Quantidade', quantity:'Quantidade', quantityValue:'Quantidade solicitada', availableQuantity:'Quantidade disponível',
    unit:'Unidade', quantityUnit:'Unidade da quantidade', price:'Preço', location:'Localização', address:'Endereço',
    city:'Cidade', state:'Estado', cep:'CEP', phone:'Telefone', document:'Documento', documentType:'Tipo de documento',
    birth:'Data de nascimento', openingDate:'Data de abertura', farmName:'Nome da propriedade', productionType:'Tipo de produção',
    activityDescription:'Descrição da atividade', documentPhoto:'Documento', terms:'Termos aceitos',
    product:'Produto', productId:'Identificação do produto', productName:'Nome do produto', minimumOrder:'Pedido mínimo',
    date:'Data', createdAt:'Data de criação', updatedAt:'Data de atualização', status:'Situação', deliveryMethod:'Forma de entrega',
    total:'Total', totalValue:'Valor total', orderId:'Identificação do pedido', transportId:'Identificação do transporte',
    origin:'Origem', destination:'Destino', plate:'Placa', vehicle:'Veículo', driver:'Motorista', harvest:'Colheita',
    harvestId:'Identificação da colheita', leftovers:'Sobras', leftover:'Sobra', notes:'Observações', note:'Observação',
    sellerId:'Identificação do vendedor', buyerId:'Identificação do comprador', userId:'Identificação do usuário',
    role:'Perfil', sellerEmail:'E-mail do vendedor', buyerEmail:'E-mail do comprador'
  };
  const labelKey = key => FIELD_LABELS[key] || String(key).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  function read(def){
    try{ const raw=localStorage.getItem(def.storage); if(raw!==null){const x=JSON.parse(raw); return Array.isArray(x)?x:[];} }catch(_){}
    return def.seed ? def.seed.slice() : [];
  }
  function write(def,list){ localStorage.setItem(def.storage,JSON.stringify(list)); }
  function labelValue(v){
    if (v && typeof v==='object') return JSON.stringify(v);
    return String(v??'');
  }
  function short(v){ const s=labelValue(v); return s.length>90?s.slice(0,87)+'…':s; }
  function fieldsFor(obj){
    const entries=Object.entries(obj||{});
    return entries.filter(([k])=>k!=='__proto__');
  }
  function renderStats(){
    const el=document.getElementById('admin-stats');
    el.innerHTML=defs.map(d=>`<div class="admin-stat"><span>${d.label}</span><strong>${read(d).length}</strong></div>`).join('');
  }
  function renderTabs(){
    document.getElementById('admin-tabs').innerHTML=defs.map((d,i)=>`<button class="admin-tab ${i===0?'active':''}" data-tab="${d.key}">${d.label}</button>`).join('');
    document.querySelectorAll('.admin-tab').forEach(btn=>btn.onclick=()=>activate(btn.dataset.tab));
  }
  function activate(key){
    document.querySelectorAll('.admin-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===key));
    defs.forEach(d=>document.getElementById('panel-'+d.key)?.classList.toggle('active',d.key===key));
  }
  function renderPanels(){
    const host=document.getElementById('admin-panels'); host.innerHTML='';
    defs.forEach(d=>{
      const section=document.createElement('section'); section.className='admin-panel'; section.id='panel-'+d.key;
      section.innerHTML=`<div class="card" style="margin-bottom:14px"><h2>${d.label}</h2><p class="admin-note">Edite ou exclua registros diretamente. Alterações aqui refletem na plataforma.</p></div><div class="admin-table-wrap"><table class="admin-table"><thead></thead><tbody></tbody></table></div>`;
      host.appendChild(section); renderTable(d);
    });
  }
  function renderTable(def){
    const section=document.getElementById('panel-'+def.key); if(!section)return;
    const data=read(def), table=section.querySelector('table'), thead=table.querySelector('thead'), tbody=table.querySelector('tbody');
    const keys=[...new Set(data.flatMap(item=>Object.keys(item||{})))].slice(0,8);
    if(!data.length){thead.innerHTML='';tbody.innerHTML=`<tr><td class="admin-empty">Nenhum registro encontrado.</td></tr>`;return;}
    thead.innerHTML='<tr>'+keys.map(k=>`<th>${esc(labelKey(k))}</th>`).join('')+'<th>Ações</th></tr>';
    tbody.innerHTML=data.map((item,index)=>`<tr>${keys.map(k=>`<td>${esc(short(item[k]))}</td>`).join('')}<td><div class="admin-actions"><button class="btn btn-soft" data-edit="${index}">Editar</button><button class="btn admin-danger" data-delete="${index}">Excluir</button></div></td></tr>`).join('');
    tbody.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEditor(def,Number(b.dataset.edit)));
    tbody.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeItem(def,Number(b.dataset.delete)));
  }
  function removeItem(def,index){
    const list=read(def); if(!list[index])return;
    const title=list[index].name||list[index].email||list[index].product||list[index].id||'este registro';
    if(!confirm(`Excluir ${title}? Esta ação não pode ser desfeita.`))return;
    list.splice(index,1); write(def,list); refresh();
  }
  function openEditor(def,index){
    const list=read(def), original=list[index]; if(!original)return;
    const modal=document.createElement('div');
    modal.innerHTML=`<div class="admin-editor-backdrop"></div><div class="admin-editor"><h2>Editar ${esc(def.key==='users'?'usuário':def.key==='products'?'produto':def.key==='harvests'?'colheita':def.key==='orders'?'pedido':def.key==='transports'?'transporte':'sobra')}</h2><div class="admin-fields"></div><div class="admin-editor-actions"><button class="btn btn-soft" data-cancel>Cancelar</button><button class="btn btn-primary" data-save>Salvar alterações</button></div></div>`;
    document.body.appendChild(modal);
    const fields=modal.querySelector('.admin-fields');
    fieldsFor(original).forEach(([key,value])=>{
      const wrap=document.createElement('div'); wrap.className=String(value).length>120?'full':'';
      const label=document.createElement('label'); label.className='field';
      label.innerHTML=`<span>${esc(labelKey(key))}</span>`;
      const input=(typeof value==='object'||String(value).length>120)?document.createElement('textarea'):document.createElement('input');
      input.value=labelValue(value); input.dataset.key=key; input.style.width='100%'; input.className='input';
      label.appendChild(input); wrap.appendChild(label); fields.appendChild(wrap);
    });
    const close=()=>modal.remove(); modal.querySelector('[data-cancel]').onclick=close; modal.querySelector('.admin-editor-backdrop').onclick=close;
    modal.querySelector('[data-save]').onclick=()=>{
      const updated={...original}; let bad=false;
      modal.querySelectorAll('[data-key]').forEach(input=>{ const key=input.dataset.key; const old=original[key]; let value=input.value; if(old&&typeof old==='object'){try{value=JSON.parse(value)}catch(_){bad=true;}} updated[key]=value; });
      if(bad){alert('Existe um campo em formato JSON inválido. Corrija antes de salvar.');return;}
      list[index]=updated; write(def,list); close(); refresh();
    };
  }
  function refresh(){renderStats();renderPanels();renderTabs();activate(document.querySelector('.admin-tab.active')?.dataset.tab||'users');}
  document.getElementById('admin-logout').onclick=()=>{localStorage.removeItem('safralink_admin_session');location.href='index.html';};
  refresh();
})();
