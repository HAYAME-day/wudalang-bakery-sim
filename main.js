// 状态变量和数据最初定义
let money = 10, reputation = 10, day = 1, timeIdx = 0, state = 'business';
const shichenArr = ["清晨", "上午", "中午", "午后", "夜晚"];
let materials = { 面粉: 5, 酥油: 5, 蔬菜: 2, 肉: 1 };
let favors = [ { name: "金莲", value: 0 }, { name: "西门庆", value: 0 }, { name: "武松", value: 0 } ];

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
}
    // 好感侧栏
    function renderFavors() {
      let html = favors.map(f=>`<div class="favor-item"><span class="favor-name">${f.name}</span><span class="favor-value">${f.value}</span></div>`).join("");
      document.getElementById('favor-list').innerHTML = html;
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
      let prod = products.find(p => p.id === pid);
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
