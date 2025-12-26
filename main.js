// 状态变量和数据最初定义
let money = 10, reputation = 10, day = 1, timeIdx = 0, state = 'business';
const shichenArr = ["清晨", "上午", "中午", "午后", "夜晚"];
let materials = { flour: 3, ghee: 3, vegetable: 0, meat: 0 };
let favors = [ { name: "金莲", value: 0 }, { name: "西门庆", value: 0 }, { name: "武松", value: 0 } ];

let selectedRecipeId = 'basic';//初始化选中菜谱
let marketVolatility = { farmer: 1.0, market: 1.0, innkeeper: 1.0 };//进货倍率变动初始化


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

}
    // 好感侧栏（右侧）
    function renderFavors() {
      let html = favors.map(f=>`<div class="favor-item"><span class="favor-name">${f.name}</span><span class="favor-value">${f.value}</span></div>`).join("");
      document.getElementById('favor-list').innerHTML = html;
    }
    // 背包侧栏（左侧）

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
  newsEffect();//清空前一天的新闻影响
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
      if (materials[id] == undefined)
      {
        materials[id] = 0;//初次获得食材初始化
      } 
      let info = getMaterialInfo(id);
      let bigIcon = `<img src="${info.img} style="width:32px;height:32px;vertical-align:buttom;margin:0 4px;border-radius:4px;">`;//新发现提示图片
      pushText(`【新发现】你第一次获取了食材：${bigIcon}<b>${info.name}!背包已解锁该栏位。`);

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





// 侧栏逻辑
const sidebar = document.getElementById('sidebar');
document.getElementById('sidebar-btn').onclick = function () {
  sidebar.classList.toggle('active');
}
sidebar.onclick = function (e) {
  if (e.target === sidebar) sidebar.classList.remove('active');
}


// 页面初始化
document.getElementById('news').textContent = "【今日街头新闻】今天的街道很热闹，要开始卖炊饼了！";
pushText('你整装待发，准备开启一天的生意。');
update();
showBusiness();  // 链接去businessEvents.js

//菜谱选择进行售卖
function selectRecipe(recipeId) {
  selectedRecipeId = recipeId;
  renderRecipeBook();
  showBusiness();//要手动调用一次让主按钮mainBtn重新渲染一下
}

//辅助算法函数，类似股市，但不同的商户取不同的波动幅度
function calculateNextVolatility(current, target = 1.0) {
  let charge = (Math.random() - 0.5) * (range * 2);//在-0.1到+0.1之间波动
  //均值回归
  let gravity = (target - current) * 0.15;
  let next = current + change + gravity;
  //防止极端价格
  return Math.max(0.5, Math.min(2.5, next));
}