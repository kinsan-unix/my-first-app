const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const message = document.querySelector('#game-message');
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
let cameraX = 0;
let won = false;
let lastTime = 0;

function reset() {
  player.x = 70;
  player.y = FLOOR_Y - player.height;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  cameraX = 0;
  won = false;
  message.hidden = true;
}

function setKey(key, isDown) {
  if (key === 'ArrowLeft' || key.toLowerCase() === 'a') keys.left = isDown;
  if (key === 'ArrowRight' || key.toLowerCase() === 'd') keys.right = isDown;
  if (key === ' ' || key === 'ArrowUp' || key.toLowerCase() === 'w') {
    if (isDown && !keys.jump && player.onGround && !won) {
      player.vy = -590;
      player.onGround = false;
    }
    keys.jump = isDown;
  }
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(event.key)) event.preventDefault();
  if (event.key === 'Enter' && won) reset();
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
  if (won) return;
  const step = Math.min(delta, 1 / 30);
  const direction = Number(keys.right) - Number(keys.left);
  player.vx = direction * 250;
  player.x += player.vx * step;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));

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

  if (player.y > canvas.height + 100) reset();
  cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width * 0.36));

  if (player.x + player.width >= WORLD_WIDTH - 95) {
    won = true;
    message.innerHTML = '<strong>STAGE CLEAR!</strong><span>ゴール！ Enterキーでもう一度遊べます</span>';
    message.hidden = false;
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#8bc9d3');
  sky.addColorStop(1, '#d1e7c3');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(250, 250, 225, .7)';
  ctx.beginPath();
  ctx.arc(770 - cameraX * 0.08, 95, 37, 0, Math.PI * 2);
  ctx.fill();

  drawHills('#9ac9ad', 330, 0.18, 120);
  drawHills('#80b899', 385, 0.32, 90);

  ctx.fillStyle = 'rgba(255,255,255,.62)';
  for (let i = 0; i < 5; i++) {
    const x = ((i * 240 - cameraX * 0.16 + 1300) % 1300 + 1300) % 1300 - 100;
    const y = 95 + (i % 3) * 54;
    drawCloud(x, y);
  }
}

function drawHills(color, base, speed, size) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  for (let x = -size; x <= canvas.width + size; x += size) {
    const offset = -((cameraX * speed) % (size * 2));
    ctx.lineTo(x + offset, base - (x % (size * 2) === 0 ? 48 : 0));
    ctx.lineTo(x + size + offset, base);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.ellipse(x, y, 31, 10, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 13, y - 6, 14, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 3, y - 10, 17, 16, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 19, y - 3, 13, 11, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWorld() {
  for (const platform of platforms) {
    const screenX = platform.x - cameraX;
    if (screenX + platform.width < -5 || screenX > canvas.width + 5) continue;
    ctx.fillStyle = '#5c9870';
    ctx.fillRect(screenX, platform.y, platform.width, canvas.height - platform.y);
    ctx.fillStyle = '#80c477';
    ctx.fillRect(screenX, platform.y, platform.width, 9);
    ctx.fillStyle = 'rgba(39, 91, 65, .2)';
    for (let x = screenX + 18; x < screenX + platform.width; x += 42) {
      ctx.fillRect(x, platform.y + 28, 12, 5);
    }
  }

  drawGoal(WORLD_WIDTH - 78 - cameraX);
  drawPlayer();
}

function drawGoal(x) {
  ctx.fillStyle = '#f8f3dc';
  ctx.fillRect(x, FLOOR_Y - 105, 5, 105);
  ctx.fillStyle = '#f07868';
  ctx.beginPath();
  ctx.moveTo(x + 5, FLOOR_Y - 104);
  ctx.lineTo(x + 48, FLOOR_Y - 90);
  ctx.lineTo(x + 5, FLOOR_Y - 75);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f8f3dc';
  ctx.beginPath();
  ctx.ellipse(x + 2, FLOOR_Y, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const x = player.x - cameraX;
  const y = player.y;
  ctx.fillStyle = 'rgba(28, 58, 59, .18)';
  ctx.beginPath();
  ctx.ellipse(x + player.width / 2, y + player.height + 5, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4a879';
  ctx.fillRect(x + 3, y + 5, 22, 23);
  ctx.fillStyle = '#ed876f';
  ctx.fillRect(x + 1, y + 11, 26, 10);
  ctx.fillStyle = '#36485a';
  ctx.fillRect(x + 4, y + 28, 8, 12);
  ctx.fillRect(x + 17, y + 28, 8, 12);
  ctx.fillStyle = '#fff9e7';
  ctx.fillRect(x + 17, y + 12, 5, 6);
  ctx.fillStyle = '#344451';
  ctx.fillRect(x + 20, y + 14, 2, 4);
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
