(() => {
'use strict';
const $ = s => document.querySelector(s);
const KEY = 'lifeos-data-v4';
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-'+Date.now()+'-'+Math.random().toString(16).slice(2));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const definitions = [
 {id:'calendar',title:'Календарь',icon:'◷',description:'Твои дела, задачи и даты',kind:'tasks'},
 {id:'cycles',title:'40-дневные циклы',icon:'◎',description:'Планы на 40 дней и списки задач на каждые 10 дней',kind:'cycles'},
 {id:'strategy',title:'Стратегия жизни',icon:'⌖',description:'Долгосрочные цели на 1, 3 и 5 лет',kind:'strategy'},
 {id:'finance',title:'Финансы',icon:'₽',description:'Копилки, доходы, расходы и обязательства',kind:'folders',folders:[
  ['reserve','Финансовая подушка','Накопления и резерв'],['purchases','Крупные покупки','Цели и накопления на покупки'],['investments','Инвестиции / ИИС','Инвестиции и долгосрочный капитал'],['income-expenses','Доходы и расходы','Личный денежный учёт'],['debts','Долги и обязательства','Долги, выплаты и обязательства']
 ]},
 {id:'career',title:'Карьера',icon:'▣',description:'Работа, развитие и собственные проекты',kind:'folders',folders:[
  ['work','Работа','Рабочие задачи и карьерное развитие'],['restaurant-platform','Ресторанная платформа','Отдельный проект: продукт, этапы и задачи'],['other-projects','Другие проекты','Идеи и собственные проекты']
 ]},
 {id:'education',title:'Обучение',icon:'▤',description:'Навыки, знания и образовательные планы',kind:'tasks'},
 {id:'health-sport',title:'Здоровье и спорт',icon:'↗',description:'Спортивные цели, тренировки и забота о себе',kind:'tasks'},
 {id:'chronicle',title:'Летопись и впечатления',icon:'⌁',description:'События жизни, места, поездки и впечатления',kind:'tasks'},
 {id:'books',title:'Книги',icon:'▥',description:'Прочитанное и список чтения',kind:'tasks'},
 {id:'movies',title:'Фильмы и сериалы',icon:'▷',description:'Просмотренное и планы',kind:'tasks'},
 {id:'wishlist',title:'Желания',icon:'✧',description:'Покупки, мечты и идеи',kind:'tasks'},
 {id:'dog',title:'Собака',icon:'⌁',description:'Уход, дела и важные даты',kind:'tasks'},
 {id:'diary',title:'Дневник и заметки',icon:'✎',description:'Мысли, решения и личные записи',kind:'tasks'},
 {id:'year-review',title:'Итоги года',icon:'◫',description:'Результаты, выводы и планы на следующий год',kind:'tasks'}
];
function freshState(){
 const sections = definitions.map(d => ({...d,items:[],folders:d.folders?.map(([id,title,description])=>({id,title,description,items:[]}))}));
 return {version:4,homeTitle:'Моя жизнь. Мои правила.',sections,cycle:{number:1,start:'',items:[]},updatedAt:null};
}
let state;
try { const saved=JSON.parse(localStorage.getItem(KEY)||'null'); state=saved?.version===4?saved:freshState(); } catch { state=freshState(); }
let activeId=null, activeFolderId=null, reorder=false;
function save(){state.updatedAt=new Date().toISOString();try{$('#saveState').textContent='● Сохранено';localStorage.setItem(KEY,JSON.stringify(state));}catch{$('#saveState').textContent='● Ошибка сохранения';}}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800);}
function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$('#'+id).classList.add('active');window.scrollTo(0,0);}
function field(label,id,value='',type='text',placeholder=''){return `<label class="field"><span>${esc(label)}</span><input id="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`;}
function area(label,id,value='',placeholder=''){return `<label class="field"><span>${esc(label)}</span><textarea id="${id}" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label>`;}
function select(label,id,value,options){return `<label class="field"><span>${esc(label)}</span><select id="${id}">${options.map(x=>`<option value="${esc(x)}" ${x===value?'selected':''}>${esc(x)}</option>`).join('')}</select></label>`;}
function modal(title,html,onSave){
 $('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modalBackdrop').classList.add('open');$('#modalBackdrop').setAttribute('aria-hidden','false');
 const form=$('#modalForm');if(form)form.onsubmit=e=>{e.preventDefault();if(onSave()!==false){closeModal();save();render();if(activeId)openSection(activeId,activeFolderId);toast('Сохранено');}};
 $('#cancelModal')?.addEventListener('click',closeModal);
}
function closeModal(){$('#modalBackdrop').classList.remove('open');$('#modalBackdrop').setAttribute('aria-hidden','true');}
function getSection(id){return state.sections.find(x=>x.id===id);}
function getItems(){const s=getSection(activeId);if(!s)return [];if(activeFolderId)return s.folders?.find(f=>f.id===activeFolderId)?.items||[];return s.items||[];}
function itemForm(items,index,mode){
 const old=index===null?null:items[index];const isGoal=mode==='goal';
 const html=`<form id="modalForm" class="form-stack">${field(isGoal?'Название цели':'Название','itemTitle',old?.title||'','text','Напиши название')}${area(isGoal?'Описание цели':'Описание / заметки','itemDescription',old?.description||'')}${field(isGoal?'Желаемый срок':'Дата / срок','itemDate',old?.date||'','date')}${isGoal?select('Горизонт','itemHorizon',old?.horizon||'1 год',['1 год','3 года','5 лет']):''}${isGoal?select('Приоритет','itemPriority',old?.priority||'Средний',['Высокий','Средний','Низкий']):''}${isGoal?select('Этап выполнения','itemStage',old?.stage||'Не начат',['Не начат','Планирование','В процессе','Ожидает','Завершён']):''}${isGoal?area('Следующий шаг','itemNext',old?.next||''):''}<div class="form-actions"><button type="button" class="button button-soft" id="cancelModal">Отмена</button><button class="button button-primary">Сохранить</button></div></form>`;
 modal(old?'Изменить запись':isGoal?'Новая цель':'Новая запись',html,()=>{const title=$('#itemTitle').value.trim();if(!title)return false;const obj={id:old?.id||uid(),title,description:$('#itemDescription').value.trim(),date:$('#itemDate').value||'',done:old?.done||false};if(isGoal)Object.assign(obj,{horizon:$('#itemHorizon').value,priority:$('#itemPriority').value,stage:$('#itemStage').value,next:$('#itemNext').value.trim()});if(old)items[index]=obj;else items.push(obj);});
}
function renderHome(){
 $('#homeView .welcome').innerHTML=`<div class="eyebrow">ТВОЯ ЛИЧНАЯ СИСТЕМА</div><h1 id="homeTitleText">${esc(state.homeTitle)}</h1><button class="button button-soft" id="editHomeTitle">Изменить надпись</button><p>Все направления жизни — в одном месте. Заполняй сам.</p>`;
 $('#toggleHomeEdit').textContent=reorder?'Готово':'Изменить порядок';$('#sectionGrid').classList.toggle('reorder-mode',reorder);
 $('#sectionGrid').innerHTML=state.sections.map((s,i)=>`<article class="section-tile" data-open-section="${esc(s.id)}"><div class="tile-top"><span class="tile-icon">${esc(s.icon)}</span><span class="tile-arrow">↗</span></div><div><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></div><div class="tile-order"><button class="mini-order" data-up="${i}" aria-label="Переместить вверх">↑</button><button class="mini-order" data-down="${i}" aria-label="Переместить вниз">↓</button></div></article>`).join('');
 $('#homeSummary').innerHTML='';
}
function taskMarkup(items,{goal=false,cyclePeriod=null}={}){
 if(!items.length)return '<div class="empty-state">Пока пусто. Добавь первую запись.</div>';
 return `<div class="block-list">${items.map((x,i)=>`<article class="content-block ${goal?'goal-card':''}" ${cyclePeriod!==null?`data-period="${cyclePeriod}"`:""}><div class="block-head"><label class="task-check"><input type="checkbox" data-check="${i}" ${x.done?'checked':''}><span>${esc(x.title)}</span></label><div class="block-actions"><button class="small-action" data-open-item="${i}">Открыть</button><button class="small-action" data-edit-item="${i}">✎</button><button class="small-action" data-delete-item="${i}">×</button></div></div>${goal?`<div class="goal-meta"><span>${esc(x.horizon||'')}</span><span>Приоритет: ${esc(x.priority||'Средний')}</span><span>Этап: ${esc(x.stage||'Не начат')}</span></div>`:''}${x.description?`<p class="block-body">${esc(x.description)}</p>`:''}${x.date?`<small>Срок: ${esc(x.date)}</small>`:''}</article>`).join('')}</div>`;
}
function folderMarkup(s){return `<div class="folder-grid">${(s.folders||[]).map(f=>`<button class="folder-card" data-open-folder="${esc(f.id)}"><span class="folder-symbol">▰</span><span class="folder-copy"><b>${esc(f.title)}</b><small>${esc(f.description||'')}</small></span><span class="folder-count">${f.items.length}</span><span>›</span></button>`).join('')}</div>`;}
function openSection(id,folderId=null){
 activeId=id;activeFolderId=folderId;const s=getSection(id);if(!s)return home();const f=folderId?s.folders.find(x=>x.id===folderId):null;
 let body='',items=f?f.items:s.items;
 if(s.kind==='folders'&&!f){body=folderMarkup(s);}
 else if(s.kind==='cycles'){
  body=`<section class="summary-panel"><div class="summary-panel-head"><h2>40-дневный цикл № ${state.cycle.number||1}</h2><button class="summary-edit" id="cycleSettings">Настроить даты</button></div><p>${state.cycle.start?`Начало: ${esc(state.cycle.start)}`:'Укажи дату начала цикла.'}</p></section>`;
  for(let p=1;p<=4;p++){const list=state.cycle.items.filter(x=>x.period===p);body+=`<section class="cycle-period content-block"><div class="block-head"><div><h3>Дни ${1+(p-1)*10}–${p*10}</h3><small>${list.filter(x=>x.done).length} из ${list.length} выполнено</small></div><button class="button button-soft" data-add-period="${p}">＋ Добавить задачу</button></div>${taskMarkup(list,{cyclePeriod:p})}</section>`;}
 } else if(s.kind==='strategy'){
  body='';for(const h of ['1 год','3 года','5 лет']){const list=s.items.filter(x=>x.horizon===h);body+=`<section class="strategy-horizon"><div class="block-head"><h2>${h}</h2><button class="button button-soft" data-add-goal="${h}">＋ Цель</button></div>${taskMarkup(list,{goal:true})}</section>`;}
 } else body=taskMarkup(items);
 const title=f?f.title:s.title;const desc=f?f.description:s.description;
 const addButton=s.kind==='folders'&&!f?'':(s.kind==='cycles'||s.kind==='strategy')?'':`<button class="button button-primary" id="addEntry">＋ Добавить</button>`;
 $('#detailContent').innerHTML=`${f?'<button class="back-link" id="folderBack">← '+esc(s.title)+'</button>':''}<div class="detail-head"><div class="detail-title-wrap"><div class="detail-icon">${esc(s.icon)}</div><div><div class="eyebrow">МОЁ ПРОСТРАНСТВО</div><h1>${esc(title)}</h1><p>${esc(desc||'')}</p></div></div></div><div class="detail-toolbar">${addButton}</div>${body}`;
 $('#folderBack')?.addEventListener('click',()=>openSection(id));
 $('#addEntry')?.addEventListener('click',()=>itemForm(items,null,s.kind==='strategy'?'goal':'task'));
 $('#cycleSettings')?.addEventListener('click',()=>modal('Настройки 40-дневного цикла',`<form id="modalForm" class="form-stack">${field('Номер цикла','cycleNumber',state.cycle.number,'number')}${field('Дата начала','cycleStart',state.cycle.start,'date')}<div class="form-actions"><button type="button" class="button button-soft" id="cancelModal">Отмена</button><button class="button button-primary">Сохранить</button></div></form>`,()=>{state.cycle.number=Math.max(1,Number($('#cycleNumber').value)||1);state.cycle.start=$('#cycleStart').value;}));
 $('#detailContent').onclick=e=>{
  const addPeriod=e.target.closest('[data-add-period]');if(addPeriod){itemForm(state.cycle.items,null,'task');const form=$('#modalForm');if(form)form.addEventListener('submit',()=>{}, {once:true});const original=state.cycle.items;const oldSubmit=$('#modalForm').onsubmit;$('#modalForm').onsubmit=ev=>{ev.preventDefault();const title=$('#itemTitle').value.trim();if(!title)return;original.push({id:uid(),title,description:$('#itemDescription').value.trim(),date:$('#itemDate').value||'',done:false,period:Number(addPeriod.dataset.addPeriod)});closeModal();save();openSection(id);toast('Сохранено');};return;}
  const addGoal=e.target.closest('[data-add-goal]');if(addGoal){itemForm(s.items,null,'goal');$('#modalForm').onsubmit=ev=>{ev.preventDefault();const title=$('#itemTitle').value.trim();if(!title)return;const obj={id:uid(),title,description:$('#itemDescription').value.trim(),date:$('#itemDate').value||'',done:false,horizon:addGoal.dataset.addGoal,priority:$('#itemPriority').value,stage:$('#itemStage').value,next:$('#itemNext').value.trim()};s.items.push(obj);closeModal();save();openSection(id);toast('Сохранено');};return;}
  const card=e.target.closest('[data-period]');const visibleItems=s.kind==='cycles'?state.cycle.items.filter(x=>x.period===Number(card?.dataset.period)):items;const sourceItems=s.kind==='cycles'?state.cycle.items:items;
  const check=e.target.closest('[data-check]');if(check){const x=visibleItems[Number(check.dataset.check)];if(x)x.done=check.checked;save();openSection(id,folderId);return;}
  const edit=e.target.closest('[data-edit-item]');if(edit){const x=visibleItems[Number(edit.dataset.editItem)];if(x)itemForm(sourceItems,sourceItems.findIndex(y=>y.id===x.id),s.kind==='strategy'?'goal':'task');return;}
  const del=e.target.closest('[data-delete-item]');if(del){if(confirm('Удалить запись?')){const x=visibleItems[Number(del.dataset.deleteItem)];const idx=sourceItems.findIndex(y=>y.id===x?.id);if(idx>=0)sourceItems.splice(idx,1);save();openSection(id,folderId);}return;}
  const openItem=e.target.closest('[data-open-item]');if(openItem){const x=visibleItems[Number(openItem.dataset.openItem)];if(x)showItem(x);}
  const folder=e.target.closest('[data-open-folder]');if(folder){openSection(id,folder.dataset.openFolder);}
 };
 show('detailView');
}
function showItem(x){modal(x.title,`<div class="item-detail"><div class="detail-description">${esc(x.description||'Описание не добавлено.')}</div>${x.horizon?`<p><b>Горизонт:</b> ${esc(x.horizon)}</p>`:''}${x.date?`<p><b>Срок:</b> ${esc(x.date)}</p>`:''}${x.priority?`<p><b>Приоритет:</b> ${esc(x.priority)}</p>`:''}${x.stage?`<p><b>Этап:</b> ${esc(x.stage)}</p>`:''}${x.next?`<p><b>Следующий шаг:</b> ${esc(x.next)}</p>`:''}<button type="button" class="button button-primary" id="closeItem">Закрыть</button></div>`,()=>true);$('#modalForm')?.removeAttribute('id');$('#closeItem').onclick=closeModal;}
function home(){activeId=null;activeFolderId=null;renderHome();show('homeView');}
function render(){renderHome();}
function exportData(){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.href=u;a.download='life-os-backup.json';a.click();URL.revokeObjectURL(u);}
function importData(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(x.version!==4)throw Error();state=x;save();home();toast('Копия восстановлена');}catch{toast('Не удалось открыть копию версии 4');}};r.readAsText(file);}
$('#sectionGrid').addEventListener('click',e=>{
 const up=e.target.closest('[data-up]'),down=e.target.closest('[data-down]');if(up||down){e.stopPropagation();const i=Number((up||down).dataset[up?'up':'down']),j=i+(up?-1:1);if(j>=0&&j<state.sections.length)[state.sections[i],state.sections[j]]=[state.sections[j],state.sections[i]];save();render();return;}
 const tile=e.target.closest('[data-open-section]');if(tile&&!reorder)openSection(tile.dataset.openSection);
});
$('#toggleHomeEdit').onclick=()=>{reorder=!reorder;renderHome();};
$('#homeView').addEventListener('click',e=>{if(e.target.closest('#editHomeTitle'))modal('Надпись на главном экране',`<form id="modalForm" class="form-stack">${field('Текст','homeTitle',state.homeTitle)}<div class="form-actions"><button type="button" class="button button-soft" id="cancelModal">Отмена</button><button class="button button-primary">Сохранить</button></div></form>`,()=>{state.homeTitle=$('#homeTitle').value.trim()||'Моя жизнь. Мои правила.';});});
$('#addSection').onclick=()=>modal('Новый раздел',`<form id="modalForm" class="form-stack">${field('Название раздела','newSectionTitle')}${field('Значок','newSectionIcon','◇')}<div class="form-actions"><button type="button" class="button button-soft" id="cancelModal">Отмена</button><button class="button button-primary">Создать</button></div></form>`,()=>{const title=$('#newSectionTitle').value.trim();if(!title)return false;state.sections.push({id:uid(),title,icon:$('#newSectionIcon').value||'◇',description:'',kind:'tasks',items:[]});});
$('#homeBtn').onclick=home;$('#backHome').onclick=home;$('#navHome').onclick=home;$('#settingsBtn').onclick=()=>show('settingsView');$('#navSettings').onclick=()=>show('settingsView');$('#settingsBack').onclick=home;$('#modalClose').onclick=closeModal;$('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal();};$('#exportData').onclick=exportData;$('#importData').onchange=e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value='';};$('#resetData').onclick=()=>{if(confirm('Сбросить все данные приложения?')){state=freshState();save();home();}};
render();if(!localStorage.getItem(KEY))save();if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
