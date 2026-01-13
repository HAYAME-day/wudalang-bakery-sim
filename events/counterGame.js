//柜台经营游戏部分
//初始化
let currentCustomers = []; 
let currentSpecialGuest = null;//新增雅座客人，包含潘金莲、西门庆、武松
let shiftVipRecords = [];//本局服务记录本
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
const defaultDialogue = {//是默认类型的客人，一般来说不会出现
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
         overlay.style.background = '#3e2723 url("images/bg_counter.png") center/cover no-repeat';//暂时还没添加柜台背景图
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
    currentSpecialGuest = null;//雅座是空的
    shiftVipRecords = [];//每次开店先把记录清空
    shiftScore = 0;
    businessTimeLeft = 30; 
    currentDish = null; 
    isPaused = false;
    
    renderDeskFoods();
    renderDeskCondiments();
    //同时刷新普通客人和雅座客人
    spawnCustomer();
    spawnSpecialGuest(); //雅座客人局内固定只有一位
    
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

    if (currentCustomers.length < maxQueueLength && Math.random() < 0.4) {//有40%的概率来客人，所以并不是每一秒都会来客人
        spawnCustomer();
    }

    if (businessTimeLeft <= 0) {
        clearInterval(businessTimer);
        endBusinessShiftUI();
    }
}

function spawnCustomer() {
    const emojis = ['👵', '🧒', '👮', '👱‍♀️'];//存储所有客人的脸
    let emoji = emojis[Math.floor(Math.random() * emojis.length)];//随机小数0-1乘以列表长度然后向下取整拿出列表里的对应元素
    let persona = customerDialogues[emoji] || defaultDialogue;//获取台词
    let reqTemplate = persona.requests[Math.floor(Math.random() * persona.requests.length)];//依然是随机取同客人的多种台词中的一种
    
    let customer = {
        id: Date.now() + Math.random(),
        emoji: emoji,
        dialogueText: reqTemplate.text,
        demands: reqTemplate.tags,
        persona: persona,
        state: 'waiting', 
        patience: 15 //暂时没用上但是后续可以添加客人等太久生气离开的情况
    };
    
    currentCustomers.push(customer);//加入队列
    renderQueue();//更新排队名单
}

//排队客人渲染函数
function renderQueue() {
    let container = document.getElementById('customer-queue');
    if(!container) return;
    container.innerHTML = '';
    
    currentCustomers.forEach((c) => {
        let div = document.createElement('div');
        div.className = 'customer-card';
        div.style.cursor = "pointer";//鼠标在上面变成手指，表示可以点击
        
        div.onclick = () => tryServeCustomer(c);//点击上菜
        
        if(c.state === 'leaving') div.classList.add('leaving-customer');//转变为离开状态有淡出的CSS效果

        let bubbleContent = c.feedbackText ? c.feedbackText : c.dialogueText;//台词判断，已经得到上菜的客人给出feedback，没有上菜的客人依然是要求dialogue
        let bubbleClass = c.feedbackType ? `customer-bubble bubble-${c.feedbackType}` : 'customer-bubble';//根据feedback的评价变更颜色

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
    if(customer.state !== 'waiting') return; //不能给正在吃或正在走的人上菜

    if(!currentDish) {
        pushText("盘子里是空的！先把饼拖进去！");
        // 视觉反馈：晃动盘子
        let plate = document.getElementById('serving-plate');
        plate.style.animation = "shake 0.3s";
        setTimeout(()=> plate.style.animation = "", 300);
        return;
    }

    //先检查原材料是否足够 (再次检查，防止拖动后材料被其他操作消耗)
    //只在上菜成功的瞬间扣材料
    let recipe = recipes.find(r => r.id === currentDish.recipeId);
    if(!checkIngredients(recipe)) {
        pushText(`糟糕！做 ${recipe.name} 的材料不够了！`);
        //强制清空盘子，因为这盘菜其实做不出来
        currentDish = null;
        renderPlate();
        renderDeskFoods(); //刷新左侧锁定状态
        return;
    }

    //上菜成功的瞬间扣除原材料
    consumeIngredients(recipe);
    //刷新左侧，如果材料用完了，对应的饼要变灰
    renderDeskFoods();

    //结算评价：计算feedback的评级
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
        finalIncome = Math.floor(basePrice * 0.5); //如果不满足要求就只有一半进账
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
        if(usesLeft <= 0) {
            div.classList.add('empty');
            //增加提示让玩家消耗原料补充调料
            let costKey = c.cost ? Object.keys(c.cost)[0]:null;//获取重新装填需要的原材料名
            let costAmount = costKey ? c.cost[costKey]:0;//获取重新装填需要的原材料数量
            //提示
            let matNameCN = (costKey && window.getMaterialName)
                ? window.getMaterialName(costKey)
                : (costKey || '原料');//告诉玩家需要什么
            div.title = `点击消耗 ${matNameCN} 补充`;
    
            let stock = materials[costKey] || 0;
            if (costKey && stock >= costAmount) {
                div.style.border = "2px dashed #2ecc71"
            }; //绿色虚线框提示可补充
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
//加调料函数，对于空罐子可以消耗材料补充调料
function selectActiveCondiment(c) {
    if(isPaused) return; 
    if(playerCondiments[c.id] <= 0) { //点击空罐子消耗材料补充
        if (!c.cost) {//获取配方
            pushText(`${c.name} 已用尽！`);
            return;
        }
        //检查原料是否足够
        let missing = [];//记录缺少什么原料
        for(let materialName in c.cost) {
            let required = c.cost[materialName];
            let owned = materials[materialName] || 0;//兜底防止materials[key]为undefined时的报错
            if (owned < required) {
                let nameCN = window.getMaterialName ? window.getMaterialName(materialName):materialName;
                missing.push(nameCN);
            }
        }
        //缺少原料
        if(missing.length > 0) {
            pushText(`无法补充，缺少 ${missing.join('，')}`);
            return;
        }
        //原料足够
        for (let materialName in c.cost) {
            let needCount = c.cost[materialName];
            materials[materialName] -= needCount;
        }
        //补满调料罐次数到最大
        playerCondiments[c.id] = c.maxUses || 5;
        pushText(`消耗原料，${c.name} 已补满！`);
        renderDeskCondiments(); //刷新界面，让灰色变彩色
        return; 
    }

    //正常的加料逻辑
    if(!currentDish) { pushText("先放饼！"); return; }
    //扣除一次使用次数
    playerCondiments[c.id]--; 
    //给饼增加对应调料tag
    c.tags.forEach(t => { 
        if(!currentDish.extraTags.includes(t)) {
            currentDish.extraTags.push(t); 
        }
    });

    renderDeskCondiments(); 
    renderPlate(); 
}

// 结算弹窗 (保持不变)
function endBusinessShiftUI() {
    let overlay = document.getElementById('counter-overlay');
    //复盘界面
    let vipLogHtml = '';
    if(shiftVipRecords.length > 0) {
        let logs = shiftVipRecords.map(record => {
            let tagsText = record.matched.length > 0
            ? `<span style="color:#2ecc71">满足: ${record.matched.join('、')}</span>`
            : `<span style="color:#e74c3c">口味不合</span>`;

            //声望变动显示
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

//特殊人物（雅座客人）剧情
function spawnSpecialGuest() {
    if (!window.characters) return;
    //筛选已解锁的角色（初始三人物都是已经解锁了的
    let unlockedChars = Object.values(window.characters).filter(c => c.unlocked);
    if (unlockedChars.length === 0) return;//一般不存在此情况，以防万一
    //随机抽选
    let charData = unlockedChars[Math.floor(Math.random() * unlockedChars.length)];
    //随机分配雅座客人需求
    let demandTemplate = charData.demandPool ? charData.demandPool[Math.floor(Math.random() * charData.demandPool.length)] : { tags: ['basic'], text: "……"};//存在需求池的情况就能正常抽选需求，不存在就默认basic（和普通客人默认basic一样）
    currentSpecialGuest = {
        charId: charData.id,
        ...charData,
        currentDemand: demandTemplate,//本次需求存储
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

    //拖拽上菜给VIP
    div.ondragover = allowDrop;
    div.ondrop = (ev) => {
        ev.preventDefault();
        let foodId = ev.dataTransfer.getData("foodId");
        if (foodId) {
            let tempDish = {recipeId: foodId, extraTags: []};
            tryServeSpecialGuest(tempDish);
        }
    };
    //点击上菜给VIP
    div.onclick = () => {
        if(isPaused) return;
        if(currentDish) {
            tryServeSpecialGuest(currentDish); 
        } else {
            //没菜时点击，显示具体需求文本
            pushText(`【${currentSpecialGuest.name}】: ${currentSpecialGuest.currentDemand.text}`);
            //气泡抖动反馈
            let bubble = div.querySelector('.special-demand-box');
            if(bubble) {
                bubble.style.transform = "scale(1.1)";
                setTimeout(()=>bubble.style.transform="scale(1)", 200);
            }
        }
    };
    //3个需求tag图标
    let tagsHtml = currentSpecialGuest.currentDemand.tags.map(t => {
        let content = window.getTagIcon ? window.getTagIcon(t) : getTagName(t);
    return `<span class="mini-tag">${content}</span>`;
    }).join('');//注意需要后续补上TagIcon图标

    div.innerHTML = `
        <div class="special-emoji">${currentSpecialGuest.emoji}</div>
        <div class="special-name">${currentSpecialGuest.name}</div>
        <div class="special-demand-box">${tagsHtml}</div>
    `;
    container.appendChild(div);
}
//给特殊人物上菜的结算
function tryServeSpecialGuest(dish) {
    if (isPaused) return;
    //检查材料
    let recipe = recipes.find(r => r.id ===dish.recipeId);
    if (!checkIngredients(recipe)) {
        pushText(`材料不足，做不了 ${recipe.name}！`);
        return;
    }
    //扣除材料后刷新左侧
    consumeIngredients(recipe);
    renderDeskFoods();
    //计算3个tags的匹配度
    let finalTags = [...recipe.tags, ...dish.extraTags];
    let demands = currentSpecialGuest.currentDemand.tags;

    //找出具体匹配的标签以在结算时为玩家复盘
    let matchedTagsRaw = demands.filter(req => finalTags.includes(req));
    let matchedTagsCN = matchedTagsRaw.map(t => window.getTagName(t));//展示给玩家的是中文tag名称
    let matchCount = matchedTagsRaw.length;

    demands.forEach(req => {
        if(finalTags.includes(req)) matchCount++;
    });
    //给予不同满足tags个数的奖励
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
    
    //本局收入和声望更新
    money += income;
    shiftScore += income;
    reputation += repGain;
    
    document.getElementById('biz-score').textContent = shiftScore;
    
    let msg = `VIP赏银 ${income}文`;
    if(repGain > 0) msg += ` (声望+${repGain})`;
    pushText(msg);

    //结束上菜后盘子清空
    currentDish = null;
    renderPlate();

    //★进入剧情模式！获取评价文本
    //这里的foodReactions定义位于characters.js
    let feedbackText = currentSpecialGuest.foodReactions[matchCount] || "（吃完了）";//一般不会显示但是以防万一还是写个默认值
    
    //稍微延迟，让玩家看清金币增加，然后暂停，接下来进入剧情模式
    setTimeout(() => {
        enterStoryMode(currentSpecialGuest, feedbackText);
    }, 300);

    //显示文本的复盘展示
    shiftVipRecords.push({
        name: currentSpecialGuest.name,
        emoji: currentSpecialGuest.emoji,
        matched: matchedTagsCN,
        income: income,
        rep: repGain,
        isPerfect: (matchCount === 3)
    })
}
// 4. 进入剧情模式 (整合评价+随机剧情)
function enterStoryMode(guest, foodFeedback) {
    isPaused = true;
    
    // 检查是否有剧情数据
    if (!window.storyEvents || !window.storyEvents[guest.charId]) {
        // 没剧情，只显示评价，然后给一个退出按钮
        renderStoryModal(guest, { 
            text: foodFeedback + "<br><br>（该角色暂无更多剧情事件）", 
            options: [{text: "继续营业", effect: {}}] 
        });
        return;
    }

    let pool = window.storyEvents[guest.charId][guest.stage];
    if (!pool || !pool.random) return;

    let randomEvent = pool.random[Math.floor(Math.random() * pool.random.length)];
    
    // ★ 拼接文本：先评价菜，再聊剧情
    let fullText = `<span style="color:#d35400; font-weight:bold;">[评价]</span> ${foodFeedback}<br><hr style="border:0; border-top:1px dashed #ccc; margin:10px 0;">${randomEvent.text}`;

    let combinedEvent = {
        text: fullText,
        options: randomEvent.options
    };
    
    renderStoryModal(guest, combinedEvent);
}

// 5. 渲染 AVG 风格对话框
function renderStoryModal(guest, event) {
    let overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '4000'; // 必须比暂停层高
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
    window.currentStoryOptions = event.options; // 存选项供回调
}

// 6. 处理剧情选择
window.resolveStoryOption = function(charId, idx) {
    let option = window.currentStoryOptions[idx];
    let effect = option.effect || {};
    
    // 结算效果
    if (effect.fav) window.addFavorability(charId, effect.fav);
    if (effect.money) {
        money += effect.money;
        pushText(effect.money > 0 ? `获得 ${effect.money} 文` : `失去 ${Math.abs(effect.money)} 文`);
    }
    if (effect.rep) {
        reputation += effect.rep;
        pushText(`声望 ${effect.rep > 0 ? '+' : ''}${effect.rep}`);
    }

    // 关闭剧情弹窗
    let storyOverlay = document.getElementById('story-overlay');
    if(storyOverlay) storyOverlay.remove();

    // ★ 关键：剧情结束后，不直接开始，而是回到暂停菜单
    showPauseMenuAfterStory();
}

function showPauseMenuAfterStory() {
    isPaused = true; // 确保还在暂停
    let screen = document.getElementById('pause-screen');
    if (screen) {
        screen.style.display = 'flex';
        // 改一下文字，更有代入感
        document.getElementById('pause-title').textContent = "剧情回顾完毕";
        document.getElementById('pause-msg').textContent = "准备好继续营业了吗？";
    }
}