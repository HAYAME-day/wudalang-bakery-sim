// counterGame.js - 终极修复版

//柜台经营游戏部分
//初始化
let currentCustomers = []; 
let currentSpecialGuest = null;
let shiftVipRecords = [];
let maxQueueLength = 3;    
let businessTimer = null;  
let businessTimeLeft = 30; 
let shiftScore = 0;        
let isPaused = false;
let currentDish = null; 

// ★★★ 核心修复 1：技能变量改为全局 window 属性 ★★★
// 这样 data/skills.js 修改它们时，这里才能读到！
window.hasUsedSkill = false;
window.jinlianBuffActive = false;
window.shiftMaxRecord = {money:0, rep:0};

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
        reactions: { perfect: "爽！这才是俺爱吃的！💪", good: "行，饱了。", bad: "塞牙缝都不够！👊" }
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
    requests: [{ text: "老板，来个经典好吃的！", tags: ['basic'] }],
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
    
    overlay.innerHTML = `
        <div class="counter-top-bar">
            <div class="timer-box">⏰ <span id="biz-timer">30</span>s</div>
            <div class="score-box">💰 <span id="biz-score">0</span>文</div>
            <button class="pause-btn" onclick="togglePause()">⏸️ 摸鱼</button>
        </div>

        <div id="pause-screen" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:3000; flex-direction:column; align-items:center; justify-content:center; color:#fff;">
            <h1 id="pause-title" style="margin-bottom:20px;">☕ 摸鱼休息中...</h1>
            <p id="pause-msg" style="margin-bottom:30px; color:#ccc;">休息一下，马上回来...</p>
            <button class="unlock-btn" onclick="togglePause()">继续摆摊</button>
        </div>
        <div id="special-seat" class="special-seat"></div>
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
    
    //状态初始化
    currentCustomers = [];
    currentSpecialGuest = null;
    shiftVipRecords = [];
    shiftScore = 0;
    businessTimeLeft = 30; 
    currentDish = null; 
    isPaused = false;
    
    // ★★★ 核心修复 2：初始化时重置全局变量 ★★★
    window.hasUsedSkill = false;
    window.jinlianBuffActive = false;
    window.shiftMaxRecord = {money:0, rep:0};
    
    renderDeskFoods();
    renderDeskCondiments();
    spawnCustomer();
    spawnSpecialGuest(); 
    
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

function renderQueue() {
    let container = document.getElementById('customer-queue');
    if(!container) return;
    container.innerHTML = '';
    
    currentCustomers.forEach((c) => {
        let div = document.createElement('div');
        div.className = 'customer-card';
        div.style.cursor = "pointer";
        
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

function tryServeCustomer(customer) {
    if(isPaused) return;
    if(customer.state !== 'waiting') return; 

    if(!currentDish) {
        pushText("盘子里是空的！先把饼拖进去！");
        let plate = document.getElementById('serving-plate');
        plate.style.animation = "shake 0.3s";
        setTimeout(()=> plate.style.animation = "", 300);
        return;
    }

    let recipe = recipes.find(r => r.id === currentDish.recipeId);
    if(!checkIngredients(recipe)) {
        pushText(`糟糕！做 ${recipe.name} 的材料不够了！`);
        currentDish = null;
        renderPlate();
        renderDeskFoods(); 
        return;
    }

    consumeIngredients(recipe);
    renderDeskFoods();

    // 结算评价
    let finalTags = [...recipe.tags, ...currentDish.extraTags];
    let matchCount = 0;
    customer.demands.forEach(req => { if(finalTags.includes(req)) matchCount++; });
    
    let basePrice = recipe.price;
    let finalIncome = 0;
    let feedbackType = 'good';
    let repGain = 0;

    // ★★★ 核心修复 3：接入潘金莲技能逻辑 ★★★
    if (window.jinlianBuffActive) {
        matchCount = customer.demands.length; // 强制满足
        finalIncome = basePrice * 2; // 双倍收益
        feedbackType = 'perfect';
        repGain = 2; // 额外声望
        
        pushText("💖 娘子BUFF生效！收益翻倍！");
        window.jinlianBuffActive = false; // 消耗BUFF
    } else {
        if (matchCount === customer.demands.length) {
            finalIncome = Math.floor(basePrice * 1.5);
            feedbackType = 'perfect';
            repGain = 1;
            pushText("完美服务！声望+1！");
        } else if (matchCount > 0) {
            finalIncome = basePrice;
            feedbackType = 'good';
        } else {
            finalIncome = Math.floor(basePrice * 0.5);
            feedbackType = 'bad';
        }
    }
    
    // ★★★ 核心修复 4：记录武松技能所需数据 ★★★
    if (typeof window.shiftMaxRecord !== 'undefined' && finalIncome > window.shiftMaxRecord.money) {
        window.shiftMaxRecord.money = finalIncome;
        window.shiftMaxRecord.rep = repGain;
    }
    
    shiftScore += finalIncome;
    money += finalIncome;
    reputation += repGain;
    document.getElementById('biz-score').textContent = shiftScore;
    
    customer.state = 'serving';
    customer.feedbackType = feedbackType;
    customer.feedbackText = customer.persona.reactions[feedbackType];
    
    renderQueue();
    
    currentDish = null;
    renderPlate();

    setTimeout(() => {
        let idx = currentCustomers.indexOf(customer);
        if(idx !== -1) {
            currentCustomers.splice(idx, 1);
            renderQueue();
        }
    }, 1500);
}

function checkIngredients(recipe) {
    for (let key in recipe.recipe) {
        if ((materials[key] || 0) < recipe.recipe[key]) return false;
    }
    return true;
}

function consumeIngredients(recipe) {
    for (let key in recipe.recipe) {
        materials[key] -= recipe.recipe[key];
    }
}

function renderDeskFoods() {
    let container = document.getElementById('desk-foods');
    if (typeof selectedRecipeIds === 'undefined') return;
    
    container.innerHTML = ''; 

    selectedRecipeIds.forEach(id => {
        let r = recipes.find(x => x.id === id);
        if(!r) return;
        
        let div = document.createElement('div');
        div.className = 'desk-food-item';
        
        if (checkIngredients(r)) {
            div.draggable = true;
            div.ondragstart = (e) => { e.dataTransfer.setData("foodId", r.id); };
            div.onclick = () => { selectFoodForMobile(r.id); };
        } else {
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
    container.innerHTML = ''; 

    condiments.forEach(c => {
        if(!c.unlocked) return; 
        let usesLeft = playerCondiments[c.id] || 0;
        let div = document.createElement('div');
        div.className = 'condiment-item';
        if(usesLeft <= 0) {
            div.classList.add('empty');
            let costKey = c.cost ? Object.keys(c.cost)[0]:null;
            let costAmount = costKey ? c.cost[costKey]:0;
            let matNameCN = (costKey && window.getMaterialName)
                ? window.getMaterialName(costKey)
                : (costKey || '原料');
            div.title = `点击消耗 ${matNameCN} 补充`;
    
            let stock = materials[costKey] || 0;
            if (costKey && stock >= costAmount) {
                div.style.border = "2px dashed #2ecc71"
            }; 
        };
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
    if(playerCondiments[c.id] <= 0) { 
        if (!c.cost) {
            pushText(`${c.name} 已用尽！`);
            return;
        }
        let missing = [];
        for(let materialName in c.cost) {
            let required = c.cost[materialName];
            let owned = materials[materialName] || 0;
            if (owned < required) {
                let nameCN = window.getMaterialName ? window.getMaterialName(materialName):materialName;
                missing.push(nameCN);
            }
        }
        if(missing.length > 0) {
            pushText(`无法补充，缺少 ${missing.join('，')}`);
            return;
        }
        for (let materialName in c.cost) {
            let needCount = c.cost[materialName];
            materials[materialName] -= needCount;
        }
        playerCondiments[c.id] = c.maxUses || 5;
        pushText(`消耗原料，${c.name} 已补满！`);
        renderDeskCondiments(); 
        return; 
    }

    if(!currentDish) { pushText("先放饼！"); return; }
    playerCondiments[c.id]--; 
    c.tags.forEach(t => { 
        if(!currentDish.extraTags.includes(t)) {
            currentDish.extraTags.push(t); 
        }
    });

    renderDeskCondiments(); 
    renderPlate(); 
}

function endBusinessShiftUI() {
    let overlay = document.getElementById('counter-overlay');
    let vipLogHtml = '';
    if(shiftVipRecords.length > 0) {
        let logs = shiftVipRecords.map(record => {
            let tagsText = record.matched.length > 0
            ? `<span style="color:#2ecc71">满足: ${record.matched.join('、')}</span>`
            : `<span style="color:#e74c3c">口味不合</span>`;

            let repText = record.rep > 0 ? ` <span style="color:#f1c40f">(声望+${record.rep})</span>` : '';

            return `
                <div style="margin: 8px 0; font-size: 0.9em; border-bottom:1px dashed rgba(255,255,255,0.2); padding-bottom:4px;">
                    ${record.emoji} <b>${record.name}</b>: ${tagsText}
                    <div style="margin-top:2px; opacity:0.8;">赏银: ${record.income}文${repText}</div>
                </div>
            `;
        }).join('');

        vipLogHtml = `
            <div style="background:rgba(255,255,255,0.1); border-radius:8px; padding:10px; margin:15px 0; text-align:left;">
                <div style="font-size:0.8em; color:#aaa; margin-bottom:5px;">📋 雅座接待记录</div>
                ${vipLogHtml}
            </div>
        `;
    }
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

function spawnSpecialGuest() {
    if (!window.characters) return;
    let unlockedChars = Object.values(window.characters).filter(c => c.unlocked);
    if (unlockedChars.length === 0) return;
    let charData = unlockedChars[Math.floor(Math.random() * unlockedChars.length)];
    let demandTemplate = charData.demandPool ? charData.demandPool[Math.floor(Math.random() * charData.demandPool.length)] : { tags: ['basic'], text: "……"};
    currentSpecialGuest = {
        charId: charData.id,
        ...charData,
        currentDemand: demandTemplate,
        state: 'waiting'
    };
    renderSpecialSeat();
}

function renderSpecialSeat() {
    let container = document.getElementById('special-seat');
    if (!container) return;
    container.innerHTML = '';
    if (!currentSpecialGuest) return;

    let div = document.createElement('div');
    div.className = 'special-guest-card';

    div.ondragover = allowDrop;
    div.ondrop = (ev) => {
        ev.preventDefault();
        let foodId = ev.dataTransfer.getData("foodId");
        if (foodId) {
            let tempDish = {recipeId: foodId, extraTags: []};
            tryServeSpecialGuest(tempDish);
        }
    };
    
    div.onclick = (e) => {
        if(e.target.closest('.skill-badge-container')) return;
        if(isPaused) return;
        if(currentDish) {
            tryServeSpecialGuest(currentDish); 
        } else {
            pushText(`【${currentSpecialGuest.name}】: ${currentSpecialGuest.currentDemand.text}`);
        }
    };
    
    let tagsHtml = currentSpecialGuest.currentDemand.tags.map(t => {
        let content = window.getTagIcon ? window.getTagIcon(t) : getTagName(t);
    return `<span class="mini-tag">${content}</span>`;
    }).join('');

    let skillHtml = '';
    if(window.characterSkills && window.characterSkills[currentSpecialGuest.charId]) {
        let skillConfig = window.characterSkills[currentSpecialGuest.charId];
        let currentFav = currentSpecialGuest.favorability || 0;
        let unlockReq = skillConfig.unlockFav;
        let isUnlocked = currentFav >= unlockReq;
        
        let btnClass = 'skill-badge';
        if(!isUnlocked) btnClass += ' locked';
        else if(window.hasUsedSkill) btnClass += ' used';
        
        let btnText = window.hasUsedSkill ? "已失效" : skillConfig.name;
        
        let tooltipText = isUnlocked 
            ? skillConfig.description 
            : `🔒 好感度达到 ${unlockReq} 解锁<br><span style='font-size:0.8em;color:#aaa'>当前: ${currentFav}</span>`;
            
        skillHtml = `
            <div class="skill-badge-container">
                <button class="${btnClass}" onclick="handleSkillClick('${currentSpecialGuest.charId}', ${isUnlocked})">
                    ${btnText}
                </button>
                <div class="skill-tooltip" id="skill-tooltip">${tooltipText}</div>
            </div>
        `;
    }
    div.innerHTML = `
        <div class="special-emoji">${currentSpecialGuest.emoji}</div>
        
        ${skillHtml}
        
        <div class="special-name">${currentSpecialGuest.name}</div>
        <div class="special-demand-box">${tagsHtml}</div>
    `;
    container.appendChild(div);
}

function tryServeSpecialGuest(dish) {
    if (isPaused) return;
    let recipe = recipes.find(r => r.id ===dish.recipeId);
    if (!checkIngredients(recipe)) {
        pushText(`材料不足，做不了 ${recipe.name}！`);
        return;
    }
    consumeIngredients(recipe);
    renderDeskFoods();
    
    let finalTags = [...recipe.tags, ...dish.extraTags];
    let demands = currentSpecialGuest.currentDemand.tags;

    let matchedTagsRaw = demands.filter(req => finalTags.includes(req));
    let matchedTagsCN = matchedTagsRaw.map(t => window.getTagName(t));
    let matchCount = matchedTagsRaw.length;

    demands.forEach(req => {
        if(finalTags.includes(req)) matchCount++;
    });
    
    let basePrice = recipe.price;
    let multiplier = 1.0;
    let repGain = 0;

    if (matchCount === 1) {
        multiplier = 1.2;
    } else if (matchCount === 2) {
        multiplier = 1.4;
        repGain = 1;
    } else if (matchCount === 3) {
        multiplier = 2.0;
        repGain = 2;
    }

    let income = Math.floor(basePrice * multiplier);
    
    money += income;
    shiftScore += income;
    reputation += repGain;
    
    document.getElementById('biz-score').textContent = shiftScore;
    
    let msg = `VIP赏银 ${income}文`;
    if(repGain > 0) msg += ` (声望+${repGain})`;
    pushText(msg);

    currentDish = null;
    renderPlate();

    let feedbackText = currentSpecialGuest.foodReactions[matchCount] || "（吃完了）";
    
    setTimeout(() => {
        enterStoryMode(currentSpecialGuest, feedbackText, matchCount);
    }, 300);

    shiftVipRecords.push({
        name: currentSpecialGuest.name,
        emoji: currentSpecialGuest.emoji,
        matched: matchedTagsCN,
        income: income,
        rep: repGain,
        isPerfect: (matchCount === 3)
    })
}

function enterStoryMode(guest, foodFeedback, matchCount) {
    isPaused = true;
    let hasStory = window.storyEvents &&
                   window.storyEvents[guest.charId] &&
                   window.storyEvents[guest.charId][guest.stage] &&
                   window.storyEvents[guest.charId][guest.stage].random.length > 0;
    if(hasStory){
        let pool = window.storyEvents[guest.charId][guest.stage];
        if(pool&&pool.random) {
            let randomEvent = pool.random[Math.floor(Math.random()*pool.random.length)];
            let fullText = `<span style="color:#d35400;font-weight:bold;">[用餐评价]</span> ${foodFeedback}<hr style="border:0;border-top:1px dashed #ccc;margin:10px 0;">${randomEvent.text}`;

            let combinedEvent = {
                text: fullText,
                options: randomEvent.options
            };
            renderStoryModal(guest,combinedEvent);
            return;
        }
        
    }
    if(matchCount >= 2 && window.startDatingEvent) {
        pushText(`✨ 菜品深得 ${guest.name} 欢心，触发亲密互动！`);
        window.startDatingEvent(guest);
        return;
    }
    renderStoryModal(guest, { 
        text: `${foodFeedback}<br><br><span style="color:#aaa;font-size:0.8em;">(该角色暂无剧情)</span>`, 
        options: [{text: "继续营业", effect: {}}] 
    });
}

function renderStoryModal(guest, event) {
    let overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '4000'; 
    overlay.id = 'story-overlay';
    
    let buttonsHtml = event.options.map((opt, idx) => `
        <button class="story-btn" onclick="resolveStoryOption('${guest.charId}', ${idx})">
            ${opt.text}
        </button>
    `).join('');

    overlay.innerHTML = `
        <div class="story-box">
            <div class="story-header">
                <span style="font-size:2em; margin-right:10px;">${guest.emoji}</span>
                <div>
                    <div style="font-weight:bold; font-size:1.2em;">${guest.name}</div>
                    <div style="font-size:0.8em; color:#666;">当前好感: ${guest.favorability}</div>
                </div>
            </div>
            <div class="story-content">
                ${event.text}
            </div>
            <div class="story-actions">
                ${buttonsHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    window.currentStoryOptions = event.options; 
}

window.resolveStoryOption = function(charId, idx) {
    let option = window.currentStoryOptions[idx];
    console.log("当前选项数据：",option);
    console.log("当前读取到的reaction：",option.reaction);
    let effect = option.effect || {};
    
    if (effect.fav) window.addFavorability(charId, effect.fav);
    if (effect.money) {
        money += effect.money;
        pushText(effect.money > 0 ? `获得 ${effect.money} 文` : `失去 ${Math.abs(effect.money)} 文`);
    }
    if (effect.rep) {
        reputation += effect.rep;
        pushText(`声望 ${effect.rep > 0 ? '+' : ''}${effect.rep}`);
    }
    
    // ★★★ 核心修复 5：Reaction 反馈必须更新界面 ★★★
    if(option.reaction) {
        let overlay = document.getElementById('story-overlay');
        if(overlay) {
            let contentEl = overlay.querySelector('.story-content');
            let actionsEl = overlay.querySelector('.story-actions');
            
            // 这一步是你之前漏掉的！
            if(contentEl) contentEl.innerHTML = option.reaction; 
            
            if(actionsEl){
                actionsEl.innerHTML=`
                    <button class="story-btn" onclick="closeStoryModal()">
                    (点击离开)
                    </button>
                `;
            }
            return;
        }
    }
    closeStoryModal();
}

window.closeStoryModal = function() {
    let storyOverlay = document.getElementById('story-overlay');
    if(storyOverlay) storyOverlay.remove();
    showPauseMenuAfterStory();
}

function showPauseMenuAfterStory() {
    isPaused = true; 
    currentSpecialGuest = null;
    renderSpecialSeat();
    let screen = document.getElementById('pause-screen');
    if (screen) {
        screen.style.display = 'flex';
        document.getElementById('pause-title').textContent = "剧情回顾完毕";
        document.getElementById('pause-msg').textContent = "准备好继续营业了吗？";
    }
}

window.handleSkillClick=function(charId,isUnlocked) {
    if(isPaused) return;
    if(!isUnlocked||window.hasUsedSkill) {
        let tooltip=document.getElementById('skill-tooltip');
        if(tooltip){
            tooltip.classList.add('show');
            setTimeout(()=>tooltip.classList.remove('show'),2000);
        }
        if(!isUnlocked) {
            pushText("🔒 好感度不足，无法使用技能！");
        }
        return;
    }
    let skill=window.characterSkills[charId];
    if(skill) {
        let result=skill.activate();
        if(result.success) {
            window.hasUsedSkill=true;
            pushText(result.msg);
            renderSpecialSeat();
        }
        else{
            pushText(result.msg);
        }
    }
}

window.clearQueue=function(){
    currentCustomers = [];
    renderQueue();
}