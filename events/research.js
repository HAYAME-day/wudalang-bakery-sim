//研发台初始化
let researchSlots = [null, null, null];

//研发页面打开
window.renderResearchPanel = function() {
  researchSlots = [null, null, null];
  //遮罩层
  let oldOverlay = document.getElementById('shop-overlay');
  if (oldOverlay) oldOverlay.remove();

  let overlay = document.createElement('div');
  overlay.id = 'shop-overlay';

  overlay.innerHTML = `
        <div class="shop-header">
            <div>
                <span style="font-size:1.2em;font-weight:bold">🧪 新品研发室</span>
                <span style="margin-left:10px;color:#aaa">拖动3种食材尝试组合</span>
            </div>
            <button class="close-btn" onclick="closeShopUI()">关闭</button>
        </div>

        <div class="shop-body">
            <div class="research-container">
                <div class="research-left" id="research-inventory"></div>
                
                <div class="research-right">
                    <div class="slots-container" id="research-slots">
                        </div>
                    
                    <div class="research-hint" id="research-hint">
                        请放入3种不同的食材...
                    </div>
                    
                    <button id="btn-research" class="research-btn" onclick="attemptResearch()">
                        开始研发
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    renderResearchInventory();
    renderSlots();
}

//只显示拥有的食材
function renderResearchInventory() {
  let container = document.getElementById('research-inventory');
  container.innerHTML = '';
  //筛选拥有数量大于0的食材
  let ownedItems = Object.keys(materials).filter(id => materials[id] > 0);
  //保险，如果包里啥也没了
  if(ownedItems.length === 0) {
        container.innerHTML = '<div style="color:#888;text-align:center;margin-top:20px">背包空空如也，先去进货吧！</div>';
        return;
      }
      //网格布局复用
  let grid = document.createElement('div');
  grid.className = 'goods-grid';

  ownedItems.forEach(id => {
    let info = getMaterialInfo(id);
    //已放在槽位里面的食材会变灰色
    let isUsed = researchSlots.includes(id);
    let itemDiv = document.createElement('div');
    itemDiv.className = `goods-item draggable-item ${isUsed ? 'used' : ''}`;
    //可拖拽
    itemDiv.draggable = !isUsed;
    if(!isUsed) {
      itemDiv.ondragstart = (e) => {
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "copy";
      };
      //基础点击添加食材
      itemDiv.onclick = () => addToFirstEmptySlot(id);
    }

    itemDiv.innerHTML = `
            <img src="${info.img}" class="goods-img">
            <div style="font-size:0.9em;font-weight:bold">${info.name}</div>
            <div style="font-size:0.8em;color:#aaa">持: ${materials[id]}</div>
        `;
        grid.appendChild(itemDiv);
  });
  container.appendChild(grid);
}
//右侧三个槽位
function renderSlots() {
  let container = document.getElementById('research-slots');
  container.innerHTML = '';
  //遍历researchSlots数组
  researchSlots.forEach((slotItem, index) => {
    let slotDiv = document.createElement('div');
    //如果该槽位有东西，则加入filled已被填充的样式
    slotDiv.className = `research-slot ${slotItem ? 'filled' : ''}`;

    //放置逻辑
    //允许有人拖东西经过
    slotDiv.ondragover = (e) => {
      e.preventDefault();//阻止默认行为就能允许放置
      slotDiv.classList.add('drag-over');//加高亮边框
    };
    //如果人走了没放就取消高亮
    slotDiv.ondragleave = () => {
      slotDiv.classList.remove('drag-over');
    };
    //松手把它放下来了，就读取数据
    slotDiv.ondrop = (e) => {
      e.preventDefault();
      slotDiv.classList.remove('drag-over');
      //从传输器里拿到ID
      let matId = e.dataTransfer.getData("text/plain");
      if (matId) setSlot(index, matId);
    };
    //槽位里有东西就显示图片，没有就只显示加号
    if (slotItem) {
            let info = getMaterialInfo(slotItem);
            slotDiv.innerHTML = `
                <img src="${info.img}" class="slot-img" title="${info.name}">
                <div class="slot-remove" onclick="removeSlot(${index})">×</div>
            `;
        } else {
            slotDiv.innerHTML = `<span style="color:#666;font-size:2em">+</span>`;
        }
        
        container.appendChild(slotDiv);
    });
    //每次画完槽位都要检查现有组合是否正确
    updateResearchState();
}

function setSlot(index, matId) {
  //防止重复放入同样素材
  if (researchSlots.includes(matId) && researchSlots[index] !== matId) {
    pushText("同样的食材放一份就够啦！");
    return;
  }
  researchSlots[index] = matId;
  //界面更新
  renderResearchInventory();
  renderSlots();
}
//点击左侧自动填入第一个空位
function addToFirstEmptySlot(matId) {
  let emptyIndex = researchSlots.indexOf(null);
  if (emptyIndex !== -1) {
    setSlot(emptyIndex, matId);
  } else {
    pushText("研发台放不下了，先拿下来一个吧。");
  }
}

//移除槽位里的东西
window.removeSlot = function(index) {
  researchSlots[index] = null;
  renderResearchInventory();
  renderSlots();
}

//检查配方并更新状态
function updateResearchState() {
  let btn = document.getElementById('btn-research');
  let hint = document.getElementById('research-hint');
  //现在放了几个东西
  let currentItems = researchSlots.filter(x => x!== null);
  //不满3个的时候按钮为灰色并提示还需要几个
  if (currentItems.length < 3) {
    btn.classList.remove('active');
    hint.textContent = `还需要 ${3 - currentItems.length} 种食材…`;
    hint.style.color = "#aaa";
    return;
  }
  //满3个了，去查配方表比对
  let result = checkRecipeResult(currentItems);

  if (!result) {
    //没有这个菜
    btn.classList.remove('active');
    hint.textContent = "🚫这个组合似乎做不出什么…";
    hint.style.color = "#ff6b6b";
  } else if (result.unlocked) {
    //已经会做了
    btn.classList.remove('active');
    hint.innerHTML = `✅就是<b>${result.name}</b>嘛，已经会做啦！`;
    hint.style.color = "#4CAF50";
  } else {
    //发现新菜谱
    btn.classList.add('active');
    hint.textContent = "✨空气中弥漫着未知的香气！(点击研发吧)";
    hint.style.color = "#ffcc00";
    //要解锁的菜谱ID存好
    btn.dataset.targetId = result.id;
  }
}

//比对配方算法
function checkRecipeResult(items) {
  //item是当前槽位里的三个id，要去recipes数组比对
  for (let r of recipes) {
    let requiredKeys = Object.keys(r.recipe);
    //必须是3种材料
    if (requiredKeys.length !== 3) continue;
    //完全包含不分顺序
    let match = requiredKeys.every(reqId => items.includes(reqId));

    if (match) return r;
  }
  return null;
}

//点击开始研发
window.attemptResearch = function() {
  let btn = document.getElementById('btn-research');
  //从按钮上拿到刚才存的配方ID
  let targetId = btn.dataset.targetId;

  if(!targetId) return;

  let recipe = recipes.find(r => r.id === targetId);
  if (recipe) {
    recipe.unlocked = true;
    //消耗掉这3个材料
    researchSlots.forEach(id => {
      if(id) materials[id]--;
    });
    //弹窗恭喜
    showUnlockPopup(recipe);
    //刷新页面状态（需要刷新研发台自身、食谱页面、食材页面、全局状态
    renderResearchInventory();
    renderSlots();
    if(typeof renderRecipeBook === 'function') renderRecipeBook();
    if(typeof renderMaterialBag === 'function') renderMaterialBag();
    if(typeof update === 'function') update();

    log(`研发成功！解锁了新品：${recipe.name}`);
    pushText(`💡 灵光一闪！你学会了制作 <b>${recipe.name}</b>！快去加入菜单吧。`);
  }
}

function showUnlockPopup(recipe) {
  let div = document.createElement('div');
  div.className = 'unlock-overlay';
  div.innerHTML = `
        <div class="unlock-modal">
            <div class="unlock-title">✨ 研发成功 ✨</div>
            <img src="${recipe.img}" class="unlock-img">
            <div class="unlock-name">${recipe.name}</div>
            <div style="color:#888;font-style:italic;margin-bottom:20px">${recipe.hint}</div>
            <div style="font-size:0.9em;color:#543b0b;background:rgba(0,0,0,0.05);padding:10px;border-radius:8px">
                基础售价：<span style="color:#d35400;font-weight:bold">${recipe.price}文</span>
            </div>
            <button class="unlock-btn" onclick="this.parentElement.parentElement.remove()">太棒了！</button>
        </div>
    `;
    document.body.appendChild(div);
}
//恭喜弹窗
function showUnlockPopup(recipe) {
  let div = document.createElement('div');
  div.className = 'unlock-overlay';
  div.innerHTML = `
        <div class="unlock-modal">
            <div class="unlock-title">✨ 研发成功 ✨</div>
            <img src="${recipe.img}" class="unlock-img">
            <div class="unlock-name">${recipe.name}</div>
            <div style="color:#888;font-style:italic;margin-bottom:20px">${recipe.hint}</div>
            <div style="font-size:0.9em;color:#543b0b;background:rgba(0,0,0,0.05);padding:10px;border-radius:8px">
                基础售价：<span style="color:#d35400;font-weight:bold">${recipe.price}文</span>
            </div>
            <button class="unlock-btn" onclick="this.parentElement.parentElement.remove()">太棒了！</button>
        </div>
    `;
    document.body.appendChild(div);
}