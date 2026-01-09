// 状态变量和数据最初定义
let money = 100, reputation = 10, day = 1, timeIdx = 0, state = 'business';
const shichenArr = ["清晨", "上午", "中午", "午后", "夜晚"];
let materials = { flour: 3, ghee: 3, vegetable: 0, meat: 0 };
let favors = [ { name: "金莲", value: 0 }, { name: "西门庆", value: 0 }, { name: "武松", value: 0 } ];

//之前是初始化选中菜谱，现在改成可多选
let selectedRecipeIds = ['basic'];
let maxShopSlots = 2;//初始是最多上架2种菜谱，后期可升级为更多
let marketVolatility = { farmer: 1.0, market: 1.0, innkeeper: 1.0 };//进货倍率变动初始化
let newsEffect = {};

// 全局存储文本历史，现为20条
const maxTextHistory = 20;
let textHistory = [];

// 公共函数（页面更新、文本/日志、可拉式侧栏等）
function pushText(txt) { textHistory.push(txt); if (textHistory.length > maxTextHistory) textHistory.shift(); renderTextHistory(); }
function renderTextHistory() {
  const ta = document.getElementById('text-area');
  ta.innerHTML = "";
  textHistory.forEach(line=>{
    let div = document.createElement('div');
    div.innerHTML = line.replace(/\n/g, "<br>").replace(/\*(.*?)\*/g, "<i>$1</i>");
    div.className = "textline";
    ta.appendChild(div);
  });
  ta.scrollTop = ta.scrollHeight;
}
function log(msg) {
  const ul = document.getElementById('loglist');
  ul.insertAdjacentHTML('afterbegin', `<li>${msg}</li>`);
  if (ul.childElementCount > 10) ul.removeChild(ul.lastChild);
}
function update() {
  document.getElementById('money').textContent = money;
  document.getElementById('reputation').textContent = reputation;
  document.getElementById('shichen').textContent = shichenArr[timeIdx];
  renderFavors(); setThemeByTime(); renderMaterials();
  renderMaterialBag();
  saveGame();//每次刷新都自动存储
}
    // 好感侧栏（右侧）
function renderFavors() {
  let list = document.getElementById('favor-list');
  if (!list) return;

  let html = "";

  //必须先检查window.characters是否存在，防止报错
  if (window.characters) {
      html = Object.values(window.characters)
        .filter(c => c.unlocked)//过滤掉未解锁的角色（目前都是已解锁的角色但是感觉可以加入不同世界线版本的角色来丰富内容
        .map(c => `
    <div class="favor-item">
        <span class="favor-emoji-wrapper" onclick="showSidebarBubble(this, '${c.id}')" title="点击对话">
            ${c.emoji || ''}
        </span>
        <span class="favor-name">${c.name}</span>
        
        <span class="favor-value">❤ ${c.favorability || 0}</span>
    </div>`)
    .join(""); //把数组变成字符串
  }

  //如果啥都没有，显示提示（一般不会出现）
  if (html === "") {
      html = `<div style="padding:10px;color:#aaa;text-align:center;">暂无角色信息</div>`;
  }

  //拼接重置按钮
  html += `
     <div style="margin-top:20px;text-align:center;">
        <button onclick="resetGame()" style="font-size:12px;color:#888;cursor:pointer;background:none;border:1px solid #ccc;padding:4px 8px;border-radius:4px;">
            🗑️ 重置进度
        </button>
     </div>
  `;

  list.innerHTML = html;
}
//点击侧栏头像冒气泡台词功能
window.showSidebarBubble = function(wrapperEl, charId) {
    //去数据里找这个角色
    let char = window.characters[charId];
    //如果角色没有quotes，就什么都不做（一般不发生
    if (!char || !char.quotes || char.quotes.length === 0) return;
    //如果头上已经有气泡就先去除
    let oldBubble = wrapperEl.querySelector('.sidebar-bubble');
    if (oldBubble) oldBubble.remove();
    //随机抽取一句台词
    let text = char.quotes[Math.floor(Math.random() * char.quotes.length)];
    //创建气泡元素
    let bubble = document.createElement('div');
    bubble.className = 'sidebar-bubble'; 
    bubble.innerText = text;

    wrapperEl.appendChild(bubble);

    setTimeout(() => {
        bubble.style.opacity = '0'; //先变透明
        setTimeout(() => {
            if(bubble.parentNode) bubble.remove(); //3秒消失
        }, 500); 
    }, 3000);
}


//背包侧栏（左侧）
// 侧栏状态控制
    const sidebarLeft = document.getElementById('sidebar-left');
    const sidebarLeftBtn = document.getElementById('sidebar-left-btn');
    sidebarLeftBtn.onclick = function () {
      if (sidebarLeft.style.left === '0px') {
        sidebarLeft.style.left = '-270px';
      } else {
        sidebarLeft.style.left = '0px';
      }
    }
// 点侧栏外自动关闭
    document.body.addEventListener('click', function(e) {
      if (!sidebarLeft.contains(e.target) && e.target !== sidebarLeftBtn) {
        sidebarLeft.style.left = '-270px';
      }
    });

// 背包内标签切换（目前含材料和菜谱）
    const tabBtns = [
      document.getElementById('tab-materials'),
      document.getElementById('tab-recipes')
    ];
    const tabContents = [
      document.getElementById('tab-content-materials'),
      document.getElementById('tab-content-recipes')
    ];

    function setTabVertical(activeIdx) {
      tabBtns.forEach((btn, i) => {
        if (i === activeIdx) {
          btn.style.background = i === 0 ? "#eef7fb" : "#f7efe9";
          btn.style.color = "#2b4c88";
          btn.style.fontWeight = "bold";
        } else {
          btn.style.background = i === 0 ? "#f7efe9" : "#eef7fb";
          btn.style.color = "#8a8a8a";
          btn.style.fontWeight = "normal";
        }
        tabContents[i].style.display = i === activeIdx ? "" : "none";
      });
    }
    
//每次点击都能重新渲染内容
    tabBtns[0].onclick = () => {
  setTabVertical(0);     // 切换到材料tab
  renderMaterialBag();   // 重新渲染材料内容
};
tabBtns[1].onclick = () => {
  setTabVertical(1);     // 切换到菜谱tab
  renderRecipeBook();    // 重新渲染菜谱内容
};

//时间推进
function nextTime() {
  timeIdx++;
  if(timeIdx >= shichenArr.length){
    //如果过完了一天的最后一个时辰，延迟一小会儿进入下一天
    setTimeout(endDay, 350);
  } else {
    //否则继续刷新经营界面
    showBusiness();
  }
  update();
  //可以加入随着时间推进触发的特殊事件
}

//每日结束，会调用一个均值回归函数calculateNextVolatility，放在main.js最下面
function endDay() {
  day++;
  timeIdx = 0;
  newsEffect = {};//清空前一天的新闻影响
  marketVolatility.farmer = calculateNextVolatility(marketVolatility.farmer, 1.0, 0.05);//波动很小
  marketVolatility.market = calculateNextVolatility(marketVolatility.market, 1.0, 0.15);//波动中等
  marketVolatility.innkeeper = calculateNextVolatility(marketVolatility.innkeeper, 1.0, 0.3);//波动大大！

//新闻逻辑
  if(typeof newsPool !== 'undefined') {
    let news = newsPool[Math.floor(Math.random() * newsPool.length)];
    if(news && news.effect) news.effect();
    let newsDom = document.getElementById('news');
    if(newsDom) newsDom.textContent ="【今日街头新闻】" + news.text;
      }

      //价格波动提示
      let trendText = "";
      if (marketVolatility.innkeeper > 1.3) trendText = "（听说酒楼的进货价涨疯了！）";
      else if (marketVolatility.innkeeper < 0.8) trendText = "（酒楼老板似乎在亏本甩卖...）";
      else if (marketVolatility.farmer < 0.9 && marketVolatility.market > 1.1) trendText = "（农户那边还是老价钱，集市却涨了。）";

      pushText(`第${day}天到了。${trendText}`);

}


// 初始化
    setTabVertical(0);
//获取材料函数，是用于确保曾经获取过的材料都会体现在页面里，如果获取过但是数量为0则为灰色
    function gainMaterial(id, num) {
      if (materials[id] == undefined)//undefined说明是第一次获得的
      {
        materials[id] = 0;//初次获得食材初始化

        let info = getMaterialInfo(id);
        let bigIcon = `<img src="${info.img}" style="width:32px;height:32px;vertical-align:bottom;margin:0 4px;border-radius:4px;">`;//新发现提示图片
        pushText(`【新发现】你第一次获取了食材：${bigIcon}<b>${info.name}!背包已解锁该栏位。`);

      } 
      
      materials[id] += num;
      if(materials[id] < 0) materials[id] = 0;//禁止负数
      update();
}



    // 材料栏
    function renderMaterials() {
  // 遍历 materials 对象
  let arr = Object.entries(materials).map(([id, count]) => {
    // 查字典获取中文名
    const info = getMaterialInfo(id);
    return `${info.name}:${count}`;
  });
  document.getElementById('materials').textContent = '库存｜' + arr.join('　');
}
    // 动态配色，按照时间变更背景色
    function setThemeByTime() {
      let b = document.body, btns = document.querySelectorAll('#actions button');
      if (timeIdx===0) {
        b.style.background = "#f6f6f9";
        btns.forEach(x=>{x.style.background="#fff9f2";x.style.color="#543b0b";});
      } else if (timeIdx<=2) {
        b.style.background = "#fff7e3";
        btns.forEach(x=>{x.style.background="#ffe3b2";x.style.color="#724b00";});
      } else if (timeIdx===3) {
        b.style.background = "#ffe7b8";
        btns.forEach(x=>{x.style.background="#ffb859";x.style.color="#704400";});
      } else {
        b.style.background = "linear-gradient(180deg,#23334c 80%,#39456a 100%)";
        btns.forEach(x=>{x.style.background="#3a4c74";x.style.color="#f8e0aa";});
      }
    }
    // 进入夜晚判定
    function isNight() { return timeIdx >= 3; }
    // 新品解锁
    function unlockProduct(pid) {
      let prod = recipes.find(p => p.id === pid);
      if (prod && !prod.unlocked) {
        prod.unlocked = true;
        log(`新品解锁：「${prod.name}」`);
        pushText(`你解锁了新品：${prod.name}！`);
      }
    }
    // 行动
    function setActions(buttons) {
      const actions = document.getElementById('actions');
      actions.innerHTML = '';
      buttons.forEach(btn => {
        let b = document.createElement('button');
        b.textContent = btn.text;
        b.onclick = btn.action;
        actions.appendChild(b);
      });
      setThemeByTime();
    }






//菜谱选择进行售卖
function selectRecipe(recipeId) {
  selectedRecipeId = recipeId;
  renderRecipeBook();
  showBusiness();//要手动调用一次让主按钮mainBtn重新渲染一下
}

//辅助算法函数，类似股市，但不同的商户取不同的波动幅度
function calculateNextVolatility(current, target = 1.0, range = 0.1) {
  let change = (Math.random() - 0.5) * (range * 2);//在-0.1到+0.1之间波动
  //均值回归
  let gravity = (target - current) * 0.15;
  let next = current + change + gravity;
  //防止极端价格
  return Math.max(0.5, Math.min(2.5, next));
}
//gemini给的初始化执行部分
setTabVertical(0);
// 侧栏逻辑
const sidebar = document.getElementById('sidebar');
const sidebarBtn = document.getElementById('sidebar-btn');
if(sidebar && sidebarBtn) {
  sidebarBtn.onclick = function () {
    sidebar.classList.toggle('active');
  }
  sidebar.onclick = function (e) {
    if (e.target === sidebar) sidebar.classList.remove('active');
  }
}
//存档功能
function saveGame() {
  const saveData = {//所有重要变量打包
    base:{money,reputation,day,timeIdx,maxShopSlots},
    materials:materials,
    selectedRecipeIds:selectedRecipeIds,
    marketVolatility:marketVolatility,
    //复杂状态
    recipesUnlockStatus:recipes.map(r => ({id:r.id,unlocked:r.unlocked})),
    charactersData:window.characters || {},
    condimentsData:window.playerCondiments || {},
    shopHistory:window.dailyShopHistory || {}
  };
  //浏览器缓存录入
  localStorage.setItem('wudalang_save_v1', JSON.stringify(saveData));
  console.log("Game Saved ✅");
}
//读档功能
function loadGame() {
    const saveString = localStorage.getItem('wudalang_save_v1');
    if (!saveString) return false; //如果没有存档，返回失败

    try {
        const data = JSON.parse(saveString);
        
        //恢复基础数值
        money = data.base.money;
        reputation = data.base.reputation;
        day = data.base.day;
        timeIdx = data.base.timeIdx;
        maxShopSlots = data.base.maxShopSlots || 2;
        //恢复对象
        materials = data.materials;
        selectedRecipeIds = data.selectedRecipeIds || ['basic'];
        marketVolatility = data.marketVolatility || { farmer: 1.0, market: 1.0, innkeeper: 1.0 };
        //恢复菜谱解锁状态
        if (data.recipesUnlockStatus) {
            data.recipesUnlockStatus.forEach(status => {
                let r = recipes.find(x => x.id === status.id);
                if (r) r.unlocked = status.unlocked;
            });
        }
        //恢复角色数据 (深度合并)
        if (data.charactersData && window.characters) {
            for (let charId in data.charactersData) {
                if (window.characters[charId]) {
                    Object.assign(window.characters[charId], data.charactersData[charId]);
                }
            }
        }
        //恢复调料
        if (data.condimentsData && window.playerCondiments) {
            Object.assign(window.playerCondiments, data.condimentsData);
        }
        //恢复进货历史
        if (data.shopHistory) {
            window.dailyShopHistory = data.shopHistory;
        }
        pushText(`📅 读取存档成功！回到第 ${day} 天。`);
        return true; //读取成功
    } catch (e) {
        console.error("存档损坏", e);
        return false;
    }
}
//重开
window.resetGame = function() {
    if(confirm("确定要删除存档并重新开始吗？")) {
        localStorage.removeItem('wudalang_save_v1');
        location.reload(); // 刷新网页
    }
}
// 启动
if (!loadGame()) {
    // 只有在新游戏时，才显示这段初始文本
    let newsDom = document.getElementById('news');
    if(newsDom) newsDom.textContent = "【今日街头新闻】今天的街道很热闹，要开始卖炊饼了！";
    pushText('你整装待发，准备开启一天的生意。');
}

if (typeof showBusiness === 'function') {
    showBusiness();
} else {
    console.warn("businessEvents.js 尚未加载，请确保在 index.html 中正确引用。");
}
setTimeout(() => {//解决characters.js没有加载的问题，必须强制刷新一下好感列表
    renderFavors();
}, 100);