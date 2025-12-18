// 状态变量和数据最初定义
let money = 10, reputation = 10, day = 1, timeIdx = 0, state = 'business';
const shichenArr = ["清晨", "上午", "中午", "午后", "夜晚"];
let materials = { 面粉: 3, 酥油: 3, 蔬菜: 0, 肉: 0 };
let favors = [ { name: "金莲", value: 0 }, { name: "西门庆", value: 0 }, { name: "武松", value: 0 } ];

let selectedRecipeId = 'basic';//初始化选中菜谱

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


// 初始化
    setTabVertical(0);
//获取材料函数，是用于确保曾经获取过的材料都会体现在页面里，如果获取过但是数量为0则为灰色
    function gainMaterial(name, num) {
      if (materials[name] == null) materials[name] = 0;//先检查是否已有，如果没有就先定义为0
      materials[name] += num;
      if (materials[name] < 0) materials[name] = 0; // 不让材料变成负数
      update(); 
}



    // 材料栏
    function renderMaterials() {
      let arr = Object.entries(materials).map(([k,v])=>`${k}:${v}`);
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
