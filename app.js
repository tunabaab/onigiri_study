/* 🍙 오니기리 일본어 스터디 · 정적 사이트 + Supabase
 * 사용자 정의 HTML 실행 onclick 대신 이벤트 위임으로 버튼 동작을 관리합니다.
 * 개인 기록은 서버의 RLS 정책으로 분리됩니다. 데모 데이터는 브라우저에만 저장됩니다.
 */
const $ = (sel, base = document) => base.querySelector(sel);
const $$ = (sel, base = document) => Array.from(base.querySelectorAll(sel));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escapeAttr = escapeHTML;
const normalize = value => String(value ?? '').trim().replace(/[\s\u3000。、.!?！？]+/g,'').toLocaleLowerCase();
const uid = () => (globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`);
const safeDate = value => value ? new Date(value).toLocaleDateString('ko-KR') : '-';
const asText = err => err?.message || String(err);
const CONFIG = window.ONIGIRI_CONFIG ?? {};
const CONFIGURED = /^https:\/\/[-a-z0-9]+\.supabase\.co\/?$/i.test((CONFIG.supabaseUrl || '').replace(/\/$/,'')) &&
  !!CONFIG.supabaseKey && !CONFIG.supabaseKey.includes('YOUR_');
const GROUP_KEY = 'onigiri-active-room-v1';
const DEMO_KEY = 'onigiri-shared-demo-v1';
const memoryFallback = new Map();
function storageRead(k){try{return localStorage.getItem(k);}catch{return memoryFallback.get(k)||null;}}
function storageWrite(k,v){try{localStorage.setItem(k,v);}catch{memoryFallback.set(k,v);toast('브라우저가 로컬 저장을 차단했습니다. 체험 자료는 종료 시 사라질 수 있어요.',true);}}

const icon = (name, size = 18) => {
  const paths = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    text:'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    quiz:'<path d="M12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="m3 7.5 9 5 9-5M12 12.5V21"/>',
    alert:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>',
    note:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h7"/>',
    help:'<circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 4h.01"/>',
    sound:'<path d="m11 5-6 4H2v6h3l6 4V5zM15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 10v7M14 10v7"/>',
    edit:'<path d="m16 4 4 4M4 20l4.5-1 12-12a2.8 2.8 0 0 0-4-4l-12 12z"/>',
    refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7.5 7.5 0 0 1 19 7l1 5M4 12l1 5a7.5 7.5 0 0 0 13.5-2"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>'
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.home}</svg>`;
};
const onigiri = () => `<svg class="brand-illustration" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="웃는 오니기리 캐릭터"><ellipse cx="73" cy="123" rx="52" ry="10" fill="#aac7ab" opacity=".2"/><path d="M55 17C64 4 82 9 90 24L125 93c8 18-2 31-20 33H32C12 124 8 108 18 90Z" fill="#fffdf5" stroke="#264f3a" stroke-width="4.5" stroke-linejoin="round"/><path d="M50 86h47v38H50z" fill="#244c3c"/><path d="M58 86v38m10-38v38m11-38v38" stroke="#37664e" opacity=".3" stroke-width="2"/><ellipse cx="51" cy="78" rx="4.3" ry="5.5" fill="#244c3c"/><ellipse cx="90" cy="78" rx="4.3" ry="5.5" fill="#244c3c"/><path d="M62 84q10 12 18 0" fill="none" stroke="#244c3c" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="41" cy="87" rx="8" ry="5" fill="#f5b0a6" opacity=".67"/><ellipse cx="101" cy="87" rx="8" ry="5" fill="#f5b0a6" opacity=".67"/><path d="M106 33l5-8m6 15 9-3" stroke="#f7ac56" stroke-width="4" stroke-linecap="round"/></svg>`;

const DICTIONARY = [
  ['美味しい','おいしい','맛있다','い형용사'],['静か','しずか','조용하다','な형용사'],
  ['食べる','たべる','먹다','동사'],['行く','いく','가다','동사'],
  ['便利','べんり','편리하다','な형용사'],['読む','よむ','읽다','동사'],
  ['寒い','さむい','춥다','い형용사'],['暑い','あつい','덥다','い형용사'],
  ['難しい','むずかしい','어렵다','い형용사'],['楽しい','たのしい','즐겁다','い형용사'],
  ['新しい','あたらしい','새롭다','い형용사'],['高い','たかい','비싸다','い형용사'],
  ['安い','やすい','싸다','い형용사'],['小さい','ちいさい','작다','い형용사'],
  ['大きい','おおきい','크다','い형용사'],['優しい','やさしい','친절하다','い형용사'],
  ['綺麗','きれい','예쁘다','な형용사'],['元気','げんき','건강하다','な형용사'],
  ['大丈夫','だいじょうぶ','괜찮다','な형용사'],['好き','すき','좋아하다','な형용사'],
  ['嫌い','きらい','싫어하다','な형용사'],['飲む','のむ','마시다','동사'],
  ['見る','みる','보다','동사'],['買う','かう','사다','동사'],
  ['来る','くる','오다','동사'],['帰る','かえる','돌아가다','동사'],
  ['話す','はなす','이야기하다','동사'],['聞く','きく','듣다','동사'],
  ['書く','かく','쓰다','동사'],['勉強する','べんきょうする','공부하다','동사'],
  ['学校','がっこう','학교','명사'],['先生','せんせい','선생님','명사'],
  ['学生','がくせい','학생','명사'],['友達','ともだち','친구','명사'],
  ['本','ほん','책','명사'],['部屋','へや','방','명사'],
  ['映画','えいが','영화','명사'],['今日','きょう','오늘','명사'],
  ['昨日','きのう','어제','명사'],['明日','あした','내일','명사'],
  ['面白い','おもしろい','재미있다','い형용사'],['忙しい','いそがしい','바쁘다','い형용사']
].map(([kanji,kana,meaning,pos])=>({kanji,kana,meaning,pos}));
const STARTER_WORDS = [0,1,2,3,4,5,6,7,8,9,10,11].map(i=>({...DICTIONARY[i],id:uid()}));
const STARTER_PATTERNS = [
  ['これは 美味しくないです。','これは おいしくないです。','이것은 맛있지 않아요.','い형용사'],
  ['綺麗な 部屋です。','きれいな へやです。','예쁜 방이에요.','な형용사'],
  ['昨日は 寒かったです。','きのうは さむかったです。','어제는 추웠어요.','い형용사'],
  ['毎日 本を 読みます。','まいにち ほんを よみます。','매일 책을 읽어요.','동사'],
  ['今日は 学校へ 行きません。','きょうは がっこうへ いきません。','오늘은 학교에 가지 않아요.','동사'],
  ['この 部屋は 静かです。','この へやは しずかです。','이 방은 조용해요.','な형용사']
].map(([japanese,reading,meaning,grammar])=>({id:uid(),japanese,reading,meaning,grammar}));

function readDemo() {
  try {const v=JSON.parse(storageRead(DEMO_KEY));if(v && Array.isArray(v.words))return v;} catch (_) {}
  return {words:STARTER_WORDS,patterns:STARTER_PATTERNS,attempts:[],mistakes:[],notes:[]};
}
class DemoStore {
  constructor(){this.data=readDemo();this.user={id:'demo-user',email:'demo@local.example'};}
  save(){storageWrite(DEMO_KEY,JSON.stringify(this.data));}
  async getGroups(){return [{id:'demo-group',name:'오니기리 체험 학습실',invite_code:'데모에서는 공유되지 않음'}];}
  async createGroup(){throw Error('공동 학습실은 Supabase 설정 후 이용할 수 있어요.');}
  async joinGroup(){throw Error('공동 학습실은 Supabase 설정 후 이용할 수 있어요.');}
  async getWords(){return [...this.data.words];}
  async getPatterns(){return [...this.data.patterns];}
  async getAttempts(){return [...this.data.attempts];}
  async getMistakes(){return [...this.data.mistakes];}
  async getNotes(){return [...this.data.notes];}
  async saveWord(row,id){const obj={...row,id:id||uid(),updated_at:new Date().toISOString()};if(id){const idx=this.data.words.findIndex(x=>x.id===id);if(idx<0)throw Error('수정할 단어를 찾지 못했습니다');this.data.words[idx]={...this.data.words[idx],...obj};}else this.data.words.unshift(obj);this.save();return obj;}
  async deleteWord(id){this.data.words=this.data.words.filter(x=>x.id!==id);this.save();}
  async savePattern(row,id){const obj={...row,id:id||uid(),updated_at:new Date().toISOString()};if(id){const idx=this.data.patterns.findIndex(x=>x.id===id);if(idx<0)throw Error('수정할 문형을 찾지 못했습니다');this.data.patterns[idx]={...this.data.patterns[idx],...obj};}else this.data.patterns.unshift(obj);this.save();return obj;}
  async deletePattern(id){this.data.patterns=this.data.patterns.filter(x=>x.id!==id);this.save();}
  async recordAnswer(row){this.data.attempts.push({id:uid(),...row,created_at:new Date().toISOString()});if(!row.correct){const existing=this.data.mistakes.find(x=>x.item_id===row.item_id&&x.kind===row.kind&&x.mode===row.mode);if(existing){existing.wrong_count++;existing.prompt=row.prompt;existing.expected=row.expected;existing.given=row.given;existing.last_seen=new Date().toISOString();}else this.data.mistakes.unshift({id:uid(),...row,wrong_count:1,memo:'',last_seen:new Date().toISOString()});}this.save();}
  async saveMistakeMemo(id,memo){const item=this.data.mistakes.find(x=>x.id===id);if(!item)throw Error('오답을 찾지 못했습니다');item.memo=memo;this.save();}
  async deleteMistakes(ids){this.data.mistakes=this.data.mistakes.filter(x=>!ids.includes(x.id));this.save();}
  async saveNote(row,id){const obj={...row,id:id||uid(),updated_at:new Date().toISOString()};if(id){const idx=this.data.notes.findIndex(x=>x.id===id);if(idx<0)throw Error('메모가 없습니다');this.data.notes[idx]={...this.data.notes[idx],...obj};}else this.data.notes.unshift(obj);this.save();}
  async deleteNote(id){this.data.notes=this.data.notes.filter(x=>x.id!==id);this.save();}
}
const unwrap = result => {if(result.error)throw result.error;return result.data;};
class SupabaseStore {
  constructor(client,user){this.client=client;this.user=user;this.groupId=null;}
  setGroup(id){this.groupId=id;}
  async getGroups(){
    const memberships=unwrap(await this.client.from('study_members').select('group_id').eq('user_id',this.user.id));
    if(!memberships?.length)return [];
    return unwrap(await this.client.from('study_groups').select('id,name,invite_code').in('id',memberships.map(x=>x.group_id)).order('created_at'));
  }
  async createGroup(name){return unwrap(await this.client.rpc('create_study_group',{p_name:name}));}
  async joinGroup(code){return unwrap(await this.client.rpc('join_study_group',{p_code:code}));}
  async getWords(){return unwrap(await this.client.from('study_words').select('*').eq('group_id',this.groupId).order('created_at',{ascending:false}));}
  async getPatterns(){return unwrap(await this.client.from('study_patterns').select('*').eq('group_id',this.groupId).order('created_at',{ascending:false}));}
  async getAttempts(){return unwrap(await this.client.from('study_attempts').select('*').eq('group_id',this.groupId).order('created_at',{ascending:false}).limit(1000));}
  async getMistakes(){return unwrap(await this.client.from('study_mistakes').select('*').eq('group_id',this.groupId).order('last_seen',{ascending:false}));}
  async getNotes(){return unwrap(await this.client.from('study_notes').select('*').eq('group_id',this.groupId).order('updated_at',{ascending:false}));}
  async saveWord(row,id){const table=this.client.from('study_words');if(id)return unwrap(await table.update({...row,updated_at:new Date().toISOString()}).eq('id',id).eq('group_id',this.groupId).select().single());return unwrap(await table.insert({...row,group_id:this.groupId}).select().single());}
  async deleteWord(id){unwrap(await this.client.from('study_words').delete().eq('id',id).eq('group_id',this.groupId).select('id').single());}
  async savePattern(row,id){const table=this.client.from('study_patterns');if(id)return unwrap(await table.update({...row,updated_at:new Date().toISOString()}).eq('id',id).eq('group_id',this.groupId).select().single());return unwrap(await table.insert({...row,group_id:this.groupId}).select().single());}
  async deletePattern(id){unwrap(await this.client.from('study_patterns').delete().eq('id',id).eq('group_id',this.groupId).select('id').single());}
  async recordAnswer(row){unwrap(await this.client.rpc('record_study_answer',{
    p_group_id:this.groupId,p_kind:row.kind,p_item_id:row.item_id,p_mode:row.mode,
    p_prompt:row.prompt,p_expected:row.expected,p_given:row.given,p_correct:row.correct,
    p_display_text:row.display_text,p_reading:row.reading,p_meaning:row.meaning
  }));}
  async saveMistakeMemo(id,memo){unwrap(await this.client.from('study_mistakes').update({memo}).eq('id',id).eq('group_id',this.groupId).eq('user_id',this.user.id).select().single());}
  async deleteMistakes(ids){const deleted=unwrap(await this.client.from('study_mistakes').delete().in('id',ids).eq('group_id',this.groupId).eq('user_id',this.user.id).select('id'));if(deleted.length!==ids.length)throw Error('일부 오답을 삭제하지 못했습니다. 새로고침 후 다시 시도해 주세요.');}
  async saveNote(row,id){const table=this.client.from('study_notes');if(id)return unwrap(await table.update({...row,updated_at:new Date().toISOString()}).eq('id',id).eq('group_id',this.groupId).eq('user_id',this.user.id).select().single());return unwrap(await table.insert({...row,group_id:this.groupId}).select().single());}
  async deleteNote(id){unwrap(await this.client.from('study_notes').delete().eq('id',id).eq('group_id',this.groupId).eq('user_id',this.user.id).select('id').single());}
}

const state = {
  demo:false,client:null,store:null,user:null,groups:[],group:null,
  words:[],patterns:[],attempts:[],mistakes:[],notes:[],
  view:'home',wordSearch:'',patternSearch:'',wordPos:'전체',
  wordEditId:null,patternEditId:null,noteEditId:null,
  lookup:[],lookupLoading:false,lookupStatus:'',quiz:null,
  wrongOnly:false,historyFilter:'전체',mistakeSelected:new Set(),pendingDelete:null,
  loading:false,realtime:null,roomVersion:0
};
let toastTimer;
function toast(message,error=false){const el=$('#toast');el.textContent=message;el.className=`toast visible${error?' error':''}`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),5000);}
async function run(action,success){try{state.loading=true;return await action();}catch(e){console.error(e);toast(`${success||'처리'} 실패: ${asText(e)}`,true);return null;}finally{state.loading=false;}}
const heading = (title,sub,action='')=>`<div class="page-title"><div><p class="eyebrow">ONIGIRI STUDY ROOM</p><h1>${title}</h1><p class="intro">${sub}</p></div>${action}</div>`;
const empty = (text)=>`<div class="empty"><div class="emoji">🍙</div>${escapeHTML(text)}</div>`;
const button = (action,label,cls='outline',attrs='')=>`<button type="button" class="btn ${cls}" data-action="${action}" ${attrs}>${label}</button>`;

function render(){const app=$('#app');if(!state.store){app.innerHTML=renderAuth();return;}if(!state.group){app.innerHTML=renderRoomSelect();return;}
  app.innerHTML=`<div class="workspace"><aside class="sidebar"><a href="#" class="brand" data-action="navigate" data-view="home">${onigiri()}<div><div class="brand-word">おにぎり</div><div class="brand-sub">NIHONGO STUDY</div></div></a>
  <nav class="nav" aria-label="주요 메뉴">${[['home','home','대시보드'],['words','book','공통 단어장'],['patterns','text','공통 문형집'],['quiz','quiz','단어·문형 테스트'],['history','text','내 학습 기록'],['mistakes','alert','내 오답노트'],['notes','note','내 학습 메모'],['guide','help','학습 가이드']].map(([id,ico,label])=>`<button type="button" class="nav-item ${state.view===id?'active':''}" data-action="navigate" data-view="${id}" ${state.view===id?'aria-current="page"':''}>${icon(ico)}<span>${label}</span></button>`).join('')}</nav>
  <div class="side-bottom"><b>🍙 함께 쌓는 일본어 실력</b><p>공통 자료는 함께 편집하고,<br>오답과 메모는 나만의 공간에.</p></div></aside>
  <main class="main"><header class="topbar"><div class="breadcrumb">오니기리 스터디 &nbsp; / &nbsp; ${escapeHTML(state.group.name)}</div><div class="top-actions"><span class="pill">${state.demo?'체험 모드':'🔒 개인 기록 보호'}</span><span class="email">${escapeHTML(state.user?.email||'')}</span>${button('refresh',icon('refresh',14)+' 새로고침','ghost')}${button('switch-room','스터디룸','outline small')}${state.demo?'':button('logout','로그아웃','ghost small')}</div></header>
  <div id="page">${pageContent()}</div><footer class="main-footer">© 오니기리 일본어 스터디 · 공동 편집, 개인별 복습 · 무료 개인 스터디 프로젝트</footer></main></div>${state.pendingDelete?renderDeleteModal():''}`;
}
function pageContent(){switch(state.view){case 'home':return renderHome();case 'words':return renderWords();case 'patterns':return renderPatterns();case 'quiz':return renderQuiz();case 'history':return renderHistory();case 'mistakes':return renderMistakes();case 'notes':return renderNotes();default:return renderGuide();}}
function renderAuth(){return `<div class="centered-page"><div class="auth-panel">${onigiri()}<p class="eyebrow" style="text-align:center">LEARN JAPANESE TOGETHER</p><h1>오니기리 일본어 스터디</h1><p class="intro">단어와 문형은 함께, 복습 기록은 나만의 것.</p>${CONFIGURED?`<form id="login-form" class="stack"><div><label for="login-email">이메일로 로그인</label><input id="login-email" name="email" type="email" required placeholder="study@example.com" autocomplete="email" /></div><button class="btn primary" type="submit">이메일 로그인 링크 받기 ${icon('arrow',15)}</button><p class="small-note">로그인 링크가 이메일로 발송됩니다. 이메일을 열어 로그인한 뒤 스터디룸에 입장하세요. 처음 로그인해도 초대코드 없이는 다른 스터디룸을 볼 수 없습니다.</p></form>`:`<div class="info warning">아직 Supabase 주소와 공개 키가 입력되지 않았습니다. 함께 편집하는 온라인 학습실을 사용하려면 <b>config.js</b> 설정이 필요합니다.</div><div style="height:14px"></div><button class="btn primary" data-action="demo-start" type="button" style="width:100%">🍙 체험 학습실 열기</button><p class="small-note" style="margin-top:10px">체험 모드는 이 브라우저에만 저장됩니다. 다른 사람과 공유되지 않습니다.</p><div class="top-divider"></div><p class="small-note">설정은 동봉된 README.md와 supabase-schema.sql을 참고하세요.</p>`}</div></div>`;}
function renderRoomSelect(){return `<div class="centered-page"><div class="auth-panel">${onigiri()}<h1>어느 학습실로 갈까요?</h1><p class="intro">스터디룸을 새로 만들거나 받은 초대코드로 참여할 수 있어요.</p>${state.groups.length?`<h3 style="margin:25px 0 10px">내 스터디룸</h3>${state.groups.map(g=>`<div class="room-card"><div><b>${escapeHTML(g.name)}</b><p class="muted tiny">공통 자료 · 개인별 기록</p></div>${button('enter-room','입장','primary small',`data-id="${escapeAttr(g.id)}"`)}</div>`).join('')}`:''}
  ${state.demo?`<div class="top-divider"></div><p class="small-note">체험 모드에서는 위의 학습실만 사용할 수 있어요.</p>${button('demo-exit','체험 종료','outline')}`:`<div class="top-divider"></div><div class="stack"><form id="create-room-form"><label>새 스터디룸 이름</label><div class="searchbar"><input name="room_name" maxlength="80" placeholder="예: 일본어 무작정 따라하기 모임" required/> <button type="submit" class="btn primary">만들기</button></div></form><form id="join-room-form"><label>친구에게 받은 초대코드</label><div class="searchbar"><input name="code" maxlength="50" placeholder="16자리 초대코드" required/> <button type="submit" class="btn secondary">참여하기</button></div></form>${button('logout','로그아웃','ghost')}</div>`}</div></div>`;}
function renderHome(){const attempts=state.attempts;const accuracy=attempts.length?Math.round(attempts.filter(x=>x.correct).length/attempts.length*100):0;
  return `<section class="hero"><div><p class="eyebrow">OH, MY ONIGIRI!</p><h1>오늘도 일본어 한 입 🍙</h1><p>친구들과 만든 단어장을 꺼내<br>나만의 속도로 차근차근 복습해요.</p><div class="action-row" style="margin-top:22px">${button('navigate','복습 시작 '+icon('arrow',16),'primary','data-view="quiz"')}${button('navigate','공통 단어장 보기','outline','data-view="words"')}</div></div>${onigiri()}</section>
  ${state.demo?`<div class="info warning" style="margin-bottom:20px">현재 체험 모드입니다. 공통 편집·로그인·다른 기기와 연동하려면 Supabase 연결과 GitHub Pages 배포가 필요합니다.</div>`:''}
  <div class="grid-3"><div class="stat"><div class="muted">공통 단어</div><div class="value mono">${state.words.length}</div><div class="muted">함께 모은 단어</div></div><div class="stat"><div class="muted">공통 문형</div><div class="value mono">${state.patterns.length}</div><div class="muted">함께 만든 문장</div></div><div class="stat"><div class="muted">내 정답률</div><div class="value mono">${accuracy}%</div><div class="muted">최근 ${attempts.length}문제 기준</div></div></div>
  <div class="grid section-gap"><div class="card"><h3>📖 나의 복습 현황</h3><div class="item"><span>내 오답노트</span><b>${state.mistakes.length}개</b></div><div class="item" style="margin-top:10px"><span>내 학습 메모</span><b>${state.notes.length}개</b></div><div class="action-row" style="margin-top:15px">${button('navigate','오답 집중 복습','secondary','data-view="mistakes"')}${button('navigate','내 학습 기록','outline','data-view="history"')}</div></div><div class="card orange"><h3>👥 스터디룸 공유</h3><p class="small-note">같은 스터디룸에 참여한 사람들은 공통 단어와 문형을 모두 등록·수정·삭제할 수 있습니다.</p><p class="small-note" style="margin-top:13px">초대코드 (스터디원에게만 공유하세요)</p><div class="code-box" style="margin:8px 0 12px">${escapeHTML(state.group.invite_code)}</div>${state.demo?'':button('copy-code','초대코드 복사','outline small')}</div></div>`;}
function renderWords(){const filter=state.wordSearch.toLocaleLowerCase();const shown=state.words.filter(w=>(state.wordPos==='전체'||w.pos===state.wordPos)&&[w.kanji,w.kana,w.meaning].join(' ').toLocaleLowerCase().includes(filter));const edit=state.words.find(x=>x.id===state.wordEditId);
  return `${heading('공통 단어장','모든 스터디원이 함께 등록·수정·삭제할 수 있습니다.',button('refresh',icon('refresh',15)+' 최신 내용 가져오기','outline small'))}<div class="split"><div class="stack"><div class="card tint"><div class="form-title"><h3>🔎 뜻으로 일본어 찾기</h3></div><form id="lookup-form"><label>한국어 뜻</label><div class="searchbar"><input name="query" placeholder="예: 맛있다, 가다, 조용하다" required autocomplete="off"/><button class="btn primary" type="submit">찾기</button></div></form><p class="small-note">내장 어휘와 현재 공통 단어장부터 검색합니다. 결과가 없으면 무료 온라인 번역을 시도합니다.</p>${state.lookupStatus?`<div class="info" style="margin-top:12px">${escapeHTML(state.lookupStatus)}</div>`:''}${state.lookupLoading?'<p class="small-note">검색 중…</p>':''}<div class="lookup-list">${state.lookup.map((w,i)=>`<div class="lookup-item"><div><strong class="jp">${escapeHTML(w.kanji)}</strong> <span class="muted jp">${escapeHTML(w.kana||'읽기 미확인')}</span><div class="small-note">${escapeHTML(w.meaning)} · ${escapeHTML(w.pos)} · ${escapeHTML(w.source)}</div></div><div class="action-row">${button('speak','🔊','ghost small',`data-text="${escapeAttr(w.kanji)}"`)}${button('lookup-save','적용·바로저장','secondary small',`data-idx="${i}"`)}</div></div>`).join('')}</div></div>
  <div class="card" id="word-editor"><div class="form-title"><h3>${edit?'✏️ 단어 수정 중':'➕ 단어 직접 등록'}</h3>${edit?button('word-cancel','수정 취소','ghost small'):''}</div><form id="word-form" class="stack"><div class="field-grid"><div><label>한자·일본어 표기 *</label><input name="kanji" maxlength="300" value="${escapeAttr(edit?.kanji||'')}" required placeholder="美味しい"/></div><div><label>히라가나·가타카나 (없어도 저장 가능)</label><input name="kana" maxlength="500" value="${escapeAttr(edit?.kana||'')}" placeholder="おいしい"/></div><div><label>한글 뜻 *</label><input name="meaning" maxlength="500" value="${escapeAttr(edit?.meaning||'')}" required placeholder="맛있다"/></div><div><label>품사</label><select name="pos">${['명사','い형용사','な형용사','동사','부사','기타'].map(x=>`<option ${x===(edit?.pos||'명사')?'selected':''}>${x}</option>`).join('')}</select></div></div><button class="btn primary" type="submit">${edit?'수정 저장 ✓':'공통 단어장에 저장 ✓'}</button><p class="small-note">${edit?'현재 단어를 갱신합니다. 모든 스터디원에게 반영됩니다.':'검색 결과의 「적용·바로저장」을 누르면 별도 확인 없이 저장됩니다.'}</p></form></div></div>
  <div class="card"><div class="form-title"><div><h3>📗 함께 모은 단어 <span class="tag">${state.words.length}개</span></h3><p class="section-sub">단어를 바꾸면 친구들의 화면에서도 갱신됩니다.</p></div></div><div class="filter-row"><input id="word-filter" aria-label="단어 필터" placeholder="한자·발음·뜻으로 목록 검색" value="${escapeAttr(state.wordSearch)}" style="flex:1;min-width:180px"/><select id="word-pos-filter" class="select-compact" aria-label="품사별 보기">${['전체','명사','い형용사','な형용사','동사','부사','기타'].map(x=>`<option ${x===state.wordPos?'selected':''}>${x}</option>`).join('')}</select></div><div class="row-list" id="word-items">${shown.length?shown.map(w=>`<div class="item"><div class="item-main"><strong class="jp">${escapeHTML(w.kanji)}</strong><span class="kana">${escapeHTML(w.kana||'발음 미입력')}</span><span class="tag">${escapeHTML(w.pos||'기타')}</span><div class="meaning">${escapeHTML(w.meaning)}</div></div><div class="item-actions">${button('speak',icon('sound',16),'ghost small',`title="발음 듣기" data-text="${escapeAttr(w.kanji)}"`)}${button('word-edit','수정','outline small',`data-id="${escapeAttr(w.id)}"`)}${button('delete-request','삭제','ghost small',`data-kind="word" data-id="${escapeAttr(w.id)}"`)}</div></div>`).join(''):empty('조건에 맞는 단어가 아직 없어요.')}</div></div></div>`;
}
function renderPatterns(){const shown=state.patterns.filter(w=>[w.japanese,w.reading,w.meaning,w.grammar].join(' ').toLocaleLowerCase().includes(state.patternSearch.toLocaleLowerCase()));const edit=state.patterns.find(x=>x.id===state.patternEditId);
  return `${heading('공통 문형집','い형용사 · な형용사 · 동사 활용을 예문으로 익혀요.',button('refresh','↻ 최신 문형','outline small'))}<div class="split"><div class="card" id="pattern-editor"><div class="form-title"><h3>${edit?'✏️ 문형 수정 중':'➕ 문형 등록'}</h3>${edit?button('pattern-cancel','수정 취소','ghost small'):''}</div><form id="pattern-form" class="stack"><div><label>일본어 문장 *</label><textarea name="japanese" maxlength="1000" required placeholder="これは おいしくないです。">${escapeHTML(edit?.japanese||'')}</textarea></div><div><label>히라가나 읽기</label><textarea name="reading" maxlength="1200" placeholder="これは おいしくないです。">${escapeHTML(edit?.reading||'')}</textarea></div><div><label>한글 뜻 *</label><textarea name="meaning" maxlength="1200" required placeholder="이것은 맛있지 않아요.">${escapeHTML(edit?.meaning||'')}</textarea></div><div><label>문법 구분</label><select name="grammar">${['い형용사','な형용사','동사','명사','기타'].map(x=>`<option ${x===(edit?.grammar||'い형용사')?'selected':''}>${x}</option>`).join('')}</select></div><button class="btn primary" type="submit">${edit?'수정 저장 ✓':'공통 문형집에 저장 ✓'}</button><p class="small-note">스크램블 문제는 띄어쓰기를 기준으로 문장 조각을 만듭니다. 「これは おいしくないです」처럼 단어 사이를 띄어 입력하면 더 좋습니다.</p></form></div>
  <div class="card"><h3>📙 문형 <span class="tag">${state.patterns.length}개</span></h3><div class="searchbar"><input id="pattern-filter" placeholder="일본어 또는 한글 뜻으로 검색" value="${escapeAttr(state.patternSearch)}" /></div><div class="row-list" id="pattern-items">${shown.length?shown.map(w=>`<div class="item"><div class="item-main"><strong class="jp">${escapeHTML(w.japanese)}</strong><div class="meaning jp">${escapeHTML(w.reading||'')}</div><div class="meaning">${escapeHTML(w.meaning)} <span class="tag">${escapeHTML(w.grammar||'기타')}</span></div></div><div class="item-actions">${button('speak',icon('sound',16),'ghost small',`data-text="${escapeAttr(w.japanese)}"`)}${button('pattern-edit','수정','outline small',`data-id="${escapeAttr(w.id)}"`)}${button('delete-request','삭제','ghost small',`data-kind="pattern" data-id="${escapeAttr(w.id)}"`)}</div></div>`).join(''):empty('문형을 함께 등록해 주세요.')}</div></div></div>`;
}

function modeName(value){return ({'word-reading':'한자 → 히라가나','word-meaning':'한자+히라가나 → 한국어','meaning-reading':'한국어 → 히라가나','pattern-gap':'일본어 빈칸 완성','pattern-ko':'한국어 뜻 빈칸','pattern-scramble':'문장 순서 맞히기'})[value]||value;}
function shuf(values){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const distractors = {
  'word-reading':['たべる','よむ','いく','のむ','たかい','ひくい','むずかしい','やさしい','おもしろい','べんり','しずか','きれい'],
  'word-meaning':['먹다','가다','마시다','보다','읽다','재미있다','조용하다','편리하다','어렵다','따뜻하다','춥다','비싸다'],
  'meaning-reading':['たべる','よむ','いく','のむ','たかい','むずかしい','やさしい','おもしろい','べんり','しずか'],
  'pattern-gap':['です。','ではありません。','ません。','ました。','くないです。','でした。','じゃないです。','ます。','でした','です'],
  'pattern-ko':['먹어요.','가지 않아요.','맛있지 않아요.','조용해요.','예뻐요.','춥지 않아요.','읽어요.','즐거웠어요.']
};
function uniqueOptions(correct, candidates, fallbacks=[]){const c=String(correct);let pool=Array.from(new Set([...candidates,...fallbacks].map(x=>String(x||'').trim()).filter(x=>x && normalize(x)!==normalize(c))));pool=shuf(pool);let options=[c,...pool.slice(0,3)];let i=1;while(options.length<4){const alt=`다른 표현 ${i++}`;if(!options.includes(alt))options.push(alt);}return shuf(options);}
function patternTokens(str){const raw=String(str).trim().split(/\s+/).filter(Boolean);if(raw.length>=2)return raw;const chars=Array.from(String(str).trim());if(chars.length<=2)return [String(str).trim()];const size=Math.ceil(chars.length/3);const pieces=[];for(let i=0;i<chars.length;i+=size)pieces.push(chars.slice(i,i+size).join(''));return pieces;}
function patternGap(row){const tokens=patternTokens(row.japanese);const index=tokens.length-1;return {prefix:tokens.map((x,i)=>i===index?'＿＿＿':x).join(' '),answer:tokens[index],other:state.patterns.filter(p=>p.id!==row.id).map(p=>patternTokens(p.japanese).slice(-1)[0])};}
function koGap(row){const tokens=String(row.meaning).trim().split(/\s+/);if(tokens.length>=2){return {prefix:[...tokens.slice(0,-1),'＿＿＿'].join(' '),answer:tokens.at(-1),other:state.patterns.filter(p=>p.id!==row.id).map(p=>p.meaning.trim().split(/\s+/).at(-1))};}return {prefix:'＿＿＿',answer:row.meaning,other:state.patterns.filter(p=>p.id!==row.id).map(p=>p.meaning)};}
function buildQuestions(kind,mode,wrongOnly){const all=kind==='word'?state.words:state.patterns;let rows=all;
  if(wrongOnly){const ids=new Set(state.mistakes.filter(m=>m.kind===kind).map(m=>m.item_id));rows=rows.filter(x=>ids.has(x.id));}
  return shuf(rows).slice(0,Math.min(rows.length,10)).map(row=>{
    let question={},other=[],prefix='',answer='',options=[];
    if(mode==='word-reading'){prefix=row.kanji;answer=row.kana||row.kanji;other=all.filter(x=>x.id!==row.id).map(x=>x.kana||x.kanji);}
    else if(mode==='word-meaning'){prefix=row.kanji;answer=row.meaning;other=all.filter(x=>x.id!==row.id).map(x=>x.meaning);}
    else if(mode==='meaning-reading'){prefix=row.meaning;answer=row.kana||row.kanji;other=all.filter(x=>x.id!==row.id).map(x=>x.kana||x.kanji);}
    else if(mode==='pattern-gap'){const g=patternGap(row);prefix=g.prefix;answer=g.answer;other=g.other;}
    else if(mode==='pattern-ko'){const g=koGap(row);prefix=g.prefix;answer=g.answer;other=g.other;}
    else {prefix=row.meaning;answer=row.japanese;}
    if(mode!=='pattern-scramble')options=uniqueOptions(answer,other,distractors[mode]);
    question={kind,row,mode,prefix,answer,options,selected:null,checked:false,isCorrect:false};
    if(mode==='pattern-scramble') {question.tokens=patternTokens(row.japanese);question.tiles=shuf(question.tokens.map((label,id)=>({label,id})));question.picked=[];}
    return question;
  });
}
function renderQuiz(){const q=state.quiz;
  if(!q)return `${heading('단어·문형 테스트','공통 학습 자료로 문제를 풀고 결과는 내 계정에만 저장합니다.')}<div class="grid"><div class="card"><h3>🍙 오늘의 퀴즈 설정</h3><form id="quiz-start-form" class="stack"><div class="quiz-settings"><div><label>학습 대상</label><select id="quiz-kind" name="kind"><option value="word">단어 테스트</option><option value="pattern">문형 테스트</option></select></div><div><label>문제 유형</label><select id="quiz-mode" name="mode">${renderQuizModes('word')}</select></div></div><label><input type="checkbox" name="wrongOnly" class="checkbox" style="width:auto"/> 내 오답에 등록된 항목만 집중 복습</label><p class="small-note">한 세트는 최대 10문제입니다. 오답은 자동 기록되며, 본인만 볼 수 있습니다.</p><button type="submit" class="btn primary">테스트 시작 ${icon('arrow',15)}</button></form></div><div class="card tint"><h3>📝 테스트 종류</h3><div class="stack small-note"><p><b>단어:</b> 한자→발음 / 한자+발음→한국어 / 한국어→발음을 4지선다로 연습합니다.</p><p><b>문형:</b> 일본어 빈칸 / 한국어 뜻 빈칸 / 일본어 문장 순서 배열을 연습합니다.</p><p><b>개인 학습:</b> 내 정답률, 오답 기록, 나만의 오답 메모로 약한 부분을 관리합니다.</p></div></div></div>`;
  if(q.index>=q.questions.length){const score=q.score;return `${heading('테스트 완료','오니기리 한 개 더 먹을 만큼 수고했어요!')}<div class="card" style="max-width:650px;margin:auto;text-align:center"><div style="font-size:54px">🍙</div><h2>오늘도 공부 완료!</h2><div class="text-hero">${score} / ${q.questions.length}</div><p class="intro">정답률 ${Math.round(score/q.questions.length*100)}% · 틀린 문제는 내 오답노트에 저장되었습니다.</p><div class="action-row" style="justify-content:center;margin-top:20px">${button('quiz-restart','다른 문제 풀기','primary')}${button('navigate','내 오답노트','outline','data-view="mistakes"')}</div></div>`;}
  const x=q.questions[q.index];const isKo=x.mode==='pattern-ko';const isScramble=x.mode==='pattern-scramble';const title=`${modeName(x.mode)} · ${q.index+1}/${q.questions.length}`;
  return `${heading('🍙 한 입 테스트',title,button('quiz-restart','테스트 종료','ghost small'))}<div class="card" style="max-width:790px;margin:auto"><div class="action-row" style="justify-content:space-between"><span class="tag">${x.kind==='word'?'단어':'문형'} · ${modeName(x.mode)}</span><span class="muted small">정답 ${q.score}개</span></div><div class="progress"><div style="width:${q.index/q.questions.length*100}%"></div></div><p class="muted small" style="text-align:center">${({ 'word-reading':'다음 일본어의 발음을 고르세요.','word-meaning':'다음 일본어의 뜻을 고르세요.','meaning-reading':'다음 한국어에 맞는 일본어 발음을 고르세요.','pattern-gap':'빈칸에 들어갈 일본어 표현을 고르세요.','pattern-ko':'빈칸에 들어갈 한국어 표현을 고르세요.','pattern-scramble':'문장을 올바른 일본어 순서로 배열해 보세요.'})[x.mode]}</p><div class="text-hero ${x.kind==='pattern'?'jp':''}" style="overflow-wrap:anywhere">${escapeHTML(x.prefix)}</div>
  ${x.mode==='word-meaning'?`<div class="reading jp">${escapeHTML(x.row.kana||'발음 미입력')}</div>`:''}
  ${x.kind==='pattern'?`<div class="reading jp">${escapeHTML(x.row.reading||'')} ${isKo?`<button class="btn ghost small" data-action="speak" data-text="${escapeAttr(x.row.japanese)}">${icon('sound',16)} 듣기</button>`:''}</div>`:''}
  ${isScramble?`<div><label>내가 배열한 문장 (선택한 조각은 다시 누르면 취소)</label><div class="build-line tile-wrap">${x.picked.length?x.picked.map((id,idx)=>{const t=x.tiles.find(t=>t.id===id);return `<button type="button" class="tile chosen" data-action="quiz-unpick" data-id="${id}" ${x.checked?'disabled':''}>${idx+1}. ${escapeHTML(t?.label||'')}</button>`;}).join(''):'<span class="muted small">아래 단어를 순서대로 누르세요</span>'}</div><label>남은 조각</label><div class="tile-wrap">${x.tiles.filter(t=>!x.picked.includes(t.id)).map(t=>`<button type="button" class="tile" data-action="quiz-pick" data-id="${t.id}" ${x.checked?'disabled':''}>${escapeHTML(t.label)}</button>`).join('')}</div></div>`:
  `<div class="quiz-options">${x.options.map((opt,i)=>`<button type="button" data-action="quiz-select" data-idx="${i}" class="quiz-option ${x.selected===i?'selected':''} ${x.checked?(normalize(opt)===normalize(x.answer)?'correct':x.selected===i?'wrong':''):''}" ${x.checked?'disabled':''}><span class="muted">${i+1}.</span> ${escapeHTML(opt)}</button>`).join('')}</div>`}
  ${x.checked?`<div class="quiz-feedback ${x.isCorrect?'':'bad'}"><b>${x.isCorrect?'정답입니다! 🎉':'조금 아쉬워요. 다시 기억해 봐요.'}</b><p class="small">정답: <span class="jp">${escapeHTML(x.answer)}</span></p>${x.kind==='pattern'?`<p class="small">${escapeHTML(x.row.japanese)} — ${escapeHTML(x.row.meaning)}</p>`:''}</div>`:''}
  <div class="action-row" style="justify-content:space-between;margin-top:20px">${button('speak',icon('sound',16)+' 원어 발음 듣기','outline small',`data-text="${escapeAttr(x.kind==='word'?x.row.kanji:x.row.japanese)}"`)}${x.checked?button('quiz-next','다음 문제 '+icon('arrow',16),'primary'):button('quiz-check','정답 확인','primary',`${isScramble?(!x.picked.length?'disabled':''):x.selected===null?'disabled':''}`)}</div></div>`;
}
function renderQuizModes(kind){return (kind==='word'?[['word-reading','한자 → 히라가나'],['word-meaning','한자 + 히라가나 → 한국어'],['meaning-reading','한국어 → 히라가나']]:[['pattern-gap','일본어 문장 빈칸'],['pattern-ko','한국어 뜻 빈칸'],['pattern-scramble','문장 스크램블']]).map(([id,txt])=>`<option value="${id}">${txt}</option>`).join('');}
function renderHistory(){
  const attempts=state.attempts.filter(a=>state.historyFilter==='전체'||a.kind===state.historyFilter);
  const all=state.attempts;
  const ok=all.filter(a=>a.correct).length;
  const count=all.length;
  const d=new Date();const today=all.filter(a=>new Date(a.created_at).toDateString()===d.toDateString()).length;
  return `${heading('나만의 학습 기록','퀴즈 결과는 내 계정에만 쌓입니다. 다른 스터디원은 볼 수 없어요.')}
  <div class="grid-3"><div class="stat"><div class="muted">누적 풀이</div><div class="value mono">${count}</div><div class="muted">최근 최대 1,000건</div></div><div class="stat"><div class="muted">전체 정답률</div><div class="value mono">${count?Math.round(ok/count*100):0}%</div><div class="muted">정답 ${ok}개</div></div><div class="stat"><div class="muted">오늘 푼 문제</div><div class="value mono">${today}</div><div class="muted">내 학습 현황</div></div></div>
  <div class="card section-gap"><div class="form-title"><h3>최근 풀이 내역</h3><select id="history-filter" class="select-compact"><option value="전체" ${state.historyFilter==='전체'?'selected':''}>전체</option><option value="word" ${state.historyFilter==='word'?'selected':''}>단어</option><option value="pattern" ${state.historyFilter==='pattern'?'selected':''}>문형</option></select></div><div class="row-list">${attempts.length?attempts.map(a=>{
    const item=(a.kind==='word'?state.words:state.patterns).find(x=>x.id===a.item_id);
    const label=item?(a.kind==='word'?item.kanji:item.japanese):'삭제된 공통 자료';
    return `<div class="item"><div class="item-main"><b class="jp">${escapeHTML(label)}</b> <span class="tag">${escapeHTML(modeName(a.mode))}</span><div class="meaning">${safeDate(a.created_at)} · ${a.kind==='word'?'단어':'문형'} 문제</div></div><span class="tag" style="${a.correct?'':'background:#ffefee;color:#aa4b4b'}">${a.correct?'✓ 정답':'× 오답'}</span></div>`;
  }).join(''):empty('아직 풀이 기록이 없습니다. 테스트부터 시작해 보세요.')}</div></div>`;
}
function renderMistakes(){const selected=state.mistakeSelected;const mistakes=state.mistakes;return `${heading('나만의 오답노트','내 계정에만 저장되는 약점 복습 공간입니다.',button('navigate','오답만 다시 풀기','secondary small','data-view="quiz"'))}<div class="card"><div class="form-title"><div><h3>❗ 누적 오답 <span class="tag">${mistakes.length}개</span></h3><p class="section-sub">같은 유형을 다시 틀리면 횟수가 누적됩니다. 메모는 오답 기록과 함께 보존됩니다.</p></div></div><div class="filter-row"><label style="margin:0"><input type="checkbox" id="mistakes-select-all" class="checkbox" ${mistakes.length>0&&selected.size===mistakes.length?'checked':''}/> 전체 선택</label>${button('mistakes-delete','선택 삭제','danger small',`${selected.size?'':'disabled'}`)}<span class="muted tiny">${selected.size}개 선택</span></div>${mistakes.length?mistakes.map(m=>`<div class="mistake-item"><div class="mistake-head"><div class="action-row"><input type="checkbox" class="checkbox mistake-check" aria-label="오답 선택" data-id="${escapeAttr(m.id)}" ${selected.has(m.id)?'checked':''}/><span class="tag">${m.kind==='word'?'단어':'문형'} · ${escapeHTML(modeName(m.mode))}</span><span class="tag">오답 ${m.wrong_count||1}회</span></div>${button('mistake-delete-one','삭제','ghost small',`data-id="${escapeAttr(m.id)}"`)}</div><p class="jp" style="font-weight:800;font-size:18px;margin:11px 0 2px">${escapeHTML(m.display_text||m.prompt)}</p><p class="muted tiny jp">${escapeHTML(m.reading||'')}</p><p class="small">${escapeHTML(m.meaning||'')}</p><div class="grid" style="gap:6px;margin-top:11px"><div class="err">내 답: ${escapeHTML(m.given)}</div><div class="ok">정답: ${escapeHTML(m.expected)}</div></div><div class="small-note" style="margin-top:7px">마지막 오답: ${safeDate(m.last_seen)}</div><label style="margin-top:12px" for="memo-${escapeAttr(m.id)}">내가 헷갈린 이유 / 기억할 팁</label><textarea id="memo-${escapeAttr(m.id)}" maxlength="20000" placeholder="예: な형용사의 명사 수식에서 な를 빼먹음…">${escapeHTML(m.memo||'')}</textarea><div class="action-row">${button('mistake-memo-save','메모 저장','secondary small',`data-id="${escapeAttr(m.id)}"`)}</div></div>`).join(''):empty('아직 틀린 문제가 없어요. 퀴즈를 풀어 보세요!')}</div>`;}
function renderNotes(){const edit=state.notes.find(n=>n.id===state.noteEditId);return `${heading('나만의 학습 메모','내 계정에만 보관되는 작은 일본어 공부 노트.')}<div class="split"><div class="card" id="note-editor"><div class="form-title"><h3>${edit?'✏️ 메모 수정':'🖊️ 새 학습 메모'}</h3>${edit?button('note-cancel','취소','ghost small'):''}</div><form id="note-form" class="stack"><div><label>메모 제목 *</label><input maxlength="200" name="title" required value="${escapeAttr(edit?.title||'')}" placeholder="예: い형용사 부정형"/></div><div><label>복습 메모</label><textarea maxlength="20000" name="body" style="min-height:170px" placeholder="배운 규칙, 헷갈린 부분, 나만의 암기법…">${escapeHTML(edit?.body||'')}</textarea></div><button class="btn primary" type="submit">${edit?'메모 수정 저장 ✓':'내 메모에 저장 ✓'}</button></form></div><div class="card"><h3>📔 내 메모 모음 <span class="tag">${state.notes.length}개</span></h3><div class="stack">${state.notes.length?state.notes.map(n=>`<div class="item"><div class="item-main"><strong>${escapeHTML(n.title)}</strong><p class="meaning" style="white-space:pre-wrap">${escapeHTML(n.body)}</p><p class="tiny muted" style="margin-top:7px">${safeDate(n.updated_at)}</p></div><div class="item-actions">${button('note-edit','수정','outline small',`data-id="${escapeAttr(n.id)}"`)}${button('delete-request','삭제','ghost small',`data-kind="note" data-id="${escapeAttr(n.id)}"`)}</div></div>`).join(''):empty('아직 작성한 메모가 없어요.')}</div><div class="top-divider"></div><h3>❗ 오답 메모 바로 보기</h3><div class="stack" style="margin-top:10px">${state.mistakes.filter(m=>m.memo?.trim()).length?state.mistakes.filter(m=>m.memo?.trim()).map(m=>`<div class="item"><div class="item-main"><strong class="jp">${escapeHTML(m.display_text)}</strong><p class="meaning" style="white-space:pre-wrap">${escapeHTML(m.memo)}</p></div>${button('navigate','오답 보기','outline small','data-view="mistakes"')}</div>`).join(''):empty('작성된 오답 메모가 없습니다.')}</div></div></div>`;}
function renderGuide(){return `${heading('학습 가이드','내 실력과 스터디 모임을 위한 사용 안내')}<div class="grid"><div class="card"><h3>🍙 い형용사</h3><div class="stack"><p><b>명사 수식</b> 美味しい りんご — 맛있는 사과</p><p><b>반말 긍정</b> 美味しい — 맛있다</p><p><b>높임말 긍정</b> 美味しいです — 맛있어요</p><p><b>반말 부정</b> 美味しくない — 맛있지 않아</p><p><b>높임말 부정</b> 美味しくないです — 맛있지 않아요</p></div></div><div class="card"><h3>🍙 な형용사</h3><div class="stack"><p><b>명사 수식</b> 静かな 部屋 — 조용한 방</p><p><b>반말 긍정</b> 静かだ — 조용하다</p><p><b>높임말 긍정</b> 静かです — 조용해요</p><p><b>반말 부정</b> 静かじゃない — 조용하지 않아</p><p><b>높임말 부정</b> 静かじゃないです — 조용하지 않아요</p></div></div><div class="card"><h3>🍙 동사 (기초)</h3><div class="stack"><p><b>사전형</b> 食べる — 먹다</p><p><b>ます형</b> 食べます — 먹습니다</p><p><b>부정형</b> 食べない — 먹지 않는다</p><p><b>정중 부정형</b> 食べません — 먹지 않습니다</p><p><b>과거형</b> 食べた — 먹었다</p></div></div><div class="card"><h3>🔐 함께 공부하는 방식</h3><div class="stack small-note"><p>• 스터디룸 초대코드를 공유하면 같은 공통 단어·문형집에 접근할 수 있습니다.</p><p>• 모든 스터디원은 공통 자료를 수정하고 삭제할 수 있으므로 신중히 편집해 주세요.</p><p>• 내 퀴즈 정답률, 오답노트, 오답 메모, 학습 메모는 다른 회원에게 공개되지 않습니다.</p><p>• 기존 개인 HTML 백업(JSON)은 자료만 선별해 공통 학습실에 추가할 수 있습니다.</p></div></div></div><div class="card section-gap"><h3>📦 데이터 백업과 이전</h3><p class="small-note">현재 스터디룸 공통 단어·문형과 내 오답·메모를 JSON으로 내려받을 수 있습니다. 기존 v4 백업은 아래 가져오기로 공통 단어·문형을 추가할 수 있습니다. 가져온 공통 자료는 스터디원 모두에게 보입니다.</p><div class="action-row" style="margin-top:14px">${button('export','JSON 백업 다운로드','secondary')}${button('import-trigger','기존 백업 가져오기','outline')}</div><input id="import-file" type="file" accept=".json,application/json" class="hide"/><p class="small-note" style="margin-top:12px">기존 백업의 개인 오답과 메모는 자동 이전하지 않습니다. 공통 자료 공유 전 개인정보 포함 여부를 확인해 주세요.</p></div>`;}
function renderDeleteModal(){const {kind,id}=state.pendingDelete;const item=kind==='word'?state.words.find(x=>x.id===id):kind==='pattern'?state.patterns.find(x=>x.id===id):state.notes.find(x=>x.id===id);const title=kind==='word'?item?.kanji:kind==='pattern'?item?.japanese:item?.title;
  return `<div class="modal-screen" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h3 id="delete-title">정말 삭제할까요?</h3><p class="small-note">${escapeHTML(title||'선택한 항목')}</p><p class="small-note" style="margin-top:10px">${kind==='note'?'이 메모는 내 계정에서만 삭제됩니다.':'공통 자료가 삭제되어 다른 스터디원에게도 보이지 않게 됩니다. 해당 항목의 기존 개인 학습 기록은 별도로 보존됩니다.'}</p><div class="action-row">${button('delete-cancel','취소','outline')}${button('delete-confirm','삭제하기','danger')}</div></div></div>`;}
// ─────────────────── 네트워크 동기화 및 화면 전환 ───────────────────
async function loadGroups(selectId){
  state.groups=await state.store.getGroups();
  const preferred=selectId||storageRead(GROUP_KEY);
  const target=state.groups.find(g=>g.id===preferred)||state.groups[0];
  if(target)await enterRoom(target); else {state.group=null;render();}
}
async function enterRoom(room){
  state.group=room;
  storageWrite(GROUP_KEY,room.id);
  state.store.setGroup?.(room.id);
  state.wordEditId=null;state.patternEditId=null;state.noteEditId=null;state.quiz=null;
  state.mistakeSelected.clear();
  state.view='home';
  await loadAll();
  subscribeRoom();
}
async function loadAll(){
  if(!state.group)return;
  const version=++state.roomVersion;
  const [words,patterns,attempts,mistakes,notes]=await Promise.all([
    state.store.getWords(),state.store.getPatterns(),state.store.getAttempts(),
    state.store.getMistakes(),state.store.getNotes()
  ]);
  if(version!==state.roomVersion)return;
  Object.assign(state,{words,patterns,attempts,mistakes,notes});
  render();
}
let changeThrottle;
function subscribeRoom(){
  if(state.realtime){state.client?.removeChannel(state.realtime);state.realtime=null;}
  if(!state.client || !state.group || state.demo)return;
  const groupId=state.group.id;
  state.realtime=state.client.channel(`onigiri-${groupId}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'study_words',filter:`group_id=eq.${groupId}`},()=>sharedChanged('words'))
    .on('postgres_changes',{event:'*',schema:'public',table:'study_patterns',filter:`group_id=eq.${groupId}`},()=>sharedChanged('patterns'))
    .subscribe();
}
function sharedChanged(kind){
  clearTimeout(changeThrottle);
  changeThrottle=setTimeout(async()=>{
    try{
      if(!state.group)return;
      if(kind==='words')state.words=await state.store.getWords();
      else state.patterns=await state.store.getPatterns();
      // 입력 중인 사용자가 작성하던 내용을 실시간 동기화가 지우지 않도록 유지합니다.
      if((state.view==='words'&&kind==='words')||(state.view==='patterns'&&kind==='patterns')){
        toast('공통 자료가 변경되었습니다. 입력을 마친 뒤 새로고침해 주세요.');
      }else render();
    }catch(e){console.error('realtime refresh',e);}
  },500);
}
async function refreshData(){try{await loadAll();toast('최신 자료를 가져왔습니다.');}catch(e){toast(`새로고침 실패: ${asText(e)}`,true);}}
function navigate(view){state.view=view;state.wordEditId=null;state.patternEditId=null;state.noteEditId=null;state.mistakeSelected.clear();render();window.scrollTo({top:0,behavior:'instant'});}
function speak(text){if(!window.speechSynthesis){toast('이 브라우저에서는 음성 합성이 지원되지 않습니다.',true);return;}
  const synth=window.speechSynthesis;try{synth.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=.85;const voices=synth.getVoices();const voice=voices.find(v=>v.lang.toLowerCase().startsWith('ja'));if(voice)u.voice=voice;synth.speak(u);}catch(e){toast('일본어 음성을 재생할 수 없습니다.',true);}
}

async function searchJapanese(term){
  const query=term.trim();state.lookupStatus='';state.lookup=[];state.lookupLoading=true;render();
  try{
    const matches=[];
    for(const w of [...state.words.map(x=>({...x,source:'공통 단어장'})),...DICTIONARY.map(x=>({...x,source:'내장 학습 사전'}))]){
      if(w.meaning.includes(query)||w.kanji.includes(query)||w.kana.includes(query)){
        if(!matches.some(x=>x.kanji===w.kanji&&x.meaning===w.meaning))matches.push(w);
      }
    }
    if(matches.length){state.lookup=matches.slice(0,12);state.lookupStatus=`${matches.length}개 학습 단어를 찾았습니다. 「적용·바로저장」을 누르면 저장됩니다.`;return;}
    if(!navigator.onLine){state.lookupStatus='인터넷 연결이 없어 온라인 검색이 불가능합니다. 직접 입력해 주세요.';return;}
    const response=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=ko%7Cja`,{signal:AbortSignal.timeout(9000)});
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    const json=await response.json();
    const raw=String(json.responseData?.translatedText||'').trim();
    const translated=new DOMParser().parseFromString(raw,'text/html').body.textContent?.trim()||'';
    if(!translated||normalize(translated)===normalize(query)||/MYMEMORY WARNING/i.test(translated))throw Error('유효한 번역 결과가 없습니다');
    const onlyKana=/^[\p{Script=Hiragana}\p{Script=Katakana}\sー・。]+$/u.test(translated);
    state.lookup=[{kanji:translated,kana:onlyKana?translated:'',meaning:query,pos:'기타',source:'MyMemory 기계번역 (읽기·품사 확인 필요)'}];
    state.lookupStatus='온라인 번역 결과입니다. 다른 의미일 수 있으니 읽기와 품사를 확인해 주세요. 결과를 저장한 뒤에도 수정할 수 있습니다.';
  }catch(e){state.lookupStatus=`온라인 검색 실패: ${asText(e)}. 일본어를 직접 입력하거나 인터넷 상태를 확인해 주세요.`;}
  finally{state.lookupLoading=false;render();}
}
async function saveWord(row,id=null){
  if(!row.kanji?.trim()||!row.meaning?.trim())throw Error('일본어 표기와 한국어 뜻을 입력해 주세요.');
  const saved=await state.store.saveWord({kanji:row.kanji.trim(),kana:(row.kana||'').trim(),meaning:row.meaning.trim(),pos:row.pos||'기타'},id);
  state.words=await state.store.getWords();state.wordSearch='';state.wordPos='전체';state.wordEditId=null;
  render();return saved;
}
async function savePattern(row,id=null){
  if(!row.japanese?.trim()||!row.meaning?.trim())throw Error('일본어 문장과 뜻을 입력해 주세요.');
  const saved=await state.store.savePattern({japanese:row.japanese.trim(),reading:(row.reading||'').trim(),meaning:row.meaning.trim(),grammar:row.grammar||'기타'},id);
  state.patterns=await state.store.getPatterns();state.patternSearch='';state.patternEditId=null;
  render();return saved;
}
async function deletePending(){
  const pending=state.pendingDelete;if(!pending)return;
  const {kind,id}=pending;
  if(kind==='word'){await state.store.deleteWord(id);state.words=await state.store.getWords();if(state.wordEditId===id)state.wordEditId=null;}
  else if(kind==='pattern'){await state.store.deletePattern(id);state.patterns=await state.store.getPatterns();if(state.patternEditId===id)state.patternEditId=null;}
  else {await state.store.deleteNote(id);state.notes=await state.store.getNotes();if(state.noteEditId===id)state.noteEditId=null;}
  state.pendingDelete=null;render();toast('삭제했습니다.');
}

// ─────────────────── 문제 채점 및 개인별 기록 ───────────────────
async function checkQuiz(){
  const session=state.quiz;if(!session)return;const x=session.questions[session.index];if(!x||x.checked)return;
  const picked=x.mode==='pattern-scramble'?x.picked.map(i=>x.tiles.find(t=>t.id===i)?.label||'').join(' '):x.options[x.selected];
  if(!picked){toast('정답을 선택해 주세요.');return;}
  const correct=normalize(picked)===normalize(x.answer);
  const attempt={group_id:state.group.id,kind:x.kind,item_id:x.row.id,mode:x.mode,correct,prompt:x.prefix,expected:x.answer,given:picked,display_text:x.kind==='word'?x.row.kanji:x.row.japanese,reading:x.kind==='word'?x.row.kana:x.row.reading,meaning:x.row.meaning};
  try{
    await state.store.recordAnswer(attempt);
    [state.attempts,state.mistakes]=await Promise.all([state.store.getAttempts(),state.store.getMistakes()]);
    x.checked=true;x.isCorrect=correct;if(correct)session.score++;
    render();
  }catch(e){toast(`정답 기록 저장 실패: ${asText(e)}. 다시 시도해 주세요.`,true);}
}

function extractImport(json){const data=json?.data??json;let words=[],patterns=[];
  if(Array.isArray(data.vocab)&&Array.isArray(data.sentences)){
    words=data.vocab.map(x=>({kanji:x.kanji||'',kana:x.kana||'',meaning:x.ko||'',pos:x.group||'기타'}));
    patterns=data.sentences.map(x=>({japanese:x.kanji||'',reading:x.kana||'',meaning:x.ko||'',grammar:x.group||'기타'}));
  }else if(Array.isArray(data.shared?.words)&&Array.isArray(data.shared?.patterns)){
    words=data.shared.words;patterns=data.shared.patterns;
  }else throw Error('지원되지 않는 백업 JSON입니다.');
  return {words:words.filter(w=>w.kanji?.trim()&&w.meaning?.trim()),patterns:patterns.filter(p=>p.japanese?.trim()&&p.meaning?.trim())};
}
async function importBackup(file){
  if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());const items=extractImport(parsed);
    const existingWords=new Set(state.words.map(w=>normalize(w.kanji)+'|'+normalize(w.meaning)));
    const existingPatterns=new Set(state.patterns.map(p=>normalize(p.japanese)+'|'+normalize(p.meaning)));
    let addedWords=0,addedPatterns=0;
    for(const w of items.words){const key=normalize(w.kanji)+'|'+normalize(w.meaning);if(existingWords.has(key))continue;await state.store.saveWord({kanji:String(w.kanji).slice(0,300),kana:String(w.kana||'').slice(0,500),meaning:String(w.meaning).slice(0,500),pos:String(w.pos||'기타').slice(0,40)});addedWords++;existingWords.add(key);}
    for(const p of items.patterns){const key=normalize(p.japanese)+'|'+normalize(p.meaning);if(existingPatterns.has(key))continue;await state.store.savePattern({japanese:String(p.japanese).slice(0,1000),reading:String(p.reading||'').slice(0,1200),meaning:String(p.meaning).slice(0,1200),grammar:String(p.grammar||'기타').slice(0,100)});addedPatterns++;existingPatterns.add(key);}
    await loadAll();toast(`공통 단어 ${addedWords}개, 문형 ${addedPatterns}개를 추가했습니다.`);
  }catch(e){toast(`백업 가져오기 실패: ${asText(e)}`,true);}
}
function exportBackup(){const data={format:'onigiri_shared_v1',exported_at:new Date().toISOString(),room:state.group.name,shared:{words:state.words,patterns:state.patterns},personal:{attempts:state.attempts,mistakes:state.mistakes,notes:state.notes}};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=`onigiri_${new Date().toISOString().slice(0,10)}_backup.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),4000);toast('JSON 백업파일을 저장했습니다.');
}

// ─────────────────── UI 이벤트: 버튼 / 폼 / 입력 ───────────────────
document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-action]');if(!target)return;
  event.preventDefault();const action=target.dataset.action;const id=target.dataset.id;
  try{
    if(action==='navigate'){navigate(target.dataset.view);return;}
    if(action==='demo-start'){state.demo=true;state.store=new DemoStore();state.user=state.store.user;await loadGroups();return;}
    if(action==='demo-exit'){state.demo=false;state.store=null;state.group=null;state.user=null;render();return;}
    if(action==='switch-room'){if(state.realtime){state.client?.removeChannel(state.realtime);state.realtime=null;}state.group=null;state.quiz=null;state.groups=await state.store.getGroups();render();return;}
    if(action==='enter-room'){const room=state.groups.find(g=>g.id===id);if(!room)throw Error('해당 스터디룸을 찾지 못했습니다');await enterRoom(room);return;}
    if(action==='logout'){if(state.client)await state.client.auth.signOut();state.client=null;state.user=null;state.group=null;state.store=null;state.groups=[];render();return;}
    if(action==='refresh'){await refreshData();return;}
    if(action==='copy-code'){await navigator.clipboard.writeText(state.group.invite_code);toast('초대코드를 복사했습니다.');return;}
    if(action==='speak'){speak(target.dataset.text||'');return;}
    if(action==='word-edit'){if(!state.words.some(x=>x.id===id))throw Error('수정할 단어가 없습니다');state.wordEditId=id;state.wordSearch='';state.wordPos='전체';state.view='words';render();$('#word-editor')?.scrollIntoView({behavior:'smooth',block:'start'});$('#word-form [name="kanji"]')?.focus();return;}
    if(action==='pattern-edit'){if(!state.patterns.some(x=>x.id===id))throw Error('문형을 찾지 못했습니다');state.patternEditId=id;state.view='patterns';render();$('#pattern-editor')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(action==='note-edit'){if(!state.notes.some(x=>x.id===id))throw Error('메모를 찾지 못했습니다');state.noteEditId=id;render();$('#note-editor')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(action==='word-cancel'){state.wordEditId=null;render();return;}
    if(action==='pattern-cancel'){state.patternEditId=null;render();return;}
    if(action==='note-cancel'){state.noteEditId=null;render();return;}
    if(action==='lookup-save'){const selected=state.lookup[Number(target.dataset.idx)];if(!selected)throw Error('선택한 검색 결과가 없습니다');const old=state.words.find(w=>normalize(w.kanji)===normalize(selected.kanji)&&normalize(w.meaning)===normalize(selected.meaning));await saveWord(selected,old?.id||null);state.lookup=[];state.lookupStatus='';render();toast(old?'기존 공통 단어를 갱신했습니다.':'공통 단어장에 바로 저장했습니다.');return;}
    if(action==='delete-request'){state.pendingDelete={kind:target.dataset.kind,id};render();return;}
    if(action==='delete-cancel'){state.pendingDelete=null;render();return;}
    if(action==='delete-confirm'){await deletePending();return;}
    if(action==='quiz-select'){const x=state.quiz?.questions[state.quiz.index];if(!x||x.checked)return;x.selected=Number(target.dataset.idx);render();return;}
    if(action==='quiz-pick'){const x=state.quiz?.questions[state.quiz.index];if(!x||x.checked)return;const n=Number(id);if(!x.picked.includes(n))x.picked.push(n);render();return;}
    if(action==='quiz-unpick'){const x=state.quiz?.questions[state.quiz.index];if(!x||x.checked)return;x.picked=x.picked.filter(v=>v!==Number(id));render();return;}
    if(action==='quiz-check'){await checkQuiz();return;}
    if(action==='quiz-next'){state.quiz.index++;render();return;}
    if(action==='quiz-restart'){state.quiz=null;render();return;}
    if(action==='mistakes-delete'){const ids=[...state.mistakeSelected];if(!ids.length)return;await state.store.deleteMistakes(ids);state.mistakes=await state.store.getMistakes();state.mistakeSelected.clear();render();toast(`${ids.length}개 오답을 삭제했습니다.`);return;}
    if(action==='mistake-delete-one'){await state.store.deleteMistakes([id]);state.mistakes=await state.store.getMistakes();state.mistakeSelected.delete(id);render();toast('오답 1개를 삭제했습니다.');return;}
    if(action==='mistake-memo-save'){const memo=$(`#memo-${CSS.escape(id)}`)?.value||'';await state.store.saveMistakeMemo(id,memo);state.mistakes=await state.store.getMistakes();render();toast('개인 오답 메모를 저장했습니다.');return;}
    if(action==='export'){exportBackup();return;}
    if(action==='import-trigger'){$('#import-file')?.click();return;}
  }catch(e){console.error(e);toast(`${action} 실패: ${asText(e)}`,true);}
});

document.addEventListener('submit',async event=>{
  const form=event.target;if(!form.id)return;event.preventDefault();
  const submit=form.querySelector('button[type="submit"]');if(submit?.disabled)return;if(submit)submit.disabled=true;
  const fd=new FormData(form);
  try{
    if(form.id==='login-form'){
      const email=String(fd.get('email')||'').trim();
      const {error}=await state.client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
      if(error)throw error;
      toast('로그인 링크를 이메일로 보냈습니다. 받은 편지함을 확인해 주세요.');
    }
    else if(form.id==='create-room-form'){
      const id=await state.store.createGroup(String(fd.get('room_name')||''));await loadGroups(id);toast('스터디룸을 만들었습니다. 초대코드를 친구들에게 공유해 주세요.');
    }
    else if(form.id==='join-room-form'){
      const id=await state.store.joinGroup(String(fd.get('code')||''));await loadGroups(id);toast('스터디룸에 참여했습니다.');
    }
    else if(form.id==='lookup-form'){
      const query=String(fd.get('query')||'').trim();if(!query)throw Error('찾을 뜻을 입력해 주세요.');await searchJapanese(query);
    }
    else if(form.id==='word-form'){
      const id=state.wordEditId;const payload={kanji:String(fd.get('kanji')||''),kana:String(fd.get('kana')||''),meaning:String(fd.get('meaning')||''),pos:String(fd.get('pos')||'기타')};
      await saveWord(payload,id);toast(id?'단어를 수정하여 저장했습니다.':'공통 단어장에 저장했습니다.');
    }
    else if(form.id==='pattern-form'){
      const id=state.patternEditId;
      await savePattern({japanese:String(fd.get('japanese')||''),reading:String(fd.get('reading')||''),meaning:String(fd.get('meaning')||''),grammar:String(fd.get('grammar')||'기타')},id);
      toast(id?'문형을 수정하여 저장했습니다.':'공통 문형집에 저장했습니다.');
    }
    else if(form.id==='quiz-start-form'){
      const kind=String(fd.get('kind')||'word');const mode=String(fd.get('mode')||'word-reading');const wrongOnly=fd.has('wrongOnly');
      const questions=buildQuestions(kind,mode,wrongOnly);
      if(!questions.length)throw Error(wrongOnly?'해당 오답에 연결된 항목이 없습니다.':'먼저 공통 단어 또는 문형을 등록해 주세요.');
      state.quiz={kind,mode,questions,index:0,score:0};render();
    }
    else if(form.id==='note-form'){
      const id=state.noteEditId;
      await state.store.saveNote({title:String(fd.get('title')||'').trim(),body:String(fd.get('body')||'').trim()},id);
      state.notes=await state.store.getNotes();state.noteEditId=null;render();toast(id?'메모 수정 저장 완료':'개인 메모 저장 완료');
    }
  }catch(e){console.error(e);toast(`저장 또는 실행 실패: ${asText(e)}`,true);}
  finally{if(submit?.isConnected)submit.disabled=false;}
});

document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='history-filter'){state.historyFilter=el.value;render();}
  else if(el.id==='quiz-kind'){const mode=$('#quiz-mode');if(mode)mode.innerHTML=renderQuizModes(el.value);}
  else if(el.id==='word-pos-filter'){state.wordPos=el.value;render();}
  else if(el.id==='mistakes-select-all'){state.mistakeSelected=el.checked?new Set(state.mistakes.map(x=>x.id)):new Set();render();}
  else if(el.matches('.mistake-check')){
    if(el.checked)state.mistakeSelected.add(el.dataset.id);else state.mistakeSelected.delete(el.dataset.id);
    const button=$('[data-action="mistakes-delete"]');if(button)button.disabled=!state.mistakeSelected.size;
    const info=$('.filter-row .muted.tiny');if(info)info.textContent=`${state.mistakeSelected.size}개 선택`;
    const selectAll=$('#mistakes-select-all');if(selectAll)selectAll.checked=state.mistakes.length>0&&state.mistakeSelected.size===state.mistakes.length;
  }
  else if(el.id==='import-file'){importBackup(el.files?.[0]);el.value='';}
});
document.addEventListener('input',event=>{
  const el=event.target;
  if(el.id==='word-filter'){state.wordSearch=el.value;const place=$('#word-items');if(place){const matching=state.words.filter(w=>(state.wordPos==='전체'||w.pos===state.wordPos)&&[w.kanji,w.kana,w.meaning].join(' ').toLowerCase().includes(el.value.toLowerCase()));place.innerHTML=matching.length?matching.map(w=>`<div class="item"><div class="item-main"><strong class="jp">${escapeHTML(w.kanji)}</strong><span class="kana">${escapeHTML(w.kana||'발음 미입력')}</span><span class="tag">${escapeHTML(w.pos||'기타')}</span><div class="meaning">${escapeHTML(w.meaning)}</div></div><div class="item-actions">${button('speak',icon('sound',16),'ghost small',`data-text="${escapeAttr(w.kanji)}"`)}${button('word-edit','수정','outline small',`data-id="${escapeAttr(w.id)}"`)}${button('delete-request','삭제','ghost small',`data-kind="word" data-id="${escapeAttr(w.id)}"`)}</div></div>`).join(''):empty('검색 결과가 없어요.');} }
  else if(el.id==='pattern-filter'){
    state.patternSearch=el.value;const place=$('#pattern-items');
    if(place){const shown=state.patterns.filter(w=>[w.japanese,w.reading,w.meaning,w.grammar].join(' ').toLowerCase().includes(el.value.toLowerCase()));
      place.innerHTML=shown.length?shown.map(w=>`<div class="item"><div class="item-main"><strong class="jp">${escapeHTML(w.japanese)}</strong><div class="meaning jp">${escapeHTML(w.reading||'')}</div><div class="meaning">${escapeHTML(w.meaning)} <span class="tag">${escapeHTML(w.grammar||'기타')}</span></div></div><div class="item-actions">${button('speak',icon('sound',16),'ghost small',`data-text="${escapeAttr(w.japanese)}"`)}${button('pattern-edit','수정','outline small',`data-id="${escapeAttr(w.id)}"`)}${button('delete-request','삭제','ghost small',`data-kind="pattern" data-id="${escapeAttr(w.id)}"`)}</div></div>`).join(''):empty('검색 결과가 없어요.');
    }
  }
});

// ─────────────────── 진입점 ───────────────────
async function boot(){
  if(!CONFIGURED){render();return;}
  try{
    const lib=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    state.client=lib.createClient(CONFIG.supabaseUrl.replace(/\/$/,''),CONFIG.supabaseKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    const {data,error}=await state.client.auth.getSession();if(error)throw error;
    if(data.session?.user){state.user=data.session.user;state.store=new SupabaseStore(state.client,state.user);await loadGroups();}
    else render();
    state.client.auth.onAuthStateChange((_event,session)=>{
      // Supabase 인증 콜백 내부에서 추가 Supabase 비동기 호출을 직접 기다리지 않습니다.
      setTimeout(async()=>{
        try{
          const newId=session?.user?.id;if(!newId){state.user=null;state.store=null;state.group=null;state.groups=[];render();return;}
          if(state.user?.id===newId && state.store)return;
          state.user=session.user;state.store=new SupabaseStore(state.client,state.user);await loadGroups();
        }catch(e){console.error(e);toast(`로그인 처리 실패: ${asText(e)}`,true);}
      },0);
    });
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible'&&state.group&&!state.demo&&state.view==='home'){
        loadAll().catch(e=>console.error('visibility refresh',e));
      }
    });
  }catch(e){
    console.error(e);state.store=null;state.user=null;
    $('#app').innerHTML=`<div class="centered-page"><div class="auth-panel">${onigiri()}<h1>온라인 연결을 확인해 주세요</h1><p class="intro">${escapeHTML(asText(e))}</p><div class="info warning">config.js의 Supabase URL·공개 키, 인터넷 연결 및 SQL 실행 여부를 확인해 주세요. 브라우저의 개발자 도구(F12) 콘솔에서 상세 오류를 볼 수 있습니다.</div><div style="height:12px"></div><button class="btn secondary" data-action="demo-start" style="width:100%">체험 모드로 보기</button></div></div>`;
  }
}
boot();
