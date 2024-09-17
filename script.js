// 요소 선택
const gridElement = document.getElementById('grid'); // 그리드 요소
const commandListElement = document.getElementById('command-list'); // 명령 목록 요소
const executeButton = document.getElementById('execute'); // 실행 버튼
const resetButton = document.getElementById('reset'); // 리셋 버튼
const blockMenu = document.getElementById('block-menu'); // 블록 메뉴
const blockNumberElement = document.getElementById('block-number'); // 사용한 블록 수 표시
const levelIndicator = document.getElementById('current-level'); // 현재 레벨 표시
let maxBlockCountElement; // 최대 블록 수 표시 요소 (초기화는 나중에)

// 게임 상태 변수
const gridSize = 5; // 그리드 크기 (5x5)
let grid = []; // 그리드 배열
let robot = {}; // 로봇의 위치와 방향 정보
let blockCount = 0; // 사용한 블록 수
let currentLevel = 0; // 현재 레벨 (0부터 시작)
let developerMode = false; // 개발자 모드 여부

// 레벨 정보 배열
const levels = [
  // 레벨 1
  {
    obstacles: [
      [1, 1],
      [3, 3],
      [1, 3],
      [3, 1],
    ],
    startX: 2,
    startY: 2,
    startDirection: 180,
    optimalBlockCount: 6, //6개면 충분함 ㄹㅇ
  },
  // 레벨 2
  {
    obstacles: [
      [0, 0],
      [4, 4],
    ],
    startX: 0,
    startY: 4,
    startDirection: 0,
    optimalBlockCount: 100,
  },
  // 레벨 3
  {
    obstacles: [
      [1, 2],
      [2, 1],
      [2, 2],
      [2, 3],
      [3, 2],
    ],
    startX: 0,
    startY: 0,
    startDirection: 90,
    optimalBlockCount: 8,
  },
  // 레벨 4
  {
    obstacles: [
      [2, 0],
      [2, 2],
      [2, 4],
    ],
    startX: 0,
    startY: 2,
    startDirection: 0,
    optimalBlockCount: 15,
  },
  // 레벨 5
  {
    obstacles: [
      [0, 1],
      [2, 1],
      [4, 1],
      [0, 3],
      [2, 3],
      [4, 3],
    ],
    startX: 0,
    startY: 2,
    startDirection: 90,
    optimalBlockCount: 15,
  },
];

// 최대 블록 개수 계산 및 표시
function updateMaxBlockCount() {
  const maxBlocks = levels[currentLevel].optimalBlockCount + 2; // 최적 블록 수 + 2
  maxBlockCountElement.textContent = maxBlocks; // 화면에 표시
}

// 그리드 초기화
function initGrid() {
  gridElement.innerHTML = ''; // 그리드 요소 초기화
  grid = []; // 그리드 배열 초기화
  const levelData = levels[currentLevel]; // 현재 레벨 데이터 가져오기

  // 로봇 초기 위치 설정
  robot = {
    x: levelData.startX,
    y: levelData.startY,
    direction: levelData.startDirection,
  };

  // 그리드 생성
  for (let y = 0; y < gridSize; y++) {
    let row = [];
    for (let x = 0; x < gridSize; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (isObstacle(x, y)) {
        cell.classList.add('obstacle');
        cell.innerText = 'X'; // 장애물 표시
      }
      gridElement.appendChild(cell);
      row.push(cell);
    }
    grid.push(row);
  }

  placeRobot(); // 로봇 배치
  updateMaxBlockCount(); // 최대 블록 수 업데이트
}

// 장애물 위치 확인
function isObstacle(x, y) {
  const obstacles = levels[currentLevel].obstacles; // 현재 레벨의 장애물 위치 배열
  return obstacles.some(([ox, oy]) => ox === x && oy === y);
}

// 로봇 배치
function placeRobot() {
  const cell = grid[robot.y][robot.x];
  const robotElement = document.createElement('div');
  robotElement.classList.add('robot');
  robotElement.style.transform = `rotate(${robot.direction}deg)`; // 로봇의 방향 설정
  cell.appendChild(robotElement);
  cell.classList.add('cleaned'); // 청소된 칸으로 표시
}

// 로봇 위치 업데이트
function updateRobotPosition() {
  const robotElement = document.querySelector('.robot');
  robotElement.style.transform = `rotate(${robot.direction}deg)`; // 로봇의 방향 업데이트
  robotElement.parentElement.classList.add('cleaned'); // 현재 칸을 청소된 칸으로 표시
}

// 블록 추가 및 제거 기능 구현
function setupBlocks() {
  // 블록 메뉴의 블록들을 초기화
  blockMenu.querySelectorAll('.block').forEach(block => {
    block.addEventListener('dblclick', () => {
      const clone = createBlock(block); // 블록 복제
      commandListElement.appendChild(clone); // 명령 목록에 추가
      updateBlockCount(); // 블록 수 업데이트
    });
  });
}

// 블록 복제 및 데이터 설정
function createBlock(block) {
  const clone = block.cloneNode(true); // 블록 복제

  // 블록을 더블 클릭하여 제거
  clone.addEventListener('dblclick', (e) => {
    if (confirm('이 블록을 삭제하시겠습니까?')) {
      clone.remove(); // 블록 제거
      updateBlockCount(); // 블록 수 업데이트
    }
    e.stopPropagation(); // 이벤트 버블링 방지 (알림이 두 번 뜨는 현상 방지)
  });

  // 이동 블록 값 설정
  if (clone.classList.contains('move-block')) {
    const input = block.querySelector('.block-input');
    let steps = parseInt(input.value, 10);
    steps = isNaN(steps) ? 1 : Math.min(Math.max(steps, 1), 10); // 1~10 사이의 값으로 제한
    clone.dataset.action = `move${steps}`;
    clone.textContent = `앞으로 ${steps}칸 이동`;
  }

  // 회전 블록 값 설정
  if (clone.classList.contains('turn-block')) {
    const select = block.querySelector('.block-select');
    const direction = select.value;
    let directionText = '';
    if (direction === 'left') directionText = '왼쪽으로 회전';
    else if (direction === 'back') directionText = '뒤로 회전';
    else if (direction === 'right') directionText = '오른쪽으로 회전';
    clone.dataset.action = `turn-${direction}`;
    clone.textContent = `방향을 ${directionText}`;
  }

  // 바라보기 블록 값 설정 (새로 추가된 부분)
  if (clone.classList.contains('face-block')) {
    const select = block.querySelector('.block-select');
    const direction = select.value;
    let directionText = '';
    if (direction === 'up') directionText = '위쪽';
    else if (direction === 'down') directionText = '아래쪽';
    else if (direction === 'left') directionText = '왼쪽';
    else if (direction === 'right') directionText = '오른쪽';
    clone.dataset.action = `face-${direction}`;
    clone.textContent = `바라보기 ${directionText}`;
  }

  // 반복문 블록 값 설정
  if (clone.classList.contains('loop-block')) {
    const input = block.querySelector('.block-input');
    let times = parseInt(input.value, 10);
    times = isNaN(times) ? 2 : Math.min(Math.max(times, 1), 10); // 1~10 사이의 값으로 제한
    clone.dataset.action = `loop${times}`;
    clone.textContent = `반복하기 ${times}번`;
  }

  // 반복 종료 블록 처리
  if (clone.classList.contains('end-loop-block')) {
    clone.dataset.action = 'end-loop';
  }

  return clone;
}

// 블록 개수 업데이트
function updateBlockCount() {
  const allBlocks = commandListElement.querySelectorAll('.block');
  blockCount = allBlocks.length; // 블록 수 계산
  blockNumberElement.textContent = blockCount; // 화면에 표시
}

// 명령 실행
executeButton.addEventListener('click', async () => {
  const maxBlocks = levels[currentLevel].optimalBlockCount + 2; // 최대 블록 수
  if (blockCount > maxBlocks) {
    alert('사용한 블록 수가 최대 블록 수를 초과했습니다!');
    return;
  }
  initGrid(); // 맵을 초기 상태로 리셋
  const commands = Array.from(commandListElement.children); // 명령 목록 가져오기
  await executeCommands(commands); // 명령 실행
  checkWinCondition(); // 승리 조건 확인
});

// 명령 실행 함수 (반복문 처리)
async function executeCommands(commands) {
  let i = 0;
  while (i < commands.length) {
    const command = commands[i];
    if (command.dataset.action.startsWith('loop')) {
      // 반복문 처리
      const loopCount = parseInt(command.dataset.action.replace('loop', ''), 10);
      const loopCommands = [];
      let loopLevel = 1;
      i++;
      while (i < commands.length && loopLevel > 0) {
        if (commands[i].dataset.action.startsWith('loop')) {
          loopLevel++;
        } else if (commands[i].dataset.action === 'end-loop') {
          loopLevel--;
          if (loopLevel === 0) break;
        }
        if (loopLevel > 0) {
          loopCommands.push(commands[i]);
        }
        i++;
      }
      // 반복 실행
      for (let j = 0; j < loopCount; j++) {
        await executeCommands(loopCommands);
      }
      i++; // 'end-loop' 블록 다음으로 이동
    } else if (command.dataset.action === 'end-loop') {
      // 반복 종료 블록은 여기서 처리하지 않음
      i++;
    } else {
      // 개별 명령 실행
      await executeCommand(command);
      i++;
    }
  }
}

// 개별 명령 실행
async function executeCommand(command) {
  const action = command.dataset.action;
  if (action.startsWith('move')) {
    // 이동 명령
    const steps = parseInt(action.replace('move', ''), 10);
    await moveForward(steps);
  } else if (action.startsWith('turn')) {
    // 회전 명령
    let degrees = 0;
    if (action === 'turn-left') degrees = -90;
    else if (action === 'turn-right') degrees = 90;
    else if (action === 'turn-back') degrees = 180;
    rotate(degrees);
    await sleep(500);
  } else if (action.startsWith('face')) {
    // 바라보기 명령 (새로 추가된 부분)
    const direction = action.replace('face-', '');
    let degrees = 0;
    if (direction === 'up') degrees = 0;
    else if (direction === 'right') degrees = 90;
    else if (direction === 'down') degrees = 180;
    else if (direction === 'left') degrees = 270;
    robot.direction = degrees; // 로봇의 방향 설정
    updateRobotPosition(); // 로봇 위치 업데이트
    await sleep(500);
  }
}

// 이동 함수 (애니메이션 포함)
async function moveForward(steps) {
  for (let i = 0; i < steps; i++) {
    const nextPos = getNextPosition();
    if (isInsideGrid(nextPos.x, nextPos.y) && !isObstacle(nextPos.x, nextPos.y)) {
      moveRobotTo(nextPos.x, nextPos.y);
      await sleep(500);
    } else {
      alert('벽에 부딪혔습니다!');
      break;
    }
  }
}

// 로봇 이동
function moveRobotTo(x, y) {
  const currentCell = grid[robot.y][robot.x];
  const robotElement = currentCell.querySelector('.robot');
  currentCell.removeChild(robotElement); // 현재 위치에서 로봇 제거

  robot.x = x;
  robot.y = y;

  const newCell = grid[robot.y][robot.x];
  newCell.appendChild(robotElement); // 새로운 위치에 로봇 배치
  newCell.classList.add('cleaned'); // 청소된 칸으로 표시
}

// 다음 위치 계산
function getNextPosition() {
  let x = robot.x;
  let y = robot.y;
  // 현재 방향에 따라 다음 위치 계산
  switch ((robot.direction % 360 + 360) % 360) {
    case 0: // 위쪽
      y -= 1;
      break;
    case 90: // 오른쪽
      x += 1;
      break;
    case 180: // 아래쪽
      y += 1;
      break;
    case 270: // 왼쪽
      x -= 1;
      break;
  }
  return { x, y };
}

// 그리드 내부 확인
function isInsideGrid(x, y) {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
}

// 회전
function rotate(degrees) {
  robot.direction = (robot.direction + degrees + 360) % 360; // 새로운 방향 계산
  updateRobotPosition(); // 로봇 위치 업데이트
}

// 지연 함수 (애니메이션 타이밍)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Reset 버튼 클릭 이벤트
resetButton.addEventListener('click', () => {
  initGrid(); // 그리드 초기화
  commandListElement.innerHTML = ''; // 명령 목록 초기화
  updateBlockCount(); // 블록 수 업데이트
});

// 승리 조건 확인
function checkWinCondition() {
  const allCleaned = grid.flat().every(cell => {
    return cell.classList.contains('cleaned') || cell.classList.contains('obstacle');
  });
  if (allCleaned) {
    alert('Clear!');
    if (currentLevel < levels.length - 1) {
      currentLevel++;
      levelIndicator.textContent = currentLevel + 1;
      initGrid();
      commandListElement.innerHTML = '';
      updateBlockCount();
    } else {
      // 마지막 레벨을 클리어한 경우
      window.location.href = 'congratulations.html';
    }
  }
}

// 개발자 모드 설정 (새로 추가된 부분)
function setupDeveloperMode() {
  const developerModeContainer = document.getElementById('developer-mode');
  const levelInput = document.getElementById('level-input');
  const setLevelButton = document.getElementById('set-level');

  setLevelButton.addEventListener('click', () => {
    const level = parseInt(levelInput.value, 10);
    if (!isNaN(level) && level >= 1 && level <= levels.length) {
      currentLevel = level - 1;
      levelIndicator.textContent = currentLevel + 1;
      initGrid();
      commandListElement.innerHTML = '';
      updateBlockCount();
    } else {
      alert(`레벨은 1부터 ${levels.length} 사이의 숫자여야 합니다.`);
    }
  });
}

// 초기화
function initializeGame() {
  currentLevel = 0;
  levelIndicator.textContent = currentLevel + 1;

  // 최대 블록 수 표시를 위한 요소 추가
  const maxBlockCountContainer = document.createElement('div');
  maxBlockCountContainer.classList.add('mt-2');
  maxBlockCountContainer.innerHTML = '최대 블록 수: <span id="max-block-number">0</span>';
  document.querySelector('.col-md-7').appendChild(maxBlockCountContainer);

  // 이제 요소가 DOM에 추가되었으므로, 여기서 가져옵니다.
  maxBlockCountElement = document.getElementById('max-block-number');

  initGrid();
  setupBlocks();

  // 개발자 모드 설정
  setupDeveloperMode();
}

initializeGame();
