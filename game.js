const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const message = document.querySelector('#game-message');
const scoreDisplay = document.querySelector('#score');
const WORLD_WIDTH = 3200;
const FLOOR_Y = 450;

const platforms = [
  { x: 0, y: FLOOR_Y, width: 560 },
  { x: 660, y: FLOOR_Y, width: 380 },
  { x: 1135, y: FLOOR_Y, width: 470 },
  { x: 1710, y: FLOOR_Y, width: 350 },
  { x: 2165, y: FLOOR_Y, width: 420 },
  { x: 2690, y: FLOOR_Y, width: 510 },
  { x: 320, y: 350, width: 125 },
  { x: 805, y: 345, width: 145 },
  { x: 1280, y: 335, width: 150 },
  { x: 1850, y: 350, width: 140 },
  { x: 2320, y: 335, width: 145 },
  { x: 2840, y: 345, width: 150 },
];

const player = { x: 70, y: FLOOR_Y - 42, width: 28, height: 42, vx: 0, vy: 0, onGround: true };
const keys = { left: false, right: false, jump: false };
let checkpointX = player.x;
let checkpointY = player.y;
let cameraX = 0;
let won = false;
let gameOver = false;
let lastTime = 0;
let furthestX = player.x;
let score = 0;

function reset() {
  player.x = 70;
  player.y = FLOOR_Y - player.height;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  checkpointX = player.x;
  checkpointY = player.y;
  cameraX = 0;
  furthestX = player.x;
  score = 0;
  scoreDisplay.textContent = '000000';
  won = false;
  gameOver = false;
  message.hidden = true;
}

function resumeFromCheckpoint() {
  player.x = checkpointX;
  player.y = checkpointY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  keys.left = false;
  keys.right = false;
  keys.jump = false;
  cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width * 0.36));
  gameOver = false;
  message.hidden = true;
}

function setKey(key, isDown) {
  if (key === 'ArrowLeft' || key.toLowerCase() === 'a') keys.left = isDown;
  if (key === 'ArrowRight' || key.toLowerCase() === 'd') keys.right = isDown;
  if (key === ' ' || key === 'ArrowUp' || key.toLowerCase() === 'w') {
    if (isDown && !keys.jump && player.onGround && !won && !gameOver) {
      player.vy = -650;
      player.onGround = false;
    }
    keys.jump = isDown;
  }
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(event.key)) event.preventDefault();
  if (event.key === 'Enter' && gameOver) resumeFromCheckpoint();
  else if (event.key === 'Enter' && won) reset();
  setKey(event.key, true);
});

window.addEventListener('keyup', (event) => setKey(event.key, false));
window.addEventListener('blur', () => {
  keys.left = false;
  keys.right = false;
  keys.jump = false;
});
document.querySelector('#restart').addEventListener('click', reset);

document.querySelectorAll('[data-control]').forEach((button) => {
  const control = button.dataset.control;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    if (control === 'jump') setKey(' ', true);
    else keys[control] = true;
  });
  const release = () => {
    if (control === 'jump') setKey(' ', false);
    else keys[control] = false;
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});

function update(delta) {
  if (won || gameOver) return;
  const step = Math.min(delta, 1 / 30);
  const direction = Number(keys.right) - Number(keys.left);
  player.vx = direction * 250;
  const nextX = player.x + player.vx * step;
  player.x = nextX;

  if (direction !== 0) {
    for (const platform of platforms) {
      const overlapsVertically = player.y < canvas.height && player.y + player.height > platform.y;
      const overlapsHorizontally = player.x + player.width > platform.x && player.x < platform.x + platform.width;
      if (!overlapsVertically || !overlapsHorizontally) continue;

      if (direction > 0) player.x = Math.min(player.x, platform.x - player.width);
      else player.x = Math.max(player.x, platform.x + platform.width);
    }
  }

  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));
  furthestX = Math.max(furthestX, player.x);
  const nextScore = Math.floor((furthestX - 70) / 10);
  if (nextScore !== score) {
    score = nextScore;
    scoreDisplay.textContent = String(score).padStart(6, '0');
  }

  const previousBottom = player.y + player.height;
  player.vy += 1550 * step;
  player.y += player.vy * step;
  player.onGround = false;

  if (player.vy >= 0) {
    for (const platform of platforms) {
      const overlapsHorizontally = player.x + player.width > platform.x && player.x < platform.x + platform.width;
      const crossedTop = previousBottom <= platform.y && player.y + player.height >= platform.y;
      if (overlapsHorizontally && crossedTop) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.onGround = true;
        break;
      }
    }
  }

  if (player.onGround) {
    checkpointX = player.x;
    checkpointY = player.y;
  }

  if (player.y > canvas.height + 100) {
    gameOver = true;
    message.innerHTML = '<strong>GAME OVER</strong><span>落下してしまった！最後に着地した場所から再開できます</span><button class="resume-button" type="button">失敗した場所から再開</button>';
    message.hidden = false;
    return;
  }
  cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width * 0.36));

  if (player.x + player.width >= WORLD_WIDTH - 95) {
    won = true;
    message.innerHTML = '<strong>STAGE CLEAR!</strong><span>ゴール！ Enterキーでもう一度遊べます</span>';
    message.hidden = false;
  }
}

message.addEventListener('click', (event) => {
  if (event.target.closest('.resume-button')) resumeFromCheckpoint();
});

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#10152d');
  sky.addColorStop(0.58, '#29234b');
  sky.addColorStop(1, '#61415c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(740 - cameraX * 0.05, 150, 8, 740 - cameraX * 0.05, 150, 330);
  glow.addColorStop(0, 'rgba(255, 130, 166, .2)');
  glow.addColorStop(1, 'rgba(255, 130, 166, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 225, 232, .9)';
  ctx.beginPath();
  ctx.arc(740 - cameraX * 0.05, 150, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 225, 232, .12)';
  ctx.beginPath();
  ctx.arc(740 - cameraX * 0.05, 150, 43, 0, Math.PI * 2);
  ctx.fill();

  drawStars();
  drawRidge('#242443', 340, 52, 0.12, 0);
  drawRidge('#1a203d', 390, 36, 0.22, 73);
  drawCity();

  const groundGlow = ctx.createLinearGradient(0, 390, 0, 470);
  groundGlow.addColorStop(0, 'rgba(56, 235, 221, 0)');
  groundGlow.addColorStop(1, 'rgba(56, 235, 221, .12)');
  ctx.fillStyle = groundGlow;
  ctx.fillRect(0, 390, canvas.width, 80);
}

function drawStars() {
  for (let i = 0; i < 72; i++) {
    const worldX = (i * 137 + 29) % 1450;
    const x = ((worldX - cameraX * 0.035 + 1450) % 1450) * (canvas.width / 1450);
    const y = 20 + ((i * 83 + 17) % 245);
    const radius = i % 9 === 0 ? 1.8 : 0.9;
    ctx.fillStyle = i % 7 === 0 ? 'rgba(113, 247, 232, .9)' : 'rgba(230, 236, 255, .7)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRidge(color, base, height, speed, phase) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  const segment = 155;
  const offset = -((cameraX * speed + phase) % segment);
  for (let x = -segment; x <= canvas.width + segment; x += segment) {
    const peak = base - ((Math.floor((x + phase) / segment) % 2 === 0) ? height : height * 0.55);
    ctx.lineTo(x + offset, peak);
    ctx.lineTo(x + segment * 0.48 + offset, base + 12);
  }
  ctx.lineTo(canvas.width + segment, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawCity() {
  const buildingWidth = 54;
  const offset = -((cameraX * 0.3) % buildingWidth);
  for (let i = -1; i < 21; i++) {
    const x = i * buildingWidth + offset;
    const height = 24 + ((i * 37 + 180) % 65);
    const y = 405 - height;
    ctx.fillStyle = i % 3 === 0 ? '#1d2545' : '#202541';
    ctx.fillRect(x, y, buildingWidth - 5, height);
    ctx.fillStyle = 'rgba(105, 128, 187, .24)';
    ctx.fillRect(x + 6, y + 8, 2, height - 12);
    for (let row = 0; row < Math.floor((height - 12) / 15); row++) {
      ctx.fillStyle = (i + row) % 4 === 0 ? 'rgba(255, 164, 190, .72)' : 'rgba(99, 218, 222, .48)';
      ctx.fillRect(x + 14, y + 9 + row * 15, 5, 5);
      if ((i + row) % 3 !== 0) ctx.fillRect(x + 31, y + 9 + row * 15, 5, 5);
    }
  }

  ctx.fillStyle = 'rgba(80, 218, 221, .45)';
  ctx.fillRect(0, 404, canvas.width, 1);
  const horizonGlow = ctx.createLinearGradient(0, 397, 0, 425);
  horizonGlow.addColorStop(0, 'rgba(80, 218, 221, .12)');
  horizonGlow.addColorStop(1, 'rgba(80, 218, 221, 0)');
  ctx.fillStyle = horizonGlow;
  ctx.fillRect(0, 397, canvas.width, 28);
}

function drawWorld() {
  for (const platform of platforms) {
    const screenX = platform.x - cameraX;
    if (screenX + platform.width < -5 || screenX > canvas.width + 5) continue;
    const surface = ctx.createLinearGradient(0, platform.y, 0, canvas.height);
    surface.addColorStop(0, '#202d4b');
    surface.addColorStop(1, '#11182e');
    ctx.fillStyle = surface;
    ctx.fillRect(screenX, platform.y, platform.width, canvas.height - platform.y);
    ctx.save();
    ctx.shadowColor = '#55f5df';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#62f3df';
    ctx.fillRect(screenX, platform.y, platform.width, 3);
    ctx.restore();
    ctx.fillStyle = 'rgba(122, 245, 228, .52)';
    ctx.fillRect(screenX, platform.y + 3, platform.width, 2);
    ctx.fillStyle = 'rgba(96, 123, 174, .24)';
    for (let x = screenX + 18; x < screenX + platform.width - 8; x += 42) {
      ctx.fillRect(x, platform.y + 19, 18, 2);
      ctx.fillStyle = 'rgba(91, 219, 215, .35)';
      ctx.fillRect(x + 4, platform.y + 29, 4, 4);
      ctx.fillStyle = 'rgba(96, 123, 174, .24)';
    }
  }

  drawGoal(WORLD_WIDTH - 78 - cameraX);
  drawPlayer();
}

function drawGoal(x) {
  ctx.save();
  ctx.shadowColor = '#64f8e2';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#8bfff0';
  ctx.fillRect(x, FLOOR_Y - 108, 4, 108);
  ctx.fillStyle = '#70f5df';
  ctx.beginPath();
  ctx.moveTo(x + 4, FLOOR_Y - 104);
  ctx.lineTo(x + 47, FLOOR_Y - 91);
  ctx.lineTo(x + 4, FLOOR_Y - 78);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#d9fff6';
  ctx.beginPath();
  ctx.ellipse(x + 2, FLOOR_Y, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const x = player.x - cameraX;
  const y = player.y;

  ctx.fillStyle = 'rgba(4, 9, 25, .42)';
  ctx.beginPath();
  ctx.ellipse(x + player.width / 2, y + player.height + 5, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.shadowColor = '#54f3e5';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ff668f';
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 19);
  ctx.lineTo(x - 3, y + 34);
  ctx.lineTo(x + 9, y + 31);
  ctx.lineTo(x + 13, y + 23);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#121a35';
  ctx.fillRect(x + 4, y + 29, 8, 11);
  ctx.fillRect(x + 17, y + 29, 8, 11);
  ctx.fillStyle = '#66e9df';
  ctx.fillRect(x + 3, y + 38, 10, 3);
  ctx.fillRect(x + 16, y + 38, 10, 3);

  const armor = ctx.createLinearGradient(x, y + 15, x + player.width, y + 29);
  armor.addColorStop(0, '#9c6af5');
  armor.addColorStop(0.55, '#4a68c3');
  armor.addColorStop(1, '#27365e');
  ctx.fillStyle = armor;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 16);
  ctx.lineTo(x + 22, y + 16);
  ctx.lineTo(x + 26, y + 29);
  ctx.lineTo(x + 3, y + 29);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#74fff0';
  ctx.fillRect(x + 7, y + 22, 14, 2);
  ctx.fillStyle = '#e7c7ff';
  ctx.fillRect(x + 5, y + 29, 19, 2);

  ctx.fillStyle = '#263253';
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 3, 21, 17, 6);
  ctx.fill();
  ctx.fillStyle = '#edb7ab';
  ctx.fillRect(x + 7, y + 1, 15, 5);
  ctx.fillStyle = '#9d70ef';
  ctx.fillRect(x + 4, y + 7, 21, 4);
  ctx.save();
  ctx.shadowColor = '#62fff0';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#7bfff2';
  ctx.fillRect(x + 13, y + 12, 9, 4);
  ctx.restore();
  ctx.fillStyle = '#f4f0ff';
  ctx.fillRect(x + 19, y + 12, 2, 2);
}

function render() {
  drawBackground();
  drawWorld();
}

function frame(timestamp) {
  const delta = lastTime ? (timestamp - lastTime) / 1000 : 0;
  lastTime = timestamp;
  update(delta);
  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
