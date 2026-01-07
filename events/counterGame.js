//柜台经营游戏部分

let currentCustomers = []; 
let maxQueueLength = 3;    
let businessTimer = null;  
let businessTimeLeft = 30; 
let shiftScore = 0;        
let isPaused = false;
let currentDish = null; // 当前盘子里的东西

// --- 话术数据库 (保持不变) ---
const customerDialogues = {
    '👵': { 
        requests: [
            { text: "老婆子牙口不好，想吃点软乎甜烂的。", tags: ['soft', 'sweet'] },
            { text: "天冷了，想吃口热乎的，最好有点奶味。", tags: ['hot', 'milky'] }
        ],
        reactions: { perfect: "哎哟！吃到心坎里去了！🥰", good: "嗯，味道还成。", bad: "呸呸！咬不动！😡" }
    },
    '🧒': {
        requests: [
            { text: "我要甜的！要很多很多糖！", tags: ['sweet'] },
            { text: "想吃脆脆的零食，还要有点咸味！", tags: ['snack', 'salty'] }
        ],
        reactions: { perfect: "哇！太好吃了！✨", good: "吧唧吧唧...", bad: "哇——！难吃！😭" }
    },
    '👮': { 
        requests: [
            { text: "巡逻累死了，来个肉多管饱的！", tags: ['meat', 'filling'] },
            { text: "要咸口的！再来点刺激的辣味！", tags: ['salty', 'spicy'] }
        ],
        reactions: { perfect: "爽！这才是爷们吃的！💪", good: "行，饱了。", bad: "塞牙缝都不够！👊" }
    },
    '👱‍♀️': {
        requests: [
            { text: "最近减肥，要清淡点。", tags: ['light'] },
            { text: "听说这有加了奶的甜点？", tags: ['sweet', 'milky'] }
        ],
        reactions: { perfect: "味道真细腻~💖", good: "还可以。", bad: "太油腻了！😒" }
    }
};
const defaultDialogue = {
    requests: [{ text: "老板，来个好吃的！", tags: ['basic'] }],
    reactions: { perfect: "美味！", good: "不错。", bad: "难吃。" }
};

// --- 🎮 游戏核心 ---

window.startCounterGame = function() {
    let overlay = document.createElement('div');
    overlay.id = 'counter-overlay';
    overlay.className = 'modal-overlay'; 
    overlay.style.background = '#3e2723'; 
    if (getComputedStyle(document.body).backgroundImage !== 'none') {
         overlay.style.background = '#3e2723 url("images/bg_counter.png") center/cover no-repeat';
    }
    
    // ★ 移除了 "Serve" 按钮，增加了操作提示
    overlay.innerHTML = `
        <div class="counter-top-bar">
            <div class="timer-box">⏰ <span id="biz-timer">30</span>s</div>
            <div class="score-box">💰 <span id="biz-score">0</span>文</div>
            <button class="pause-btn" onclick="togglePause()">⏸️ 摸鱼</button>
        </div>

        <div id="pause-screen" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:3000; flex-direction:column; align-items:center; justify-content:center; color:#fff;">
            <h1>☕ 摸鱼休息中...</h1>
            <button class="unlock-btn" onclick="togglePause()">继续摆摊</button>
        </div>

        <div class="customer-queue" id="customer-queue"></div>

        <div class="counter-desk">
            <div class="desk-left" id="desk-foods"></div>
            
            <div class="desk-center">
                <div class="serving-plate" id="serving-plate" ondrop="dropFoodOnPlate(event)" ondragover="allowDrop(event)">
                    <div class="plate-hint">拖入食物<br>再点击客人上菜</div>
                </div>
            </div>

            <div class="desk-right" id="desk-condiments"></div>
        </div>
    `;

    document.body.appendChild(overlay);
    
    currentCustomers = [];
    shiftScore = 0;
    businessTimeLeft = 30; 
    currentDish = null; 
    isPaused = false;
    
    renderDeskFoods();
    renderDeskCondiments();
    spawnCustomer(); 
    
    if (businessTimer) clearInterval(businessTimer);
    businessTimer = setInterval(gameLoop, 1000);
}

window.togglePause = function() {
    isPaused = !isPaused;
    let screen = document.getElementById('pause-screen');
    if (screen) screen.style.display = isPaused ? 'flex' : 'none';
}

function gameLoop() {
    if (isPaused) return;

    businessTimeLeft--;
    let timerEl = document.getElementById('biz-timer');
    if(timerEl) timerEl.textContent = businessTimeLeft;

    if (currentCustomers.length < maxQueueLength && Math.random() < 0.4) {
        spawnCustomer();
    }

    if (businessTimeLeft <= 0) {
        clearInterval(businessTimer);
        endBusinessShiftUI();
    }
}

function spawnCustomer() {
    const emojis = ['👵', '🧒', '👮', '👱‍♀️'];
    let emoji = emojis[Math.floor(Math.random() * emojis.length)];
    let persona = customerDialogues[emoji] || defaultDialogue;
    let reqTemplate = persona.requests[Math.floor(Math.random() * persona.requests.length)];
    
    let customer = {
        id: Date.now() + Math.random(),
        emoji: emoji,
        dialogueText: reqTemplate.text,
        demands: reqTemplate.tags,
        persona: persona,
        state: 'waiting', 
        patience: 15 
    };
    
    currentCustomers.push(customer);
    renderQueue();
}

// ★ 核心修改：渲染客人时，添加点击事件
function renderQueue() {
    let container = document.getElementById('customer-queue');
    if(!container) return;
    container.innerHTML = '';
    
    currentCustomers.forEach((c) => {
        let div = document.createElement('div');
        div.className = 'customer-card';
        // 鼠标放上去变手指，提示可点击
        div.style.cursor = "pointer";
        
        // 点击客人 -> 尝试上菜
        div.onclick = () => tryServeCustomer(c);
        
        if(c.state === 'leaving') div.classList.add('leaving-customer');

        let bubbleContent = c.feedbackText ? c.feedbackText : c.dialogueText;
        let bubbleClass = c.feedbackType ? `customer-bubble bubble-${c.feedbackType}` : 'customer-bubble';

        div.innerHTML = `
            <div class="customer-emoji">${c.emoji}</div>
            <div class="${bubbleClass}">${bubbleContent}</div>
        `;
        container.appendChild(div);
    });
}

//给指定客人上菜，如果评价是完美可以得到声望+1
function tryServeCustomer(customer) {
    if(isPaused) return;
    if(customer.state !== 'waiting') return; // 不能给正在吃或正在走的人上菜

    if(!currentDish) {
        pushText("盘子里是空的！先把饼拖进去！");
        // 视觉反馈：晃动盘子
        let plate = document.getElementById('serving-plate');
        plate.style.animation = "shake 0.3s";
        setTimeout(()=> plate.style.animation = "", 300);
        return;
    }

    // 1. 检查原材料是否足够 (再次检查，防止拖动后材料被其他操作消耗)
    // 注意：这里我们只在【上菜成功】的瞬间扣材料
    let recipe = recipes.find(r => r.id === currentDish.recipeId);
    if(!checkIngredients(recipe)) {
        pushText(`糟糕！做 ${recipe.name} 的材料不够了！`);
        // 强制清空盘子，因为这盘菜其实做不出来
        currentDish = null;
        renderPlate();
        renderDeskFoods(); // 刷新左侧锁定状态
        return;
    }

    // 2. 扣除原材料 (关键！)
    consumeIngredients(recipe);
    // 顺便刷新左侧，如果材料用完了，对应的饼要变灰
    renderDeskFoods();

    // 3. 结算评价
    let finalTags = [...recipe.tags, ...currentDish.extraTags];
    let matchCount = 0;
    customer.demands.forEach(req => { if(finalTags.includes(req)) matchCount++; });
    
    let basePrice = recipe.price;
    let finalIncome = 0;
    let feedbackType = 'good';
    
    if (matchCount === customer.demands.length) {
        finalIncome = Math.floor(basePrice * 1.5);
        feedbackType = 'perfect';
        reputation += 1;//得到声望奖励
        pushText("完美服务！声望+1！");
    } else if (matchCount > 0) {
        finalIncome = basePrice;
        feedbackType = 'good';
    } else {
        finalIncome = Math.floor(basePrice * 0.5); 
        feedbackType = 'bad';
    }
    
    shiftScore += finalIncome;
    money += finalIncome;
    document.getElementById('biz-score').textContent = shiftScore;
    
    // 4. 客人反应
    customer.state = 'serving';
    customer.feedbackType = feedbackType;
    customer.feedbackText = customer.persona.reactions[feedbackType];
    
    renderQueue();
    
    // 清空盘子
    currentDish = null;
    renderPlate();

    // 1.5秒后离开
    setTimeout(() => {
        let idx = currentCustomers.indexOf(customer);
        if(idx !== -1) {
            currentCustomers.splice(idx, 1);
            renderQueue();
        }
    }, 1500);
}

// 辅助：检查材料
function checkIngredients(recipe) {
    for (let key in recipe.recipe) {
        if ((materials[key] || 0) < recipe.recipe[key]) return false;
    }
    return true;
}

// 辅助：扣除材料
function consumeIngredients(recipe) {
    for (let key in recipe.recipe) {
        materials[key] -= recipe.recipe[key];
    }
}

// ★ 核心修改：左侧食物栏，没材料时变灰锁定
function renderDeskFoods() {
    let container = document.getElementById('desk-foods');
    if (typeof selectedRecipeIds === 'undefined') return;
    
    container.innerHTML = ''; // 清空防增殖

    selectedRecipeIds.forEach(id => {
        let r = recipes.find(x => x.id === id);
        if(!r) return;
        
        let div = document.createElement('div');
        div.className = 'desk-food-item';
        
        // 检查能不能做
        if (checkIngredients(r)) {
            // 能做：允许拖拽
            div.draggable = true;
            div.ondragstart = (e) => { e.dataTransfer.setData("foodId", r.id); };
            div.onclick = () => { selectFoodForMobile(r.id); };
        } else {
            // 不能做：变灰，禁止交互
            div.classList.add('disabled');
            div.style.opacity = '0.4';
            div.style.cursor = 'not-allowed';
            div.onclick = () => pushText(`${r.name} 材料不足！`);
        }
        
        div.innerHTML = `<img src="${r.img}"><div class="price">${r.price}文</div>`;
        container.appendChild(div);
    });
}

function renderDeskCondiments() {
    let container = document.getElementById('desk-condiments');
    if(typeof condiments === 'undefined') return;
    container.innerHTML = ''; // 清空防增殖

    condiments.forEach(c => {
        if(!c.unlocked) return; 
        let usesLeft = playerCondiments[c.id] || 0;
        let div = document.createElement('div');
        div.className = 'condiment-item';
        if(usesLeft <= 0) div.classList.add('empty');
        div.onclick = () => selectActiveCondiment(c);
        div.innerHTML = `<img src="${c.img}"><div class="uses">${usesLeft}</div>`;
        container.appendChild(div);
    });
}

function selectFoodForMobile(foodId) {
    let r = recipes.find(x => x.id === foodId);
    if(!checkIngredients(r)) { pushText("材料不足！"); return; }
    currentDish = { recipeId: foodId, extraTags: [] };
    renderPlate();
}

window.allowDrop = function(ev) { ev.preventDefault(); };

window.dropFoodOnPlate = function(ev) {
    ev.preventDefault();
    let foodId = ev.dataTransfer.getData("foodId");
    if(!foodId) return;
    
    // 拖放时也检查一下材料（虽然拖动源已经控制了，但双重保险）
    let r = recipes.find(x => x.id === foodId);
    if(!checkIngredients(r)) { pushText("材料不足！"); return; }

    currentDish = { recipeId: foodId, extraTags: [] };
    renderPlate();
};

function renderPlate() {
    let plate = document.getElementById('serving-plate');
    if(!currentDish) { 
        plate.innerHTML = '<div class="plate-hint">拖入食物<br>再点击客人上菜</div>'; 
        return; 
    }
    let r = recipes.find(x => x.id === currentDish.recipeId);
    let badges = currentDish.extraTags.map(tag => `<span class="badge badge-${tag}"></span>`).join('');
    plate.innerHTML = `<img src="${r.img}" class="plated-food">${badges}`;
}

function selectActiveCondiment(c) {
    if(isPaused) return; 
    if(playerCondiments[c.id] <= 0) { pushText("空了！"); return; }
    if(!currentDish) { pushText("先放饼！"); return; }
    playerCondiments[c.id]--; 
    c.tags.forEach(t => { if(!currentDish.extraTags.includes(t)) currentDish.extraTags.push(t); });
    renderDeskCondiments(); renderPlate(); 
}

// 结算弹窗 (保持不变)
function endBusinessShiftUI() {
    let overlay = document.getElementById('counter-overlay');
    overlay.innerHTML = `
        <div class="shop-body" style="text-align:center;color:#fff;border:2px solid #ffcc00;background:rgba(0,0,0,0.8);">
            <h2>🌙 打烊收工</h2>
            <p>本次营业额: <span style="color:#ffcc00;font-size:1.5em">${shiftScore}文</span></p>
            <button class="unlock-btn" onclick="closeCounterGame()">回家睡觉</button>
        </div>
    `;
}

window.closeCounterGame = function() {
    let overlay = document.getElementById('counter-overlay');
    if(overlay) overlay.remove();
    if (businessTimer) clearInterval(businessTimer);
    update(); 
    if(typeof nextTime === 'function') nextTime(); 
}