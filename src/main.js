import Konva from 'konva';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('[SW] Service worker registered:', reg))
      .catch(err => console.error('[SW] Service worker failed:', err));
  });
}

// Initialize Lucide Icons
lucide.createIcons();

// State
let currentTool = 'select';
let currentDrawColor = '#ffffff';
let playersCount = { home: 1, away: 1 };
const COLOR_HOME = '#e63946';
const COLOR_AWAY = '#457b9d';
const COLOR_BALL = '#fca311';

// Player radius – 50% bigger than before (16 → 24)
const PLAYER_RADIUS = 24;

// Initialize Stage
const container = document.getElementById('canvas-container');
const stage = new Konva.Stage({
  container: 'canvas-container',
  width: container.clientWidth,
  height: container.clientHeight,
});

const courtLayer = new Konva.Layer();
const playersLayer = new Konva.Layer();

// Scenarios setup
let currentScenario = 'M';
const scenarioPositions = { 'M': {}, '1': {}, '2': {}, '3': {} };
const scenarioNames = { 
  'M': 'MATRIZ', 
  '1': 'ATAQUE', 
  '2': 'DEFENSA', 
  '3': 'CONTRAATAQUE' 
};
const drawLayers = {
  'M': new Konva.Layer(),
  '1': new Konva.Layer(),
  '2': new Konva.Layer(),
  '3': new Konva.Layer()
};
let drawLayer = drawLayers['M'];
// Load logo
const centerLogoObj = new Image();
centerLogoObj.src = '/assets/logowhite.png';
centerLogoObj.onload = () => {
  drawCourt();
  stage.draw();
};

stage.add(courtLayer);
stage.add(drawLayers['M']);
stage.add(drawLayers['1']);
stage.add(drawLayers['2']);
stage.add(drawLayers['3']);

// Hide non-master layers initially
drawLayers['1'].hide();
drawLayers['2'].hide();
drawLayers['3'].hide();

stage.add(playersLayer);

// Handle Resize
window.addEventListener('resize', () => {
  stage.width(container.clientWidth);
  stage.height(container.clientHeight);
  drawCourt();
  stage.draw();
});

// ========================================================
// 1. DRAW BASKETBALL COURT (improved)
// ========================================================
function drawCourt() {
  courtLayer.destroyChildren();

  const w = stage.width();
  const h = stage.height();
  const scale = Math.min(w / 28, h / 15) * 0.9;

  const courtW = 28 * scale;
  const courtH = 15 * scale;
  const offsetX = (w - courtW) / 2;
  const offsetY = (h - courtH) / 2;

  const courtGroup = new Konva.Group({ x: offsetX, y: offsetY });

  const lineColor = '#a9a9b3';
  const paintColor = 'rgba(200, 200, 220, 0.06)';   // subtle fill for key area
  const strokeW = 2;

  // --- Court Floor (slightly lighter rectangle) ---
  courtGroup.add(new Konva.Rect({
    x: 0, y: 0, width: courtW, height: courtH,
    fill: 'rgba(255,255,255,0.02)',
    stroke: lineColor,
    strokeWidth: strokeW + 1,
    cornerRadius: 2,
  }));

  // --- Center Line ---
  courtGroup.add(new Konva.Line({
    points: [courtW / 2, 0, courtW / 2, courtH],
    stroke: lineColor, strokeWidth: strokeW,
  }));

  // ---- KEY / PAINT AREAS ----
  const keyW = 5.8 * scale;
  const keyH = 4.9 * scale;

  // Left Key (filled paint area)
  courtGroup.add(new Konva.Rect({
    x: 0, y: (courtH - keyH) / 2, width: keyW, height: keyH,
    fill: paintColor,
    stroke: lineColor, strokeWidth: strokeW,
  }));

  // Left key free-throw semi-circle (solid outside)
  courtGroup.add(new Konva.Arc({
    x: keyW, y: courtH / 2,
    innerRadius: 0, outerRadius: 1.8 * scale,
    angle: 180, rotation: -90,
    stroke: lineColor, strokeWidth: strokeW,
    fill: 'transparent',
  }));

  // Left key free-throw semi-circle (dashed inside half)
  courtGroup.add(new Konva.Arc({
    x: keyW, y: courtH / 2,
    innerRadius: 0, outerRadius: 1.8 * scale,
    angle: 180, rotation: 90,
    stroke: lineColor, strokeWidth: strokeW,
    dash: [6, 6],
  }));

  // Right Key (filled paint area)
  courtGroup.add(new Konva.Rect({
    x: courtW - keyW, y: (courtH - keyH) / 2, width: keyW, height: keyH,
    fill: paintColor,
    stroke: lineColor, strokeWidth: strokeW,
  }));

  // Right key free-throw semi-circle (solid outside)
  courtGroup.add(new Konva.Arc({
    x: courtW - keyW, y: courtH / 2,
    innerRadius: 0, outerRadius: 1.8 * scale,
    angle: 180, rotation: 90,
    stroke: lineColor, strokeWidth: strokeW,
  }));

  // Right key free-throw semi-circle (dashed inside half)
  courtGroup.add(new Konva.Arc({
    x: courtW - keyW, y: courtH / 2,
    innerRadius: 0, outerRadius: 1.8 * scale,
    angle: 180, rotation: -90,
    stroke: lineColor, strokeWidth: strokeW,
    dash: [6, 6],
  }));

  // ---- CENTER CIRCLE ----
  // Outer solid circle
  courtGroup.add(new Konva.Circle({
    x: courtW / 2, y: courtH / 2, radius: 1.8 * scale,
    stroke: lineColor, strokeWidth: strokeW,
  }));
  // Inner dashed circle (slightly smaller)
  courtGroup.add(new Konva.Circle({
    x: courtW / 2, y: courtH / 2, radius: 1.2 * scale,
    stroke: lineColor, strokeWidth: 1.5,
    dash: [6, 6],
  }));
  // Center dot
  courtGroup.add(new Konva.Circle({
    x: courtW / 2, y: courtH / 2, radius: 3,
    fill: lineColor,
  }));

  // ---- 3-POINT LINES ----
  const threePtRadius = 6.75 * scale;
  const cornerLineLength = 2.99 * scale;
  const cornerYOffset = 0.9 * scale;

  // Left 3-point arc
  courtGroup.add(new Konva.Line({
    points: [0, cornerYOffset, cornerLineLength, cornerYOffset],
    stroke: lineColor, strokeWidth: strokeW,
  }));
  courtGroup.add(new Konva.Line({
    points: [0, courtH - cornerYOffset, cornerLineLength, courtH - cornerYOffset],
    stroke: lineColor, strokeWidth: strokeW,
  }));
  courtGroup.add(new Konva.Arc({
    x: 1.575 * scale, y: courtH / 2,
    innerRadius: threePtRadius, outerRadius: threePtRadius,
    angle: 140, rotation: -70,
    stroke: lineColor, strokeWidth: strokeW,
  }));

  // Right 3-point arc
  courtGroup.add(new Konva.Line({
    points: [courtW, cornerYOffset, courtW - cornerLineLength, cornerYOffset],
    stroke: lineColor, strokeWidth: strokeW,
  }));
  courtGroup.add(new Konva.Line({
    points: [courtW, courtH - cornerYOffset, courtW - cornerLineLength, courtH - cornerYOffset],
    stroke: lineColor, strokeWidth: strokeW,
  }));
  courtGroup.add(new Konva.Arc({
    x: courtW - 1.575 * scale, y: courtH / 2,
    innerRadius: threePtRadius, outerRadius: threePtRadius,
    angle: 140, rotation: 110,
    stroke: lineColor, strokeWidth: strokeW,
  }));

  // ---- HOOPS & BACKBOARDS ----
  const backboardW = 1.8 * scale;
  const backboardThick = 3;
  const rimRadius = 0.45 * scale;
  const hoopOffset = 0.4 * scale; // distance from baseline

  // -- Left hoop --
  // Backboard (thick line)
  courtGroup.add(new Konva.Line({
    points: [hoopOffset, (courtH - backboardW) / 2, hoopOffset, (courtH + backboardW) / 2],
    stroke: '#ffffff', strokeWidth: backboardThick,
    lineCap: 'round',
  }));
  // Rim (circle)
  courtGroup.add(new Konva.Circle({
    x: hoopOffset + rimRadius + 2, y: courtH / 2, radius: rimRadius,
    stroke: '#ff6b35', strokeWidth: 2.5,
  }));
  // Net lines (tiny decorative)
  for (let i = -2; i <= 2; i++) {
    courtGroup.add(new Konva.Line({
      points: [
        hoopOffset + rimRadius + 2 + i * (rimRadius / 3), courtH / 2 + rimRadius,
        hoopOffset + rimRadius + 2 + i * (rimRadius / 5), courtH / 2 + rimRadius + rimRadius * 0.6,
      ],
      stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1,
    }));
  }

  // -- Right hoop --
  courtGroup.add(new Konva.Line({
    points: [courtW - hoopOffset, (courtH - backboardW) / 2, courtW - hoopOffset, (courtH + backboardW) / 2],
    stroke: '#ffffff', strokeWidth: backboardThick,
    lineCap: 'round',
  }));
  courtGroup.add(new Konva.Circle({
    x: courtW - hoopOffset - rimRadius - 2, y: courtH / 2, radius: rimRadius,
    stroke: '#ff6b35', strokeWidth: 2.5,
  }));
  for (let i = -2; i <= 2; i++) {
    courtGroup.add(new Konva.Line({
      points: [
        courtW - hoopOffset - rimRadius - 2 + i * (rimRadius / 3), courtH / 2 + rimRadius,
        courtW - hoopOffset - rimRadius - 2 + i * (rimRadius / 5), courtH / 2 + rimRadius + rimRadius * 0.6,
      ],
      stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1,
    }));
  }

  // ---- Restricted Area arcs (semi-circles near hoops) ----
  const restrictedRadius = 1.25 * scale;
  courtGroup.add(new Konva.Arc({
    x: hoopOffset + rimRadius + 2, y: courtH / 2,
    innerRadius: restrictedRadius, outerRadius: restrictedRadius,
    angle: 180, rotation: -90,
    stroke: lineColor, strokeWidth: 1.5,
    dash: [4, 4],
  }));
  courtGroup.add(new Konva.Arc({
    x: courtW - hoopOffset - rimRadius - 2, y: courtH / 2,
    innerRadius: restrictedRadius, outerRadius: restrictedRadius,
    angle: 180, rotation: 90,
    stroke: lineColor, strokeWidth: 1.5,
    dash: [4, 4],
  }));

  // ---- CENTER LOGO ----
  if (centerLogoObj.complete && centerLogoObj.naturalHeight !== 0) {
    // Scaling the logo proportionally based on its natural dimensions
    const logoW = 5 * scale;
    const logoH = (centerLogoObj.naturalHeight / centerLogoObj.naturalWidth) * logoW;
    
    courtGroup.add(new Konva.Image({
      x: (courtW - logoW) / 2,
      y: (courtH - logoH) / 2,
      image: centerLogoObj,
      width: logoW,
      height: logoH,
      opacity: 1.0, // Solid opaque
    }));
  }

  courtLayer.add(courtGroup);
}
drawCourt();

// ========================================================
// 1.5 SCENARIO HANDLING
// ========================================================
function switchScenario(newScene) {
  if (currentScenario === newScene) return;

  // 1. Save current positions
  playersLayer.getChildren().forEach(group => {
    if (group.name() === 'player') {
      scenarioPositions[currentScenario][group.id()] = { x: group.x(), y: group.y() };
    }
  });

  // 2. Switch drawing layers
  drawLayers[currentScenario].hide();
  currentScenario = newScene;
  drawLayers[currentScenario].show();
  drawLayer = drawLayers[currentScenario];

  // 3. Apply stored positions for new scene (if any)
  playersLayer.getChildren().forEach(group => {
    if (group.name() === 'player') {
      const pos = scenarioPositions[currentScenario][group.id()];
      if (pos) {
        group.x(pos.x);
        group.y(pos.y);
      }
    }
  });
  
  // 4. Update UI
  document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.scene-btn[data-scene="${newScene}"]`).classList.add('active');

  // Update Title
  const titleInput = document.getElementById('scenario-title-input');
  titleInput.value = scenarioNames[newScene] || 'ESCENARIO ' + newScene;

  // Disable specific tools if not in Master
  const addButtons = document.querySelectorAll('[data-action^="add-"]');
  const eraserBtn = document.querySelector('[data-tool="eraser"]');
  
  if (currentScenario !== 'M') {
    addButtons.forEach(b => b.classList.add('disabled-tool'));
    eraserBtn.classList.add('disabled-tool');
    // If currently on Eraser, switch to Select
    if (currentTool === 'eraser') {
      document.querySelector('[data-tool="select"]').click();
    }
  } else {
    addButtons.forEach(b => b.classList.remove('disabled-tool'));
    eraserBtn.classList.remove('disabled-tool');
  }

  // Redraw
  stage.draw();
}

document.querySelectorAll('.scene-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    switchScenario(e.currentTarget.getAttribute('data-scene'));
  });
});

// Title editing
const sceneTitleInput = document.getElementById('scenario-title-input');
sceneTitleInput.addEventListener('input', (e) => {
  scenarioNames[currentScenario] = e.target.value.toUpperCase();
});
sceneTitleInput.addEventListener('blur', () => {
  if (typeof saveState === 'function') saveState();
});
sceneTitleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sceneTitleInput.blur();
});

// ========================================================
// 2. TOOL HANDLING
// ========================================================
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentTool = e.currentTarget.getAttribute('data-tool');

    const isDrawMode = currentTool.startsWith('draw');
    playersLayer.getChildren().forEach(child => {
      child.draggable(!isDrawMode && currentTool === 'select');
    });
  });
});

// ========================================================
// 2b. COLOR PICKER
// ========================================================
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentDrawColor = e.currentTarget.getAttribute('data-color');
  });
});

// ========================================================
// 3. ADDING ELEMENTS
// ========================================================
function addPlayer(team, text, x, y, bg, textColor, playerName = '', existingId = null) {
  const group = new Konva.Group({
    x: x || stage.width() / 2,
    y: y || stage.height() / 2,
    draggable: currentTool === 'select', // Draggable everywhere, but maybe editing is restricted
    name: 'player',
    id: existingId || ('player_' + Date.now() + '_' + Math.floor(Math.random()*1000))
  });
  group.setAttr('teamAlias', team);

  // Adding the new name label below the player
  const isBall = (team === 'ball');
  const r = isBall ? PLAYER_RADIUS * 0.7 : PLAYER_RADIUS;

  const circle = new Konva.Circle({
    radius: r,
    fill: bg,
    shadowColor: 'black',
    shadowBlur: 12,
    shadowOffset: { x: 0, y: 4 },
    shadowOpacity: 0.5,
    stroke: 'rgba(255,255,255,0.15)',
    strokeWidth: 1.5,
  });

  group.add(circle);

  if (text) {
    const label = new Konva.Text({
      text: text,
      fontSize: 22,
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      fill: textColor,
      width: r * 2,
      align: 'center',
      y: -11,
      x: -r,
      name: 'numText',
    });
    group.add(label);
  }

  const nameLabel = new Konva.Text({
    text: playerName,
    fontSize: Math.floor(r * 0.8),
    fontFamily: 'Inter, sans-serif',
    fontStyle: 'bold',
    fill: '#ffffff',
    width: r * 8, // Expanded width to accommodate longer names on one line
    align: 'center',
    y: r + 6,
    x: -r * 4, // Re-center based on expanded width
    name: 'nameText',
    wrap: 'none', // Explicitly prevent wrapping to a second line
  });
  group.add(nameLabel);

  if (isBall) {
    // Draw basketball lines on the ball
    const ballLineColor = 'rgba(0,0,0,0.3)';
    group.add(new Konva.Line({
      points: [-r, 0, r, 0], stroke: ballLineColor, strokeWidth: 1.5,
    }));
    group.add(new Konva.Line({
      points: [0, -r, 0, r], stroke: ballLineColor, strokeWidth: 1.5,
    }));
    group.add(new Konva.Arc({
      x: 0, y: 0, innerRadius: r * 0.45, outerRadius: r * 0.45,
      angle: 180, rotation: -90, stroke: ballLineColor, strokeWidth: 1.5,
    }));
    group.add(new Konva.Arc({
      x: 0, y: 0, innerRadius: r * 0.45, outerRadius: r * 0.45,
      angle: 180, rotation: 90, stroke: ballLineColor, strokeWidth: 1.5,
    }));
  }

  group.on('mouseenter', () => { if (currentTool === 'select') document.body.style.cursor = 'grab'; });
  group.on('mouseleave', () => { document.body.style.cursor = 'default'; });
  group.on('mousedown', () => { if (currentTool === 'select') document.body.style.cursor = 'grabbing'; });
  group.on('mouseup', () => { if (currentTool === 'select') document.body.style.cursor = 'grab'; });

  group.on('click tap', () => {
    if (currentTool === 'eraser' && currentScenario === 'M') {
      group.destroy();
      playersLayer.draw();
      if (typeof saveState === 'function') saveState();
    }
  });

  group.on('dragend', () => {
    if (typeof saveState === 'function') saveState();
  });

  group.on('dblclick dbltap', () => {
    if (currentTool === 'select' && team !== 'ball' && currentScenario === 'M') {
      openPlayerModal(group);
    }
  });

  playersLayer.add(group);
  playersLayer.draw();
}

document.querySelector('[data-action="add-player-home"]').addEventListener('click', () => {
  if (currentScenario !== 'M') return;
  addPlayer('home', playersCount.home.toString(), stage.width() / 2 - 60, stage.height() / 2, COLOR_HOME, '#fff');
  playersCount.home++;
  if (typeof saveState === 'function') saveState();
});

document.querySelector('[data-action="add-player-away"]').addEventListener('click', () => {
  if (currentScenario !== 'M') return;
  addPlayer('away', playersCount.away.toString(), stage.width() / 2 + 60, stage.height() / 2, COLOR_AWAY, '#fff');
  playersCount.away++;
  if (typeof saveState === 'function') saveState();
});

document.querySelector('[data-action="add-ball"]').addEventListener('click', () => {
  if (currentScenario !== 'M') return;
  const currentBalls = playersLayer.find('.player').filter(p => p.getAttr('teamAlias') === 'ball');
  if (currentBalls.length >= 2) return;
  
  addPlayer('ball', '', stage.width() / 2, stage.height() / 2 - 60, COLOR_BALL, '#000');
  if (typeof saveState === 'function') saveState();
});

document.querySelector('[data-action="clear-drawings"]').addEventListener('click', () => {
  drawLayer.destroyChildren();
  drawLayer.draw();
});

document.querySelector('[data-action="clear-all"]').addEventListener('click', () => {
  if (confirm('¿Estás seguro de reiniciar toda la pizarra? Se perderán jugadores y nombres guardados.')) {
    drawLayer.destroyChildren();
    playersLayer.destroyChildren();
    playersCount = { home: 1, away: 1 };
    localStorage.removeItem('tactics_board_state');
    drawLayer.draw();
    playersLayer.draw();
    location.reload(); // Quickest way to reset everything clean
  }
});

// ========================================================
// 3.5 MODAL LOGIC
// ========================================================
const modal = document.getElementById('player-modal');
const inputNum = document.getElementById('player-number');
const inputName = document.getElementById('player-name');
const btnCancel = document.getElementById('modal-cancel');
const btnSave = document.getElementById('modal-save');
let activeEditingGroup = null;

function openPlayerModal(group) {
  activeEditingGroup = group;
  const numText = group.findOne('.numText');
  const nameText = group.findOne('.nameText');
  
  inputNum.value = numText ? numText.text() : '';
  inputName.value = nameText ? nameText.text() : '';
  
  modal.classList.remove('hidden');
  setTimeout(() => inputNum.focus(), 50);
}

function closePlayerModal() {
  modal.classList.add('hidden');
  activeEditingGroup = null;
}

btnCancel.addEventListener('click', closePlayerModal);
btnSave.addEventListener('click', () => {
  if (activeEditingGroup) {
    const numText = activeEditingGroup.findOne('.numText');
    const nameText = activeEditingGroup.findOne('.nameText');
    
    if (numText) numText.text(inputNum.value.trim());
    if (nameText) nameText.text(inputName.value.trim().toUpperCase());
    
    playersLayer.draw();
    if (typeof saveState === 'function') saveState();
  }
  closePlayerModal();
});

// Bulk Modal Logic
const bulkModal = document.getElementById('bulk-modal');
const bulkTbody = document.getElementById('bulk-tbody');

function createBulkRow() {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" maxlength="2" class="bulk-num" placeholder="#"></td>
    <td><input type="text" maxlength="12" class="bulk-name" placeholder="Nombre"></td>
    <td>
      <select class="bulk-team">
        <option value="home">Rojo</option>
        <option value="away">Azul</option>
      </select>
    </td>
    <td>
      <button class="btn-remove-row" title="Quitar">
        <i data-lucide="minus"></i>
      </button>
    </td>
  `;
  tr.querySelector('.btn-remove-row').addEventListener('click', () => {
    tr.remove();
  });
  bulkTbody.appendChild(tr);
  lucide.createIcons({ root: tr });
}

document.querySelector('[data-action="bulk-add"]').addEventListener('click', () => {
  if (currentScenario !== 'M') return;
  bulkTbody.innerHTML = ''; // Limpiar filas anteriores
  for (let i = 0; i < 3; i++) createBulkRow(); // 3 filas por defecto
  bulkModal.classList.remove('hidden');
});

document.getElementById('add-bulk-row').addEventListener('click', createBulkRow);
document.getElementById('bulk-cancel').addEventListener('click', () => {
  bulkModal.classList.add('hidden');
});

document.getElementById('bulk-generate').addEventListener('click', () => {
  if (currentScenario !== 'M') return;
  const rows = bulkTbody.querySelectorAll('tr');
  const itemsToGenerate = [];
  
  rows.forEach(row => {
    const num = row.querySelector('.bulk-num').value.trim();
    const name = row.querySelector('.bulk-name').value.trim().toUpperCase();
    const team = row.querySelector('.bulk-team').value;
    if (num || name) {
      itemsToGenerate.push({ num, name, team });
    }
  });

  if (itemsToGenerate.length > 0) {
    let startX = stage.width() / 2 - ((itemsToGenerate.length - 1) * 35);
    const startY = stage.height() / 2 + 100; // Colocarlos abajo del logo
    
    itemsToGenerate.forEach((item, index) => {
      const bgColor = item.team === 'home' ? COLOR_HOME : COLOR_AWAY;
      addPlayer(item.team, item.num, startX + (index * 70), startY, bgColor, '#fff', item.name);
      playersCount[item.team]++;
    });
    
    if (typeof saveState === 'function') saveState();
  }
  
  bulkModal.classList.add('hidden');
});


document.querySelector('[data-action="undo"]').addEventListener('click', () => {
  const shapes = drawLayer.getChildren();
  if (shapes.length > 0) {
    shapes[shapes.length - 1].destroy();
    drawLayer.draw();
  }
});

// ========================================================
// 4. DRAWING LOGIC
// ========================================================
let isDrawing = false;
let currentLine;

stage.on('mousedown touchstart', (e) => {
  if (currentTool === 'select' || currentTool === 'eraser') return;
  const pos = stage.getPointerPosition();

  if (currentTool === 'draw-x' || currentTool === 'draw-circle') {
    const r = PLAYER_RADIUS;
    const half = r * 0.8; // Slightly smaller than radius for visual balance
    if (currentTool === 'draw-x') {
      const xGroup = new Konva.Group({ name: 'drawingX' });
      const line1 = new Konva.Line({
        points: [pos.x - half, pos.y - half, pos.x + half, pos.y + half],
        stroke: currentDrawColor, strokeWidth: 5, lineCap: 'round',
      });
      const line2 = new Konva.Line({
        points: [pos.x + half, pos.y - half, pos.x - half, pos.y + half],
        stroke: currentDrawColor, strokeWidth: 5, lineCap: 'round',
      });
      xGroup.add(line1, line2);
      xGroup.on('click tap', function () {
        if (currentTool === 'eraser') { this.destroy(); drawLayer.draw(); }
      });
      drawLayer.add(xGroup);
    } else {
      const circle = new Konva.Circle({
        x: pos.x, y: pos.y, radius: r,
        stroke: currentDrawColor, strokeWidth: 5,
        name: 'drawingCircle'
      });
      circle.on('click tap', function () {
        if (currentTool === 'eraser') { this.destroy(); drawLayer.draw(); }
      });
      drawLayer.add(circle);
    }
    drawLayer.draw();
    if (typeof saveState === 'function') saveState();
    return; // Don't start a line
  }

  isDrawing = true;
  let dash = [];
  if (currentTool === 'draw-dashed') {
    dash = [10, 10];
  }

  currentLine = new Konva.Line({
    stroke: currentDrawColor,
    strokeWidth: 3,
    globalCompositeOperation: 'source-over',
    points: [pos.x, pos.y],
    dash: dash,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0.5,
    name: 'drawingLine',
  });

  currentLine.setAttr('lineType', currentTool);
  currentLine.on('click tap', function () {
    if (currentTool === 'eraser') {
      this.destroy();
      drawLayer.draw();
    }
  });

  drawLayer.add(currentLine);
});

stage.on('mousemove touchmove', (e) => {
  if (!isDrawing) return;
  const pos = stage.getPointerPosition();
  const newPoints = currentLine.points().concat([pos.x, pos.y]);
  currentLine.points(newPoints);
  drawLayer.batchDraw();
});

stage.on('mouseup touchend', () => {
  if (!isDrawing) return;
  isDrawing = false;

  const type = currentLine.getAttr('lineType');
  const points = currentLine.points();
  const color = currentLine.stroke();

  if (points.length < 4) return;

  const endX = points[points.length - 2];
  const endY = points[points.length - 1];
  
  // Look back for a point far enough away to get a stable angle
  let prevX = points[points.length - 4];
  let prevY = points[points.length - 3];
  
  for (let i = points.length - 4; i >= 0; i -= 2) {
    const dx = endX - points[i];
    const dy = endY - points[i + 1];
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      prevX = points[i];
      prevY = points[i + 1];
      break;
    }
  }

  const dx = endX - prevX;
  const dy = endY - prevY;
  const angle = Math.atan2(dy, dx);

  if (type === 'draw-arrow') {
    const arrowLength = 18;
    const pt1 = [
      endX - arrowLength * Math.cos(angle - Math.PI / 6),
      endY - arrowLength * Math.sin(angle - Math.PI / 6),
    ];
    const pt2 = [
      endX - arrowLength * Math.cos(angle + Math.PI / 6),
      endY - arrowLength * Math.sin(angle + Math.PI / 6),
    ];

    const arrowHead = new Konva.Line({
      points: [pt1[0], pt1[1], endX, endY, pt2[0], pt2[1]],
      stroke: color,
      strokeWidth: 3,
      lineCap: 'round',
      lineJoin: 'round',
    });

    const group = new Konva.Group();
    currentLine.moveTo(group);
    group.add(arrowHead);
    group.on('click tap', function () {
      if (currentTool === 'eraser') { this.destroy(); drawLayer.draw(); }
    });
    drawLayer.add(group);
  } else if (type === 'draw-screen') {
    const tLength = 14;
    const pt1 = [
      endX - tLength * Math.cos(angle - Math.PI / 2),
      endY - tLength * Math.sin(angle - Math.PI / 2),
    ];
    const pt2 = [
      endX - tLength * Math.cos(angle + Math.PI / 2),
      endY - tLength * Math.sin(angle + Math.PI / 2),
    ];

    const screenHead = new Konva.Line({
      points: [pt1[0], pt1[1], pt2[0], pt2[1]],
      stroke: color,
      strokeWidth: 4,
      lineCap: 'round',
      lineJoin: 'round',
    });

    const group = new Konva.Group();
    currentLine.moveTo(group);
    group.add(screenHead);
    group.on('click tap', function () {
      if (currentTool === 'eraser') { this.destroy(); drawLayer.draw(); }
    });
    drawLayer.add(group);
  }

  drawLayer.draw();
});

// ========================================================
// 5. SESSION PERSISTENCE
// ========================================================
function saveState() {
  // 1. Force update the scenario map for current view
  playersLayer.getChildren().forEach(group => {
    if (group.name() === 'player') {
      scenarioPositions[currentScenario][group.id()] = { x: group.x(), y: group.y() };
    }
  });

  // 2. Build the players array natively for metadata (and legacy fallback)
  const players = [];
  playersLayer.getChildren().forEach(group => {
    if (group.name() === 'player') {
      const team = group.getAttr('teamAlias');
      const numText = group.findOne('.numText');
      const nameText = group.findOne('.nameText');
      players.push({
        id: group.id(),
        team: team,
        x: group.x(), // legacy fallback
        y: group.y(), // legacy fallback
        num: numText ? numText.text() : '',
        name: nameText ? nameText.text() : ''
      });
    }
  });
  
  const state = {
    players: players,
    counters: playersCount,
    scenarioPositions: scenarioPositions,
    scenarioNames: scenarioNames
  };
  localStorage.setItem('tactics_board_state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('tactics_board_state');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      if (state.counters) {
        playersCount = state.counters;
      }
      if (state.scenarioPositions) {
        Object.assign(scenarioPositions, state.scenarioPositions);
      }
      if (state.scenarioNames) {
        Object.assign(scenarioNames, state.scenarioNames);
        // Update current view title
        document.getElementById('scenario-title-input').value = scenarioNames[currentScenario];
      }
      
      if (state.players && state.players.length > 0) {
        state.players.forEach(p => {
          let bg, color;
          if (p.team === 'home') { bg = COLOR_HOME; color = '#fff'; }
          else if (p.team === 'away') { bg = COLOR_AWAY; color = '#fff'; }
          else { bg = COLOR_BALL; color = '#000'; }
          
          let startX = stage.width() / 2;
          let startY = stage.height() / 2;
          
          // Use 'M' position if available, fallback to legacy saved x/y
          if (scenarioPositions['M'] && scenarioPositions['M'][p.id]) {
             startX = scenarioPositions['M'][p.id].x;
             startY = scenarioPositions['M'][p.id].y;
          } else if (p.x !== undefined && p.y !== undefined) { 
             startX = p.x;
             startY = p.y;
          }
          
          addPlayer(p.team, p.num, startX, startY, bg, color, p.name, p.id || null);
        });
        return;
      }
    } catch(e) {
      console.error('Error loading state', e);
    }
  }

  // Fallback to default players
  addPlayer('home', '1', stage.width() / 2 - 60, stage.height() / 2 - 60, COLOR_HOME, '#fff');
  addPlayer('away', '1', stage.width() / 2 + 60, stage.height() / 2 - 60, COLOR_AWAY, '#fff');
  addPlayer('ball', '', stage.width() / 2, stage.height() / 2, COLOR_BALL, '#000');
  playersCount.home++;
  playersCount.away++;
}

// Load state at initialization
setTimeout(loadState, 100);
