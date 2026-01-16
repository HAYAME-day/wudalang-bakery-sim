// events/datingEvents.js

// 1. 小游戏配置与不同角色的文案
const miniGameConfig = {
    // 土耳其冰激凌（喂食大作战）
    'feed_game': {
        name: "喂食大作战",
        desc: "把勺子里的食物准确送到他嘴里！小心他会躲哦……",
        // ★ 升级：台词改为数组，支持多句随机
        dialogues: {
            'jinlian': {
                start: "官人，想喂奴家？那就看你手够不够快了~",
                hit: [
                    "哎呀，被你喂到了~❤️", 
                    "官人好坏~", 
                    "嗯……真甜~",
                    "再来一口~"
                ],
                miss: "嘻嘻，抓不到奴家呀~",
                win: "官人真坏……不过奴家喜欢。",
                lose: "官人笨手笨脚的，奴家自己吃吧。"
            },
            'ximen': {
                start: "喂我……真的？",
                hit: [
                    "唔……好味……", 
                    "那个、舔到你手指了……不好意思……", 
                    "（小声）居然能被你喂感觉好幸福……", 
                    "还想要……"
                ],
                miss: "（小声）可惜……",
                win: "你、你好厉害……手也好、好灵活啊……",
                lose: "要放弃、吗？呜……"
            },
            'wusong': {
                start: "姐姐不必麻烦……哎？这是做什么？要喂我？",
                hit: [
                    "唔！（脸红）", 
                    "姐姐……", 
                    "姐姐太、太近了……", 
                    "这……多谢姐姐。"
                ],
                miss: "姐姐，别闹了……",
                win: "多谢姐姐疼我……（不知所措）",
                lose: "呼，终于……快害羞而死了……"
            }
        }
    }
};

// 2. 启动约会事件的主入口
window.startDatingEvent = function(guest) {
    //必须清场防止冲突，先把残留窗口关掉
    let oldOverlay = document.getElementById('dating-overlay');
    if(oldOverlay) {
        oldOverlay.remove();
    }
    //把残留的定时器也清掉
    if(window.currentDatingTimers) {
        window.currentDatingTimers.forEach(t => clearInterval(t));
        window.currentDatingTimers = [];
    }
    let gameType = 'feed_game'; // 目前固定一种，以后可扩展
    let config = miniGameConfig[gameType];
    let charId = guest.charId || 'jinlian';//要是出错了没找到对应的就用金莲的兜底
    let texts = config.dialogues[charId];
    if (!texts) {
        console.warn(`没找到 ${charId}对应台词，使用金莲台词兜底。`);
        texts = config.dialogues['jinlian'];
    }

    // 创建 UI
    let overlay = document.createElement('div');
    overlay.className = 'dating-overlay';
    overlay.id = 'dating-overlay';
    
    // 动态显示剩余时间数字
    overlay.innerHTML = `
        <div style="text-align:center; margin-bottom:10px;">
            <h2>💕 ${config.name}</h2>
            <p>${texts.start}</p>
        </div>
        
        <div class="minigame-container" id="game-area">
            <div style="position:absolute; top:10px; left:10%; width:80%; height:12px; background:#ddd; border-radius:6px; overflow:hidden; border:2px solid #fff;">
                <div id="game-timer" style="width:100%; height:100%; background:#ff4757; transition: width 0.1s linear;"></div>
            </div>
            <div id="game-timer-text" style="position:absolute; top:25px; left:0; width:100%; text-align:center; font-size:12px; color:#666; font-weight:bold;">10.0s</div>
            
            <div id="game-target" class="ice-cream-target">🥄</div>

            <div class="dating-char-portrait" style="font-size:80px;">${guest.emoji}</div>
        </div>

        <button class="unlock-btn" onclick="quitDating(false)" style="margin-top:20px; background:#666;">放弃</button>
    `;
    
    document.body.appendChild(overlay);

    if (gameType === 'feed_game') {
        playFeedGame(guest, texts, overlay);
    }
};

// 3. 具体的小游戏逻辑：土耳其冰激凌
function playFeedGame(guest, texts, overlay) {
    let target = overlay.querySelector('#game-target');
    let timerBar = overlay.querySelector('#game-timer');
    let timerText = overlay.querySelector('#game-timer-text');
    let area = overlay.querySelector('#game-area');
    let score = 0;
    
    // ★ 修复：使用毫秒倒计时，更精准
    let maxTimeMs = 10000; // 10秒
    let timeLeftMs = maxTimeMs;
    let moveSpeed = 800; //西门庆是默认的速度

    // 个性化难度
    if (guest.charId === 'wusong') moveSpeed = 1000;     //武松老实，动得慢
    if (guest.charId === 'jinlian') moveSpeed = 600;  //金莲灵活，动得快

    // 随机移动
    function moveTarget() {
        //使用闭包里的area和target所以就不用再查找了
        if(!area || !target) return; //防报错
        let maxX = area.clientWidth - 60;
        let maxY = area.clientHeight - 100; //留出底部给立绘
        
        target.style.left = Math.random() * maxX + 'px';
        target.style.top = (Math.random() * (maxY - 40)) + 40 + 'px'; 
    }
    //随机台词获取器
    function getRandomLine(arr) {
        if(Array.isArray(arr)) {
            return arr[Math.floor(Math.random() * arr.length)];
        }
        return arr; // 如果不是数组，直接返回字符串
    }

    // 点击事件
    target.onmousedown = function(e) {
        e.stopPropagation(); // 防止点透
        score++;
        
        //每次点击都冒一句不同的台词
        let hitLine = getRandomLine(texts.hit);
        window.pushText(`💖 ${guest.name}: ${hitLine}`);

        //难度递增：越点越快
        moveSpeed *= 0.9;
        clearInterval(moveTimer);
        moveTimer = setInterval(moveTarget, moveSpeed);

        //特效反馈
        target.innerHTML = "✨";
        target.style.transform = "scale(1.2)";
        setTimeout(() => {
            target.innerHTML = "🥄";
            target.style.transform = "scale(1)";
        }, 150);

        moveTarget();
        
        // 胜利判断：点中3次
        if(score >= 5) {
            endGame(true, guest, texts);
        }
    };

    // 初始移动一次
    moveTarget();

    // 移动定时器
    let moveTimer = setInterval(moveTarget, moveSpeed);

    // ★ 倒计时循环 (确保不会因为报错而停止)
    let startTime = Date.now();
    let gameLoop = setInterval(() => {
        let elapsed = Date.now() - startTime;
        timeLeftMs = maxTimeMs - elapsed;

        if (timeLeftMs <= 0) {
            timeLeftMs = 0;
            clearInterval(gameLoop);
            clearInterval(moveTimer);
            endGame(false, guest, texts);
        }

        // 刷新 UI
        if (timerBar) timerBar.style.width = (timeLeftMs / maxTimeMs * 100) + '%';
        if (timerText) timerText.textContent = (timeLeftMs / 1000).toFixed(1) + 's';

    }, 50);

    window.currentDatingTimers = [moveTimer, gameLoop];
}

//结算
function endGame(isWin, guest, texts) {
    if (window.currentDatingTimers) {
        window.currentDatingTimers.forEach(t => clearInterval(t));
        window.currentDatingTimers = [];
    }

    let overlay = document.getElementById('dating-overlay');
    if(!overlay) return;

    let resultHtml = isWin 
        ? `<h1 style="color:#ff4757">大成功! ❤️</h1><p>${texts.win}</p>`
        : `<h1 style="color:#aaa">时间到... 💔</h1><p>${texts.lose}</p>`;

    if (isWin) {
        window.addFavorability(guest.charId, 2); 
        window.pushText(`与 ${guest.name} 约会成功！好感度大幅提升！`);
    } else {
        window.addFavorability(guest.charId, 1);
        window.pushText(`虽然有些笨拙，但 ${guest.name} 似乎很开心。`);
    }

    overlay.innerHTML = `
        <div style="text-align:center; animation: popIn 0.3s;">
            <div style="font-size:60px; margin-bottom:20px;">${guest.emoji}</div>
            ${resultHtml}
            <button class="unlock-btn" onclick="quitDating(true)">回到柜台</button>
        </div>
    `;
}

window.quitDating = function(finished) {
    if (window.currentDatingTimers) {
        window.currentDatingTimers.forEach(t => clearInterval(t));
        window.currentDatingTimers = [];
    }
    let overlay = document.getElementById('dating-overlay');
    if(overlay) overlay.remove();
    
    if (window.showPauseMenuAfterStory) {
        window.showPauseMenuAfterStory();
    }
}