(function(){
'use strict';
var page=document.body.getAttribute('data-page'),root=document.getElementById('pageRoot'),key='nexcourier-public-lang';
var ui={
es:{demo:'Demo pública · sin backend',home:'Inicio',services:'Servicios',how:'Cómo funciona',rates:'Tarifas',help:'Ayuda',create:'Crear mi casillero',tag:'Logística Internacional',pending:'Función pendiente de integración.',trackLabel:'Número de tracking',trackPh:'Ingresá tu tracking',trackBtn:'Revisar tracking',origin:'Origen',weight:'Peso (kg)',size:'Dimensiones',category:'Categoría',calcBtn:'Preparar cálculo',email:'Email',password:'Contraseña',name:'Nombre completo',phone:'Teléfono / WhatsApp',accountBtn:'Revisar acceso',registerBtn:'Revisar registro',feedback:'Esta demo no envió datos ni consultó un sistema real.',back:'Volver al Home',footer:'NexCourier · Demo no indexable'},
en:{demo:'Public demo · no backend',home:'Home',services:'Services',how:'How it works',rates:'Rates',help:'Help',create:'Create my locker',tag:'International Logistics',pending:'Feature pending integration.',trackLabel:'Tracking number',trackPh:'Enter your tracking number',trackBtn:'Check tracking',origin:'Origin',weight:'Weight (kg)',size:'Dimensions',category:'Category',calcBtn:'Prepare estimate',email:'Email',password:'Password',name:'Full name',phone:'Phone / WhatsApp',accountBtn:'Check access',registerBtn:'Check registration',feedback:'This demo did not send data or query a live system.',back:'Back to Home',footer:'NexCourier · Non-indexable demo'},
zh:{demo:'公開展示 · 無後端',home:'首頁',services:'服務',how:'服務流程',rates:'費率',help:'幫助',create:'建立我的轉運地址',tag:'國際物流',pending:'功能仍待整合。',trackLabel:'追蹤號碼',trackPh:'輸入追蹤號碼',trackBtn:'檢查追蹤',origin:'起運地',weight:'重量（公斤）',size:'尺寸',category:'類別',calcBtn:'準備估算',email:'電子郵件',password:'密碼',name:'姓名',phone:'電話 / WhatsApp',accountBtn:'檢查登入',registerBtn:'檢查註冊',feedback:'本展示未傳送資料，也未查詢實際系統。',back:'返回首頁',footer:'NexCourier · 不索引展示'}
};
var aria={
es:{language:'Selector de idioma',mainNav:'Navegación principal',brandHome:'NexCourier — Inicio'},
en:{language:'Language selector',mainNav:'Main navigation',brandHome:'NexCourier — Home'},
zh:{language:'語言選擇器',mainNav:'主要導覽',brandHome:'NexCourier — 首頁'}
};
function esc(v){return String(v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function cards(items){return '<div class="grid">'+items.map(function(x,i){return '<article class="card'+(i===0?' dark':'')+'"><h2>'+esc(x[0])+'</h2><p>'+esc(x[1])+'</p></article>';}).join('')+'</div>';}
function steps(items){return '<div class="steps">'+items.map(function(x,i){return '<article class="step"><span>'+(i+1)+'</span><h2>'+esc(x[0])+'</h2><p>'+esc(x[1])+'</p></article>';}).join('')+'</div>';}
function faqs(items){return '<div class="faq">'+items.map(function(x){return '<details><summary>'+esc(x[0])+'</summary><p>'+esc(x[1])+'</p></details>';}).join('')+'</div>';}
function shell(kind,t){
 var body='';
 if(kind==='tracking')body='<label for="tracking">'+t.trackLabel+'</label><input id="tracking" autocomplete="off" placeholder="'+t.trackPh+'"><button class="btn primary" type="submit">'+t.trackBtn+'</button>';
 if(kind==='calculator')body='<label for="origin">'+t.origin+'</label><select id="origin"><option>'+t.pending+'</option></select><label for="weight">'+t.weight+'</label><input id="weight" type="number" min="0.01" step="0.01"><label for="size">'+t.size+'</label><input id="size" placeholder="L × A × H"><label for="category">'+t.category+'</label><input id="category"><button class="btn primary" type="submit">'+t.calcBtn+'</button>';
 if(kind==='account')body='<label for="email">'+t.email+'</label><input id="email" type="email"><label for="password">'+t.password+'</label><input id="password" type="password"><button class="btn primary" type="submit">'+t.accountBtn+'</button>';
 if(kind==='register')body='<label for="name">'+t.name+'</label><input id="name"><label for="email">'+t.email+'</label><input id="email" type="email"><label for="phone">'+t.phone+'</label><input id="phone" type="tel"><button class="btn primary" type="submit">'+t.registerBtn+'</button>';
 return '<form class="shell" id="safeForm">'+body+'<div class="feedback" id="feedback" role="status"></div></form>';
}
function render(lang){
 if(!/^(es|en|zh)$/.test(lang))lang='es';
 var t=ui[lang],d=window.NEX_PAGE_DATA[lang][page]||window.NEX_PAGE_DATA[lang].servicios;
 document.documentElement.lang=lang==='zh'?'zh-Hant':lang;
 document.title='NexCourier — '+d.t;
 document.querySelectorAll('[data-t]').forEach(function(el){el.textContent=t[el.getAttribute('data-t')];});
 document.querySelectorAll('[data-ta]').forEach(function(el){el.setAttribute('aria-label',aria[lang][el.getAttribute('data-ta')]);});
 document.querySelectorAll('[data-lang]').forEach(function(el){el.classList.toggle('on',el.getAttribute('data-lang')===lang);});
 var content=d.k==='steps'?steps(d.i):d.k==='cards'?cards(d.i):d.k==='faq'?faqs(d.i):shell(d.k,t);
 root.innerHTML='<section class="hero"><div class="wrap"><span class="eyebrow">'+esc(d.e)+'</span><h1>'+esc(d.t)+'</h1><p>'+esc(d.p)+'</p>'+(d.n?'<div class="notice">'+esc(d.n)+'</div>':'')+'</div></section><section class="content"><div class="wrap">'+content+'<div class="actions"><a class="btn secondary" href="../index.html">'+t.back+'</a></div></div></section>';
 var form=document.getElementById('safeForm');
 if(form)form.addEventListener('submit',function(e){e.preventDefault();var f=document.getElementById('feedback');f.textContent=t.feedback;f.classList.add('show');});
 localStorage.setItem(key,lang);
}
document.querySelectorAll('[data-lang]').forEach(function(btn){btn.addEventListener('click',function(){render(btn.getAttribute('data-lang'));});});
render(localStorage.getItem(key)||'es');
})();
