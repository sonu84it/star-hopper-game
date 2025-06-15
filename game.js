const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('gameOver');
const restartBtn = document.getElementById('restart');
const restartTopBtn = document.getElementById('restartTop');
const hintEl = document.getElementById('hint');

let stars = [];
let bgStars = [];
let currentStar = null;
let nextStar = null;
let player = {x:0, y:0, size:20, state:'idle', vx:0, vy:0};
let score = 0;
let gauge = 0;
let gaugeDir = 1;
let gameOver = false;
let animationId = null;
let cameraY = 0;
let jumpProgress = 0;
let jumpSteps = 30;
let success = false;
let lastPower = 0;
const minGauge = 30;
const maxGauge = 250;

function playJumpSound(){
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = 600;
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  gain.gain.setValueAtTime(0.2, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.00001, ac.currentTime + 0.2);
  osc.stop(ac.currentTime + 0.2);
}

function init(){
  if(animationId !== null){
    cancelAnimationFrame(animationId);
  }
  stars = [];
  bgStars = Array.from({length: 50}, () => ({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    size: Math.random()*2 + 1,
    tw: Math.random()*Math.PI*2
  }));
  score = 0;
  gameOver = false;
  cameraY = 0;
  gauge = minGauge;
  gaugeDir = 1;
  lastPower = 0;
  currentStar = {x: canvas.width/2, y: 0, radius:15, twinkle: Math.random()*Math.PI*2};
  player.x = currentStar.x;
  player.y = currentStar.y - 25;
  player.state = 'idle';
  player.vx = 0;
  player.vy = 0;
  stars.push(currentStar);
  addNextStar();
  updateScore();
  gameOverEl.style.display = 'none';
  hintEl.textContent = 'Click or press Space to jump when power matches distance.';
  animationId = requestAnimationFrame(loop);
}

function updateScore(){
  scoreEl.textContent = `Score: ${score}`;
}

function addNextStar(){
  const x = Math.random() * (canvas.width - 100) + 50;
  const y = currentStar.y - (100 + Math.random()*40);
  nextStar = {x, y, radius:15, twinkle: Math.random()*Math.PI*2};
  stars.push(nextStar);
}

function drawBg(){
  for(const s of bgStars){
    const t = Date.now()*0.002 + s.tw;
    const alpha = 0.5 + Math.sin(t)*0.5;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y - cameraY*0.1, s.size, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawStar(star){
  const t = Date.now()*0.005 + star.twinkle;
  const r = star.radius + Math.sin(t)*2;
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const angle = (i*2*Math.PI)/5 - Math.PI/2;
    const ix = star.x + Math.cos(angle)*r;
    const iy = star.y + Math.sin(angle)*r;
    if(i===0) ctx.moveTo(ix, iy);
    else ctx.lineTo(ix, iy);
    const angle2 = angle + Math.PI/5;
    ctx.lineTo(star.x + Math.cos(angle2)*r*0.5, star.y + Math.sin(angle2)*r*0.5);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd700';
  ctx.fill();
}

function attemptJump(){
  if(gameOver || player.state !== 'idle') return;
  playJumpSound();
  const dx = nextStar.x - player.x;
  const dy = nextStar.y - player.y;
  const dist = Math.hypot(dx, dy);
  success = Math.abs(gauge - dist) < 30;
  lastPower = gauge;
  const ratio = gauge / dist;
  player.startX = player.x;
  player.startY = player.y;
  player.destX = player.x + dx * ratio;
  player.destY = player.y + dy * ratio;
  player.state = 'jumping';
  jumpProgress = 0;
}

function updatePlayer(){
  if(player.state === 'jumping'){
    hintEl.textContent = '';
    jumpProgress++;
    const t = jumpProgress / jumpSteps;
    player.x = player.startX + (player.destX - player.startX)*t;
    player.y = player.startY + (player.destY - player.startY)*t - Math.sin(Math.PI*t)*50;
    if(jumpProgress >= jumpSteps){
      if(success){
        player.x = nextStar.x;
        player.y = nextStar.y - 25;
        currentStar = nextStar;
        addNextStar();
        score++;
        updateScore();
        player.state = 'idle';
      } else {
        player.state = 'falling';
        player.vy = 5;
      }
    }
  } else if(player.state === 'falling'){
    player.vy += 0.5;
    player.y += player.vy;
    if(player.y - cameraY > canvas.height + 40){
      endGame();
    }
  } else {
    hintEl.textContent = 'Click or press Space to jump when power matches distance.';
  }
}

function endGame(){
  gameOver = true;
  gameOverEl.style.display = 'flex';
}

function drawPlayer(){
  ctx.fillStyle = '#9cf';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size/2, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(player.x, player.y-5, player.size/4, 0, Math.PI*2);
  ctx.fill();
}

function updateGauge(){
  if(player.state !== 'idle') {
    return;
  }
  gauge += gaugeDir*2;
  if(gauge > maxGauge){ gauge = maxGauge; gaugeDir = -1; }
  if(gauge < minGauge){ gauge = minGauge; gaugeDir = 1; }
  const dist = Math.hypot(nextStar.x - player.x, nextStar.y - player.y);
  if(Math.abs(gauge - dist) < 15){
    hintEl.textContent = 'Jump now!';
  } else {
    hintEl.textContent = 'Click or press Space to jump when power matches distance.';
  }
}

function drawGauge(){
  ctx.font = '12px Arial';
  if(player.state === 'idle'){
    ctx.fillStyle = '#444';
    ctx.fillRect(20, canvas.height - 30, maxGauge, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(20, canvas.height - 30, gauge, 10);
    ctx.fillStyle = '#fff';
    ctx.fillText(minGauge, 20, canvas.height - 35);
    ctx.fillText(maxGauge, 20 + maxGauge - 20, canvas.height - 35);
  }
  ctx.fillStyle = '#fff';
  ctx.fillText(`Last: ${lastPower.toFixed(0)}`, 20, canvas.height - 45);
}

function loop(){
  ctx.clearRect(0,0,canvas.width, canvas.height);
  cameraY = player.y - canvas.height/2 + 100;
  drawBg();
  ctx.save();
  ctx.translate(0, -cameraY);
  for(const s of stars){
    drawStar(s);
  }
  drawPlayer();
  ctx.restore();
  drawGauge();
  updateGauge();
  updatePlayer();
  if(!gameOver) {
    animationId = requestAnimationFrame(loop);
  }
}

window.addEventListener('keydown', e => { if(e.code === 'Space') attemptJump(); });
canvas.addEventListener('mousedown', attemptJump);
restartBtn.addEventListener('click', init);
restartTopBtn.addEventListener('click', init);

gauge = minGauge;
init();
