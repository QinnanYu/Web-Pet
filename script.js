const pet = document.getElementById('pet');
const menu = document.getElementById('right-menu');
const clockToast = document.getElementById('clock-toast');

let happiness = 100;
let energy = 100;
let statsVisible = true;
let petVisible = true;
let isDead = false;
let isAction = false;

let drag = false, offX, offY;
let actionTimer = null;
let clockTimer = null;
let idleTimer = null;
let speechTimer = null;

// 疯狂点击彩蛋
let clickCount = 0;
let clickResetTimer = null;

// ===== 新增：位置与自动走路 =====
let petX = window.innerWidth * 0.3;
let petY = window.innerHeight * 0.3;

let walkTimer = null;
let stopWalkTimeout = null;
let isWalking = false;
let walkDirection = 1; // 1 = 向右，-1 = 向左
let walkSpeed = 2;

// ===== 对话气泡位置 =====
function updateToastPosition() {
    clockToast.style.left = petX + 90 + 'px';
    clockToast.style.top = petY - 20 + 'px';
}

function syncPetPosition() {
    pet.style.left = petX + 'px';
    pet.style.top = petY + 'px';
    updateToastPosition();
}

function hideToast() {
    clockToast.style.display = 'none';
    if (speechTimer) {
        clearTimeout(speechTimer);
        speechTimer = null;
    }
}

function speak(text, ms = 3000) {
    if (isDead || !petVisible) return;

    if (speechTimer) {
        clearTimeout(speechTimer);
    }

    clockToast.innerText = text;
    updateToastPosition();
    clockToast.style.display = 'block';

    speechTimer = setTimeout(() => {
        clockToast.style.display = 'none';
        speechTimer = null;
    }, ms);
}

// ===== 新增：自动走路 =====
function stopWalking() {
    if (walkTimer) {
        clearInterval(walkTimer);
        walkTimer = null;
    }
    if (stopWalkTimeout) {
        clearTimeout(stopWalkTimeout);
        stopWalkTimeout = null;
    }

    isWalking = false;

    if (!isDead && !isAction) {
        updateUI();
    }
}

function startWalking(duration = 4000) {
    if (isDead || isAction || drag || !petVisible || isWalking) return;

    isWalking = true;
    pet.className = 'pet walkdog';

    walkTimer = setInterval(() => {
        if (isDead || isAction || drag || !petVisible) {
            stopWalking();
            return;
        }

        petX += walkDirection * walkSpeed;

        const maxX = window.innerWidth - 200;
        const maxY = window.innerHeight - 200;

        if (petX <= 0) {
            petX = 0;
            walkDirection = 1;
        } else if (petX >= maxX) {
            petX = maxX;
            walkDirection = -1;
        }

        if (petY < 0) petY = 0;
        if (petY > maxY) petY = maxY;

        syncPetPosition();
    }, 40);

    stopWalkTimeout = setTimeout(() => {
        stopWalking();
    }, duration);
}

function randomWalkChance() {
    if (isDead || isAction || drag || !petVisible || isWalking) return;

    const chance = Math.random();

    if (chance < 0.65) {
        walkDirection = Math.random() < 0.5 ? -1 : 1;
        const duration = 3000 + Math.random() * 4000; // 3~7 秒
        startWalking(duration);
    } else {
        autoBehavior();
    }
}

// ===== 拖拽 =====
pet.addEventListener('mousedown', e => {
    stopWalking();
    drag = true;
    offX = e.clientX - petX;
    offY = e.clientY - petY;
    pet.style.cursor = 'grabbing';
    resetIdle();
});

document.addEventListener('mousemove', e => {
    if (!drag) return;

    petX = e.clientX - offX;
    petY = e.clientY - offY;

    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 200;

    if (petX < 0) petX = 0;
    if (petX > maxX) petX = maxX;
    if (petY < 0) petY = 0;
    if (petY > maxY) petY = maxY;

    syncPetPosition();
});

document.addEventListener('mouseup', () => {
    drag = false;
    pet.style.cursor = 'grab';
});

// ===== 右键菜单 =====
pet.addEventListener('contextmenu', e => {
    e.preventDefault();
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    resetIdle();
});

document.addEventListener('click', e => {
    if (e.target !== pet) {
        menu.style.display = 'none';
    }
});

// ===== 疯狂点击隐藏彩蛋 =====
pet.addEventListener('click', () => {
    resetIdle();

    clickCount++;

    if (clickResetTimer) {
        clearTimeout(clickResetTimer);
    }

    clickResetTimer = setTimeout(() => {
        clickCount = 0;
        clickResetTimer = null;
    }, 1000);

    if (clickCount >= 5) {
        clickCount = 0;
        dizzyEasterEgg();
    }
});

// ===== 只更新数值UI =====
function updateBarsOnly() {
    document.getElementById('happiness-bar').style.width = happiness + '%';
    document.getElementById('energy-bar').style.width = energy + '%';
    document.getElementById('happiness-text').innerText = happiness;
    document.getElementById('energy-text').innerText = energy;
}

// ===== 更新整体UI =====
function updateUI() {
    updateBarsOnly();
    updateState();
}

// ===== 状态动画 =====
function updateState() {
    if (isAction || isWalking) return;

    if (isDead) {
        pet.className = 'pet dead';
        return;
    }

    if (happiness === 0 && energy === 0) {
        petDie();
        return;
    }

    if (happiness < 20 && energy < 20) {
        pet.className = 'pet angry';
        return;
    }

    if (happiness < 20) {
        pet.className = 'pet crying2';
        return;
    }

    if (energy < 20) {
        pet.className = 'pet crying';
        return;
    }

    if (energy < 40) {
        pet.className = 'pet hungry';
        return;
    }

    const states = ['normal', 'normal', 'normal2', 'normal2', 'working2'];
    const randomState = states[Math.floor(Math.random() * states.length)];
    pet.className = 'pet ' + randomState;
}

// ===== 长时间不理 =====
function resetIdle() {
    if (idleTimer) {
        clearTimeout(idleTimer);
    }

    idleTimer = setTimeout(() => {
        if (!isDead && !isAction && !isWalking) {
            pet.className = 'pet boring';
            speak('小白，你怎么不理我啦……', 3000);
        }
    }, 60000);
}

// ===== 自动掉属性 =====
setInterval(() => {
    if (isDead) return;

    happiness = Math.max(0, happiness - 1);
    energy = Math.max(0, energy - 1);
    updateUI();
}, 10000);

// ===== 整点报时 =====
setInterval(() => {
    const now = new Date();
    if (now.getMinutes() === 0 && now.getSeconds() === 0) {
        showClock(now.getHours());
    }
}, 1000);

// ===== 每 10 秒尝试自动行动/散步 =====
setInterval(() => {
    randomWalkChance();
}, 10000);

function clearCurrentAction() {
    if (actionTimer) {
        clearTimeout(actionTimer);
        actionTimer = null;
    }
    if (clockTimer) {
        clearTimeout(clockTimer);
        clockTimer = null;
    }
}

function showClock(h) {
    if (isDead) return;

    stopWalking();
    clearCurrentAction();
    isAction = true;
    pet.className = 'pet clock';

    speak(`现在是 ${h} 点整噢！`, 9500);

    clockTimer = setTimeout(() => {
        isAction = false;
        clockTimer = null;
        updateUI();
        resetIdle();
    }, 9500);
}

// ===== 死亡 =====
function petDie() {
    isDead = true;
    stopWalking();
    clearCurrentAction();
    hideToast();
    pet.className = 'pet dead';

    setTimeout(() => {
        isDead = false;
        happiness = 30;
        energy = 30;
        updateUI();
        speak('我又活过来啦！', 3000);
        resetIdle();
    }, 30000);
}

// ===== 随机位置 =====
function randomPos() {
    const w = window.innerWidth - 200;
    const h = window.innerHeight - 200;
    petX = Math.random() * w;
    petY = Math.random() * h;
    syncPetPosition();
}

// ===== 通用动作函数 =====
function act(gif, hp, en, ms, text = '') {
    if (isDead) return;

    stopWalking();
    clearCurrentAction();
    isAction = true;
    pet.className = 'pet ' + gif;

    happiness = Math.min(100, Math.max(0, happiness + hp));
    energy = Math.min(100, Math.max(0, energy + en));

    updateBarsOnly();
    resetIdle();

    if (text) {
        speak(text, Math.min(ms, 3000));
    }

    actionTimer = setTimeout(() => {
        isAction = false;
        actionTimer = null;
        updateUI();
        resetIdle();
    }, ms);
}

// ===== 疯狂点击彩蛋 =====
function dizzyEasterEgg() {
    if (isDead) return;

    stopWalking();
    clearCurrentAction();
    isAction = true;
    pet.className = 'pet caidan';

    updateBarsOnly();
    resetIdle();

    speak('小白，我被rua炸毛啦！！', 3000);

    actionTimer = setTimeout(() => {
        isAction = false;
        actionTimer = null;
        updateUI();
        resetIdle();
    }, 3000);
}

// ===== 宠物自动行为 =====
function autoBehavior() {
    if (isDead || isAction || drag || !petVisible || isWalking) return;

    const autoActions = [
        {
            gif: 'normal2',
            text: '小白，我在发呆哦~',
            ms: 3000
        },
        {
            gif: 'working2',
            text: '今天也要认真营业！',
            ms: 3500
        },
        {
            gif: 'appear',
            text: '嘿嘿，我换个地方出现！',
            ms: 3500,
            move: true
        }
    ];

    const a = autoActions[Math.floor(Math.random() * autoActions.length)];

    stopWalking();
    clearCurrentAction();
    isAction = true;
    pet.className = 'pet ' + a.gif;

    if (a.move) {
        randomPos();
    }

    speak(a.text, 2500);
    resetIdle();

    actionTimer = setTimeout(() => {
        isAction = false;
        actionTimer = null;
        updateUI();
        resetIdle();
    }, a.ms);
}

// ===== 所有互动功能 =====
function stick() {
    act('stick', 15, -5, 6000, '贴贴最开心啦～');
}

function call() {
    act('call', 0, 0, 2000, '拍拍我干嘛呀？');
}

function exercise() {
    act('exercise', 5, -15, 6000, '运动一下更有精神！');
}

function charge() {
    act('charge', 30, 30, 6000, '充电中，请勿打扰～');
}

function cake() {
    if (energy >= 80) {
        act('full', 0, 0, 3000, '吃不下啦，肚肚圆圆！');
    } else {
        act('cake', 10, 5, 4000, '好耶，有好吃的！');
    }
}

function baji() {
    act('baji', 10, 0, 4000, '吧唧吧唧，真香！');
}

function baji2() {
    act('baji2', 15, -10, 4000, '小白，这个也好吃！');
}

function appear() {
    if (isDead) return;

    stopWalking();
    clearCurrentAction();
    isAction = true;
    pet.className = 'pet appear';
    randomPos();
    updateBarsOnly();
    speak('锵锵！我又出现啦！', 2500);
    resetIdle();

    actionTimer = setTimeout(() => {
        isAction = false;
        actionTimer = null;
        updateUI();
        resetIdle();
    }, 3500);
}

function walkDog() {
    act('walkdog', 15, -10, 6000, '出去散散步～');
}

function toggleStats() {
    statsVisible = !statsVisible;
    document.getElementById('status-panel').style.display = statsVisible ? 'block' : 'none';
    resetIdle();
}

function toggleHide() {
    petVisible = !petVisible;
    pet.style.opacity = petVisible ? '1' : '0';

    if (!petVisible) {
        stopWalking();
        hideToast();
    } else {
        speak('我回来啦！', 2000);
    }

    resetIdle();
}

window.addEventListener('resize', () => {
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 200;

    if (petX > maxX) petX = maxX;
    if (petY > maxY) petY = maxY;
    if (petX < 0) petX = 0;
    if (petY < 0) petY = 0;

    syncPetPosition();
});

// ===== 初始化 =====
syncPetPosition();
updateUI();
resetIdle();
