const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('gameOver');
const restartBtn = document.getElementById('restart');

let stars = [];
let currentStar = null;
let nextStar = null;
let player = {x:0, y:0, size:20, state:'idle', vx:0, vy:0};
let score = 0;
let gauge = 0;
let gaugeDir = 1;
let gameOver = false;
let cameraY = 0;
let jumpProgress = 0;
let jumpSteps = 30;
let success = false;

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
  stars = [];
  score = 0;
  gameOver = false;
  cameraY = 0;
  currentStar = {x: canvas.width/2, y: 0, radius:15, twinkle: Math.random()*Math.PI*2};
  player.x = currentStar.x;
  player.y = currentStar.y - 25;
  stars.push(currentStar);
  addNextStar();
  updateScore();
  gameOverEl.style.display = 'none';
  requestAnimationFrame(loop);
}

function updateScore(){
  scoreEl.textContent = `Score: ${score}`;
}

function addNextStar(){
  const x = Math.random() * (canvas.width - 100) + 50;
  const y = currentStar.y - 120;
  nextStar = {x, y, radius:15, twinkle: Math.random()*Math.PI*2};
  stars.push(nextStar);
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
  success = Math.abs(gauge - dist) < 20;
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
  if(player.state !== 'idle') return;
  gauge += gaugeDir*3;
  if(gauge > 200){ gauge = 200; gaugeDir = -1; }
  if(gauge < 30){ gauge = 30; gaugeDir = 1; }
}

function drawGauge(){
  if(player.state !== 'idle') return;
  ctx.fillStyle = '#444';
  ctx.fillRect(20, canvas.height - 30, 200, 10);
  ctx.fillStyle = '#0f0';
  ctx.fillRect(20, canvas.height - 30, gauge, 10);
}

function loop(){
  ctx.clearRect(0,0,canvas.width, canvas.height);
  cameraY = player.y - canvas.height/2 + 100;
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
  if(!gameOver) requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => { if(e.code === 'Space') attemptJump(); });
canvas.addEventListener('mousedown', attemptJump);
restartBtn.addEventListener('click', init);

gauge = 30;
init();
