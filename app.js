const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(Number(n)||0)+' ₽';
const today = new Date();
const iso = d => new Date(d).toISOString().slice(0,10);
const fmtDate = s => s ? new Date(s+'T12:00:00').toLocaleDateString('ru-RU',{day:'2-digit',month:'short',year:'numeric'}) : '';
const icons = {dashboard:'⌂',finance:'₽',cycles:'◷',goals:'◎',projects:'✳',life:'⌁',library:'▦',settings:'⚙'};
const nav = [
 ['dashboard','Главная'],['finance','Финансы'],['cycles','40-дневный цикл'],['goals','Цели и стратегия'],['projects','Работа и проекты'],['life','Жизнь и заметки'],['library','Все разделы'],['settings','Настройки']
];
const sections = [
 ['Стратегия жизни','◎','Ценности, пятилетний вектор и большие ориентиры.'],
 ['40-дневные циклы','◷','Главные результаты, контрольные точки и итоги.'],
 ['Финансы','₽','Бюджет, операции, долги и обязательства.'],
 ['Три копилки','◈','Подушка, крупные покупки и ИИС.'],
 ['Работа и карьера','▣','Работа, доход, должности и развитие.'],
 ['Ресторанная AI-платформа','✳','Продукт, этапы, тестовые рестораны и продажи.'],
 ['Обучение','⌘','Навыки, курсы и учебные планы.'],
 ['Здоровье и спорт','↗','Тренировки, вес, профилактика и Ironman.'],
 ['Книги','▤','Прочитанное и список чтения.'],
 ['Кино и сериалы','▷','Фильмы, сериалы и документальное кино.'],
 ['Места и впечатления','⌖','Посещения, даты, оценки и фото-ссылки.'],
 ['Вишлист','✧','Покупки, желания и мечты.'],
 ['Дом и недвижимость','⌂','Жильё и долгосрочные планы.'],
 ['Собака','♡','Ветеринар, прививки и расходы.'],
 ['Летопись жизни','⌁','Важные события с датами.'],
 ['Дневник и заметки','✎','Мысли, идеи и выводы.'],
 ['Итоги года','◷','Достижения и выводы по году.'],
 ['Резервные копии','⇧','Экспорт и восстановление данных.']
];
const defaultState = {
 version:1, transactions:[], notes:[], timeline:[],
 allocation:{reserve:10,purchases:10,invest:5}, reserveGoal:100000, debtStart:10000, debtCurrent:10000,
 reserveBalance:0, purchasesBalance:0, investBalance:1300,
 cycle:{start:'2026-11-04',end:'2026-12-13',tasks:[
  {title:'Работа',desc:'Устроиться, узнать фактический график, условия и доход.',status:'В работе'},
  {title:'Финансы',desc:'Начать гасить долги, учитывать расходы и распределять поступления.',status:'Не начато'},
  {title:'AI-платформа',desc:'Определить ближайший этап разработки и начать системную работу.',status:'Не начато'},
  {title:'Спорт',desc:'Вернуться к тренировкам, восстановить регулярность и постепенно набирать вес.',status:'Не начато'}
 ]},
 budget:[['Жильё',20000],['Продукты',15000],['Собака',5000],['Телефон и интернет',1000],['Одежда',5000],['Бытовые расходы',5000],['Снюс',3000],['Подписки',1000]],
 goals:[
  {title:'Финансовая свобода',desc:'Несколько источников дохода, капитал и возможность не зависеть от ежедневной работы.',meta:'К ноябрю 2031 · долгосрочная цель'},
  {title:'Капитал 10 млн ₽',desc:'Считать деньги, инвестиции, недвижимость и доли в бизнесах за вычетом долгов.',meta:'К ноябрю 2031 · амбициозно'},
  {title:'Личный доход 800–900 тыс. ₽',desc:'Ориентир дохода в месяц, не прогноз и не гарантия.',meta:'К ноябрю 2031'},
  {title:'Накопления 500 000 ₽',desc:'Нарастить капитал и дисциплину распределения поступлений.',meta:'До ноября 2027 · амбициозно'},
  {title:'Мотоцикл',desc:'Покупка к лету 2027. Ориентир 150–200 тыс. ₽ без экипировки и оформления.',meta:'Лето 2027'},
  {title:'Ironman',desc:'Полная дистанция через пару лет, с постепенной подготовкой и восстановлением.',meta:'Ориентир 2028–2029'}
 ],
 projects:[
  {title:'Основная работа',desc:'Стабильный доход и развитие в ресторанном управлении. Предварительный расчёт 99 000 ₽/мес. — сценарий, не подтверждённый доход.',meta:'Приоритет: стабильность',icon:'▣'},
  {title:'Ресторанная AI-платформа',desc:'Универсальная restaurant OS: обучение, операции, администрация и AI-ассистенты.',meta:'Цель: 1 тестовый + 3 платных ресторана к ноябрю 2027',icon:'✳'},
  {title:'Собственный общепит',desc:'Отдельное направление будущего бизнеса. Идеи и гипотезы фиксировать до появления бюджета.',meta:'Долгосрочный проект',icon:'◈'}
 ],
 profile:{name:'Danil'}
};
let state = loadState();
function loadState(){try{return {...structuredClone(defaultState),...JSON.parse(localStorage.getItem('lifeos-data')||'{}')}}catch(e){return structuredClone(defaultState)}}
function save(){localStorage.setItem('lifeos-data',JSON.stringify(state));renderAll();toast('Сохранено на этом устройстве');}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2300)}
function monthTransactions(){const m=iso(today).slice(0,7);return state.transactions.filter(t=>t.date?.slice(0,7)===m)}
function totals(){const ts=monthTransactions();return {income:ts.filter(t=>t.type==='income').reduce((a,t)=>a+ +t.amount,0),expense:ts.filter(t=>t.type==='expense').reduce((a,t)=>a+ +t.amount,0)}}
function daysElapsed(){const s=new Date(state.cycle.start+'T00:00:00'), n=new Date(iso(today)+'T00:00:00');return Math.max(1,Math.min(40,Math.floor((n-s)/86400000)+1))}
function progress(){return Math.round(state.cycle.tasks.filter(t=>t.status==='Готово').length/state.cycle.tasks.length*100)}
function renderNav(){const navHtml=nav.map(([id,label])=>`<button class="nav-btn ${id==='dashboard'?'active':''}" data-page="${id}"><span class="nav-icon">${icons[id]}</span>${label}</button>`).join('');$('#sideNav').innerHTML=navHtml;$('#bottomNav').innerHTML=nav.filter(x=>['dashboard','finance','cycles','goals','library'].includes(x[0])).map(([id,label])=>`<button data-page="${id}" class="${id==='dashboard'?'active':''}"><span>${icons[id]}</span>${label==='40-дневный цикл'?'Цикл':label==='Цели и стратегия'?'Цели':label}</button>`).join('')}
function go(page){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$('#page-'+page)?.classList.add('active');document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('#breadcrumb').textContent='Обзор / '+(nav.find(x=>x[0]===page)?.[1]||'Главная');window.scrollTo({top:0,behavior:'smooth'})}
function renderDashboard(){
 const p=progress(),d=daysElapsed(),t=totals();
 $('#reserveStat').textContent=money(state.reserveBalance);$('#reserveProgress').textContent=Math.round(state.reserveBalance/state.reserveGoal*100)+'% от цели '+money(state.reserveGoal);$('#reserveBar').style.width=Math.min(100,state.reserveBalance/state.reserveGoal*100)+'%';
 $('#debtStat').textContent=money(state.debtCurrent);$('#incomeStat').textContent=t.income?money(t.income):'—';$('#cycleDayStat').textContent=`День ${d} / 40`;$('#cycleDateStat').textContent=fmtDate(state.cycle.start)+' — '+fmtDate(state.cycle.end);$('#cycleBar').style.width=d/40*100+'%';
 $('#focusList').innerHTML=state.cycle.tasks.map((x,i)=>`<div class="focus-item"><div class="focus-check">${x.status==='Готово'?'✓':i+1}</div><div class="focus-copy"><b>${x.title}</b><small>${x.desc}</small></div><span class="focus-status">${x.status}</span></div>`).join('');
 $('#allocationDonut').style.background=`conic-gradient(#a78bfa 0 ${state.allocation.reserve}%,#63a7ff ${state.allocation.reserve}% ${state.allocation.reserve+state.allocation.purchases}%,#48d6a1 ${state.allocation.reserve+state.allocation.purchases}% ${state.allocation.reserve+state.allocation.purchases+state.allocation.invest}%,#29354b ${state.allocation.reserve+state.allocation.purchases+state.allocation.invest}% 100%)`;
}
function renderFinance(){
 const t=totals();$('#finIncome').textContent=money(t.income);$('#finExpense').textContent=money(t.expense);$('#finBalance').textContent=money(t.income-t.expense);$('#finDebt').textContent=money(state.debtCurrent+60000);
 const budgetTotal=state.budget.reduce((a,x)=>a+x[1],0);$('#budgetList').innerHTML=state.budget.map(x=>`<div class="budget-row"><span>${x[0]}</span><b>${money(x[1])}</b><div class="budget-track"><i style="width:${x[1]/budgetTotal*100}%"></i></div></div>`).join('');
 const max=Math.max(1,t.income,t.expense);$('#cashChart').innerHTML=`<div class="chart-col"><div class="bars"><div class="bar income" style="height:${t.income/max*100}%"></div><div class="bar expense" style="height:${t.expense/max*100}%"></div></div><small>Текущий месяц</small></div><div class="chart-col" style="align-items:flex-start;justify-content:center;gap:12px"><small><i class="dot green"></i> Доходы: ${money(t.income)}</small><small><i class="dot" style="background:var(--orange)"></i> Расходы: ${money(t.expense)}</small></div>`;
 const rows=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);$('#transactionRows').innerHTML=rows.length?rows.map(x=>`<tr><td>${fmtDate(x.date)}</td><td>${escapeHtml(x.title)}</td><td>${escapeHtml(x.category)}</td><td>${x.type==='income'?'Доход':'Расход'}</td><td class="right ${x.type==='income'?'amount-positive':'amount-negative'}">${x.type==='income'?'+':'−'}${money(x.amount)}</td><td><button class="text-btn" data-delete-tx="${x.id}">Удалить</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty-cell">Пока нет операций. Добавь первое поступление или расход.</td></tr>';
}
function renderCycles(){const p=progress(),d=daysElapsed();$('#cyclePercent').textContent=p+'%';$('#cycleRing').style.background=`conic-gradient(#a78bfa ${p*3.6}deg,#28334b ${p*3.6}deg)`;$('#cycleRange').textContent=fmtDate(state.cycle.start)+' — '+fmtDate(state.cycle.end);$('#cycleTasks').innerHTML=state.cycle.tasks.map((x,i)=>`<article class="task-card"><div class="task-card-head"><div class="task-number">0${i+1}</div><h3>${x.title}</h3></div><p>${x.desc}</p><select data-task="${i}"><option ${x.status==='Не начато'?'selected':''}>Не начато</option><option ${x.status==='В работе'?'selected':''}>В работе</option><option ${x.status==='Готово'?'selected':''}>Готово</option><option ${x.status==='Отложено'?'selected':''}>Отложено</option></select></article>`).join('')}
function renderGoals(){$('#goalGrid').innerHTML=state.goals.map((g,i)=>`<article class="goal-card"><div class="goal-icon">${['◎','₽','↗','◈','⌁','♡'][i%6]}</div><h3>${g.title}</h3><p>${g.desc}</p><div class="goal-meta">${g.meta}</div></article>`).join('')}
function renderProjects(){$('#projectGrid').innerHTML=state.projects.map(g=>`<article class="project-card"><div class="project-icon">${g.icon}</div><h3>${g.title}</h3><p>${g.desc}</p><div class="goal-meta">${g.meta}</div></article>`).join('')}
function renderLife(){$('#timelineList').innerHTML=state.timeline.length?[...state.timeline].sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<div class="timeline-item"><b>${escapeHtml(x.title)}</b><small>${fmtDate(x.date)}</small><p>${escapeHtml(x.text)}</p></div>`).join(''):'<p class="muted small">Здесь будут важные события твоей жизни. Можно добавлять задним числом.</p>';$('#notesList').innerHTML=state.notes.length?[...state.notes].reverse().map(x=>`<div class="note-item"><b>${escapeHtml(x.title)}</b><p>${escapeHtml(x.text)}</p></div>`).join(''):'<p class="muted small">Сохраняй идеи, мысли и выводы, когда захочешь.</p>'}
function renderLibrary(){$('#libraryGrid').innerHTML=sections.map((x,i)=>`<article class="library-card" data-section="${i}"><div class="lib-icon">${x[1]}</div><h3>${x[0]}</h3><p>${x[2]}</p></article>`).join('')}
function renderAll(){renderDashboard();renderFinance();renderCycles();renderGoals();renderProjects();renderLife();renderLibrary();$('#todayLabel').textContent=today.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});$('#pctReserve').value=state.allocation.reserve;$('#pctPurchases').value=state.allocation.purchases;$('#pctInvest').value=state.allocation.invest;$('#reserveGoal').value=state.reserveGoal;$('#debtStart').value=state.debtStart;$('#allocationTotal').textContent='Всего в копилки: '+(state.allocation.reserve+state.allocation.purchases+state.allocation.invest)+'%'}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function openModal(title,html,submit){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modalBackdrop').classList.add('open');$('#modalSubmit')?.addEventListener('click',()=>{if(submit())$('#modalBackdrop').classList.remove('open')})}
function closeModal(){$('#modalBackdrop').classList.remove('open')}
function addTx(){openModal('Новая операция',`<div class="form-grid"><label>Тип<select id="txType"><option value="income">Доход</option><option value="expense">Расход</option></select></label><label>Название<input id="txTitle" placeholder="Например, зарплата или продукты"></label><label>Категория<input id="txCategory" placeholder="Работа, продукты, собака..."></label><label>Сумма, ₽<input id="txAmount" type="number" min="1" placeholder="10000"></label><label>Дата<input id="txDate" type="date" value="${iso(today)}"></label><button class="primary-btn" id="modalSubmit">Сохранить операцию</button></div>`,()=>{const amount=+$('#txAmount').value;if(!$('#txTitle').value.trim()||amount<=0){toast('Заполни название и сумму');return false}const item={id:crypto.randomUUID(),type:$('#txType').value,title:$('#txTitle').value.trim(),category:$('#txCategory').value.trim()||'Без категории',amount,date:$('#txDate').value||iso(today)};state.transactions.push(item);if(item.type==='income'){state.reserveBalance+=amount*state.allocation.reserve/100;state.purchasesBalance+=amount*state.allocation.purchases/100;state.investBalance+=amount*state.allocation.invest/100}save();return true})}
function addNote(){openModal('Новая запись',`<div class="form-grid"><label>Тип<select id="noteType"><option value="note">Заметка</option><option value="timeline">Событие летописи</option></select></label><label>Заголовок<input id="noteTitle" placeholder="Что важно сохранить?"></label><label>Дата<input id="noteDate" type="date" value="${iso(today)}"></label><label>Текст<textarea id="noteText" placeholder="Запиши мысль или событие..."></textarea></label><button class="primary-btn" id="modalSubmit">Сохранить</button></div>`,()=>{const title=$('#noteTitle').value.trim(),text=$('#noteText').value.trim();if(!title||!text){toast('Заполни заголовок и текст');return false}const item={id:crypto.randomUUID(),title,text,date:$('#noteDate').value||iso(today)};( $('#noteType').value==='note'?state.notes:state.timeline).push(item);save();return true})}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='life-os-backup-'+iso(today)+'.json';a.click();URL.revokeObjectURL(a.href);toast('Резервная копия подготовлена')}
function importData(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.version)throw Error();state={...structuredClone(defaultState),...x};save();toast('Данные восстановлены')}catch(e){toast('Не удалось прочитать файл копии')}};r.readAsText(file)}
renderNav();renderAll();
document.addEventListener('click',e=>{const p=e.target.closest('[data-page]');if(p)go(p.dataset.page);const g=e.target.closest('[data-go]');if(g)go(g.dataset.go);const del=e.target.closest('[data-delete-tx]');if(del){state.transactions=state.transactions.filter(x=>x.id!==del.dataset.deleteTx);save()}const sec=e.target.closest('[data-section]');if(sec){const i=+sec.dataset.section;toast(sections[i][0]+' — раздел будет развиваться в следующих версиях') }});
document.addEventListener('change',e=>{if(e.target.matches('[data-task]')){state.cycle.tasks[+e.target.dataset.task].status=e.target.value;save()}});
$('#addTransaction').onclick=addTx;$('#addNote').onclick=addNote;$('#settingsBtn').onclick=()=>go('settings');$('#profileBtn').onclick=()=>go('settings');$('#mobileHome').onclick=()=>go('dashboard');$('#closeModal').onclick=closeModal;$('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal()};
$('#exportData').onclick=exportData;$('#importData').onchange=e=>e.target.files[0]&&importData(e.target.files[0]);$('#resetData').onclick=()=>{if(confirm('Удалить все локальные данные Life OS с этого устройства? Сначала скачай резервную копию.')){localStorage.removeItem('lifeos-data');state=structuredClone(defaultState);save()}};
$('#saveAllocation').onclick=()=>{const a={reserve:+$('#pctReserve').value,purchases:+$('#pctPurchases').value,invest:+$('#pctInvest').value};if(Object.values(a).some(x=>x<0)||Object.values(a).reduce((x,y)=>x+y,0)>100){toast('Сумма процентов не может превышать 100%');return}state.allocation=a;save()};
$('#saveSettings').onclick=()=>{state.reserveGoal=Math.max(1,+$('#reserveGoal').value||100000);state.debtStart=Math.max(0,+$('#debtStart').value||0);save()};
$('#clearFilter').onclick=()=>toast('Показаны все операции');
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
