const app = document.getElementById("app");
const screens = ["prologue","level1","interlude1","level2","interlude2","ending"];
const chapter = document.getElementById("chapter-indicator");
const themes = {prologue:"blue",level1:"blue",interlude1:"purple",level2:"purple",interlude2:"red",ending:"red"};
const labels = {prologue:"PRÓLOGO",level1:"NÍVEL I",interlude1:"INTERLÚDIO I",level2:"NÍVEL II",interlude2:"INTERLÚDIO II",ending:"ENCERRAMENTO"};

function go(name){
  screens.forEach(s=>document.getElementById("screen-"+s).classList.toggle("active",s===name));
  app.className = "theme-"+themes[name];
  chapter.textContent = labels[name];
  window.scrollTo({top:0,behavior:"smooth"});
  if(name==="level1") resetGame();
  if(name==="level2") startQuiz();
}
document.querySelectorAll("[data-go]").forEach(btn=>btn.addEventListener("click",()=>go(btn.dataset.go)));
document.getElementById("finish-preview").addEventListener("click",()=>go("ending"));

// NÍVEL I — arcade simples, compatível com toque e mouse.
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("game-overlay");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const retry = document.getElementById("retry-game");
let targets=[], shots=[], score=0, lives=3, running=false, spawnTimer=0, lastTime=0, raf=0;
const player={x:360,y:380};
function resetGame(){
  cancelAnimationFrame(raf);running=false;targets=[];shots=[];score=0;lives=3;spawnTimer=0;
  scoreEl.textContent=score;livesEl.textContent=lives;player.x=360;
  overlay.classList.remove("hidden");overlay.querySelector("b").textContent="PRONTO?";
  overlay.querySelector("span").textContent="Toque em começar para defender o campo.";
  document.getElementById("start-game").classList.remove("hidden");retry.classList.add("hidden");drawGame();
}
function drawCupid(x,y,size=1){
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);
  ctx.fillStyle="#f4d8ff";ctx.strokeStyle="#f4d8ff";ctx.lineWidth=2;
  // asas
  ctx.beginPath();ctx.ellipse(-12,-2,10,6,-.5,0,Math.PI*2);ctx.ellipse(12,-2,10,6,.5,0,Math.PI*2);ctx.fill();
  // corpo e cabeça
  ctx.beginPath();ctx.arc(0,-7,5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(-5,0);ctx.quadraticCurveTo(0,13,5,0);ctx.stroke();
  // arco
  ctx.beginPath();ctx.arc(8,1,8,-1.2,1.2);ctx.stroke();
  ctx.restore();
}
function drawGame(){
  ctx.clearRect(0,0,720,440);ctx.fillStyle="#080f20";ctx.fillRect(0,0,720,440);
  for(let i=0;i<55;i++){let x=(i*137)%720,y=(i*71)%440;ctx.fillStyle="rgba(190,210,255,.35)";ctx.fillRect(x,y,2,2)}
  ctx.strokeStyle="rgba(150,180,255,.12)";ctx.beginPath();ctx.moveTo(0,410);ctx.lineTo(720,410);ctx.stroke();
  shots.forEach(s=>{ctx.fillStyle="#9bbcff";ctx.fillRect(s.x-2,s.y-9,4,13)});
  targets.forEach(t=>drawCupid(t.x,t.y,t.size));
  // jogador / nave
  ctx.fillStyle="#9bbcff";ctx.beginPath();ctx.moveTo(player.x,350);ctx.lineTo(player.x-15,379);ctx.lineTo(player.x,373);ctx.lineTo(player.x+15,379);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(155,188,255,.25)";ctx.beginPath();ctx.arc(player.x,368,24,0,Math.PI*2);ctx.fill();
}
function shoot(){
  if(!running)return;shots.push({x:player.x,y:352});
}
function endGame(won){
  running=false;overlay.classList.remove("hidden");document.getElementById("start-game").classList.add("hidden");
  overlay.querySelector("b").textContent=won?"CAMPO PROTEGIDO":"FIM DE JOGO";
  overlay.querySelector("span").textContent=won?"Você afastou todos os cupidos. O próximo capítulo espera.":"As vidas acabaram. Tente mais uma vez.";
  retry.classList.remove("hidden");
  if(won){setTimeout(()=>{if(!running && score>=12) go("interlude1")},1200)}
}
function updateGame(ts){
  if(!running)return;let dt=Math.min((ts-lastTime)/16.67,2);lastTime=ts;
  spawnTimer-=dt;
  if(spawnTimer<=0){targets.push({x:35+Math.random()*650,y:-20,speed:1.0+Math.random()*1.1,size:.8+Math.random()*.35});spawnTimer=Math.max(22,55-score*1.7)}
  targets.forEach(t=>t.y+=t.speed*dt);
  shots.forEach(s=>s.y-=8*dt);shots=shots.filter(s=>s.y>-10);
  for(let i=targets.length-1;i>=0;i--){
    const t=targets[i];
    if(t.y>410){targets.splice(i,1);lives--;livesEl.textContent=lives;if(lives<=0){endGame(false);break}}
  }
  for(let i=targets.length-1;i>=0;i--){
    let hit=-1;for(let j=0;j<shots.length;j++){if(Math.hypot(targets[i].x-shots[j].x,targets[i].y-shots[j].y)<20){hit=j;break}}
    if(hit>=0){targets.splice(i,1);shots.splice(hit,1);score++;scoreEl.textContent=score;if(score>=12){drawGame();endGame(true);break}}
  }
  drawGame();if(running)raf=requestAnimationFrame(updateGame);
}
function startGame(){targets=[];shots=[];score=0;lives=3;scoreEl.textContent=0;livesEl.textContent=3;overlay.classList.add("hidden");retry.classList.add("hidden");running=true;lastTime=performance.now();raf=requestAnimationFrame(updateGame)}
function pointerX(e){const r=canvas.getBoundingClientRect();return Math.max(18,Math.min(702,(e.clientX-r.left)*720/r.width))}
canvas.addEventListener("pointerdown",e=>{if(!running)return;player.x=pointerX(e);shoot()});
canvas.addEventListener("pointermove",e=>{if(running && e.buttons)player.x=pointerX(e)});
document.addEventListener("keydown",e=>{if(e.code==="Space"&&document.getElementById("screen-level1").classList.contains("active")){e.preventDefault();shoot()}});
document.getElementById("start-game").addEventListener("click",startGame);
retry.addEventListener("click",resetGame);
drawGame();

// NÍVEL II — três fases curtas com seleção de alternativa.
const questions=[
 {phase:"FASE 01 — AUTORIA",kicker:"IDENTIFIQUE A AUTORIA",q:"“Liberdade é pouco. O que eu desejo ainda não tem nome.”",a:["Clarice Lispector","Fernando Pessoa","Machado de Assis","José Saramago"],correct:0,why:"A frase é de Clarice Lispector, em Perto do coração selvagem."},
 {phase:"FASE 02 — INTERPRETAÇÃO",kicker:"LEIA ALÉM DO SENTIDO LITERAL",q:"Quando um narrador diz que sente falta de algo que nunca viveu, o que isso pode sugerir?",a:["Uma lembrança objetiva","Uma saudade imaginada ou desejo","Uma certeza histórica","Uma descrição do tempo"],correct:1,why:"A frase sugere uma nostalgia por uma possibilidade, não necessariamente por uma experiência real."},
 {phase:"FASE 03 — PONTO DE VISTA",kicker:"ESCOLHA A LEITURA MAIS PRÓXIMA",q:"Qual destas ideias combina mais com a noção de que conhecer alguém é também descobrir o que não se vê de imediato?",a:["As pessoas são simples de decifrar","A primeira impressão explica tudo","A intimidade exige curiosidade e escuta","Conhecer alguém elimina todos os mistérios"],correct:2,why:"Conhecer alguém não significa acabar com seus mistérios, mas aprender a olhar com atenção."}
];
let qIndex=0,selected=null,quizScore=0;
const phaseLabel=document.getElementById("phase-label"),questionCount=document.getElementById("question-count"),questionText=document.getElementById("question-text"),answers=document.getElementById("answers"),feedback=document.getElementById("feedback"),nextBtn=document.getElementById("next-question"),progress=document.getElementById("progress-fill");
function startQuiz(){qIndex=0;quizScore=0;document.getElementById("quiz-score").textContent=0;renderQuestion()}
function renderQuestion(){
  selected=null;let q=questions[qIndex];phaseLabel.textContent=q.phase;questionCount.textContent=String(qIndex+1).padStart(2,"0")+" / 03";questionText.textContent=q.q;
  document.getElementById("question-kicker").textContent=q.kicker;answers.innerHTML="";feedback.textContent="";nextBtn.disabled=true;nextBtn.textContent="CONFIRMAR RESPOSTA";progress.style.width=((qIndex+1)/3*100)+"%";
  q.a.forEach((a,i)=>{let b=document.createElement("button");b.className="answer";b.textContent=String.fromCharCode(65+i)+".  "+a;b.addEventListener("click",()=>{if(selected!==null)return;selected=i;b.classList.add("selected");nextBtn.disabled=false});answers.appendChild(b)});
}
nextBtn.addEventListener("click",()=>{
  if(selected===null)return;let q=questions[qIndex],buttons=[...answers.children],correct=selected===q.correct;
  buttons.forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add("correct");if(i===selected&&!correct)b.classList.add("wrong")});
  if(correct)quizScore++;document.getElementById("quiz-score").textContent=quizScore;
  feedback.textContent=(correct?"CORRETO. ":"NÃO FOI DESSA VEZ. ")+q.why;
  nextBtn.textContent=qIndex===2?"CONCLUIR CAPÍTULO":"PRÓXIMA FASE";
  nextBtn.onclick=()=>{
    nextBtn.onclick=null;
    if(qIndex<2){qIndex++;renderQuestion()}
    else{go("interlude2")}
  };
});
