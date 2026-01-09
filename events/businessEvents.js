//进货渠道这一块
//进货需要分类定义，农户卖基础款，集市卖基础+偶尔出现高端，奸商只卖高端
//需要记录今天已经在各个进货商买了多少东西，以扣减库存
let dailyShopHistory = {};

//当前购物车状态
let currentCart = {};
let currentMerchantId = null;
let currentMultiplier = 1.0;

//商家定义，考虑后期加入第四商家卖股票之类的
const purchaseChannels = [
  {
    id: 'farmer', 
    label: '相熟农户',
    baseMultiplier: 0.6,
    desc: '老实人，只卖地里长出来的东西。',
    // 逻辑：筛选所有标签包含 "crop" 的物品
    getInventoryData: function() {
      //库存随机设置数量在限定范围内
      return materialsList
        .filter(m => m.tags.includes('crop'))
        .map(m => ({ id: m.id, stockRange: [20,35]}));
    }
  },
  {
    id: 'market', 
    label: '清晨集市',
    baseMultiplier: 1.0, 
    desc: '应有尽有，那是肉铺还是洋货？碰碰运气吧。',
    // 筛选：蔬菜+畜产品+奶制品+调料
    getInventoryData: function() {
      return materialsList.filter(m => {
      //必定出现老五样
      const staples = ['flour', 'vegetable', 'meat', 'egg', 'scallion'];
      if (staples.includes(m.id)) return true;

      //随机数
      let idSum = m.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      let seed = day * 137 +idSum;
      let rng = Math.abs(Math.sin(seed));//得到0到1之间的随机数

      //稀有货物20%概率出现：舶来品、发酵品
      if (m.tags.includes('imported') || m.tags.includes('fermented')) {
        return rng < 0.2;
      }

      //普通货物60%概率出现：奶制品、调味品、水果等
      return rng < 0.6;
    }).map(m => {
      let stockMin = 20, stockMax = 35;//实际玩了以后发现酥油是不太够的所以拉高库存
      //如果是稀有标签，刷出来的库存也更少一点
      if (m.tags.includes('imported') || m.tags.includes('fermented')) {
        stockMin = 3;
        stockMax = 8;
      }
      return {
        id: m.id,
        stockRange: [stockMin, stockMax]
      };
    });
  }
  },
  {
    id: 'innkeeper', 
    label: '酒楼奸商',
    baseMultiplier: 1.6, // 贵
    desc: '专门卖稀奇古怪的进口货和高级品。',
    //进口货+发酵品
    getInventoryData: function() {
      return materialsList
        .filter(m => m.tags.includes('imported') || m.tags.includes('fermented'))
        .map(m => ({ id: m.id, stockRange: [7, 20] })); //库存尚可
    }
  }
];



// 经营主按钮
function showBusiness() {
  state = 'business';
  //由单个selectedRecipeId转为数组
  let hasSelection = selectedRecipeIds && selectedRecipeIds.length > 0;

  let mainBtn = hasSelection
    ? [{ 
        text: `准备开张 (已选${selectedRecipeIds.length}种)`, 
        //样式微调
        style: "background:#d35400; font-weight:bold; border:2px solid #fff;", 
        action: openBusinessPrepUI //跳转到确认窗口
      }]
    : [{ 
        text: "请先在左侧选择商品", 
        style: "background:#ccc; color:#666; cursor:not-allowed;",
        action: () => pushText("请先点击左侧的【食谱】，选几个今天要卖的东西吧。") 
      }];

  setActions([
    ...mainBtn,
    { text: '进货', action: shop },
    { text: '宣传', action: advertise },
    { text: '研发', action: showResearchPanel },
    { text: '结束今日', action: endDay }
  ]);
}
//开业前的确认窗口（包含计算函数用于计算玩家上架的菜谱按照材料来算最多能做多少份
function calculateMaxCraftable(recipe) {
    if (!materials) return 0;
    let maxCount = Infinity;
    for (let key in recipe.recipe) {
        let required = recipe.recipe[key];
        let owned = materials[key] || 0;
        let count = Math.floor(owned / required);
        if (count < maxCount) maxCount = count;
    }
    //理论上不存在空配方，但是还是需要防止极端情况
    return maxCount === Infinity ? 0 : maxCount;
}

function openBusinessPrepUI() {
    let overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.zIndex = '2000';
    
    let selectedRecipes = selectedRecipeIds.map(id => recipes.find(r => r.id === id));
    
    let itemsHtml = selectedRecipes.map(r => {
        // ★ 计算最大制作量
        let maxCount = calculateMaxCraftable(r);
        // 库存告急变色提醒
        let countColor = maxCount < 5 ? '#ff4d4f' : '#4CAF50';
        let stockTip = maxCount === 0 
            ? '<span style="color:#ff4d4f;font-weight:bold">缺货! (0份)</span>' 
            : `<span style="color:${countColor}">预计可做: ${maxCount}份</span>`;

        return `
        <div style="display:flex; align-items:center; background:rgba(255,255,255,0.1); padding:10px; margin-bottom:8px; border-radius:8px;">
            <img src="${r.img}" style="width:40px; height:40px; margin-right:10px;">
            <div style="flex:1; text-align:left;">
                <div style="display:flex;justify-content:space-between">
                    <span style="font-weight:bold; color:#ffcc00;">${r.name}</span>
                    <span style="font-size:0.9em;">${stockTip}</span>
                </div>
                <div style="font-size:0.8em; color:#ccc; margin-top:4px;">
                    需: ${getRecipeIngredientsText(r)} | 标签: ${r.tags.join(', ')}
                </div>
            </div>
        </div>
    `}).join('');

    overlay.innerHTML = `
        <div class="shop-body" style="max-width:400px; max-height:80vh; display:flex; flex-direction:column; background:#3e2723; border:2px solid #d35400;">
            <div class="shop-header" style="text-align:center; padding-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1);">
                <span style="font-size:1.3em; font-weight:bold; color:#fff;">📋 今日备货核对</span>
            </div>
            
            <div style="flex:1; overflow-y:auto; padding:15px; color:#fff;">
                <p style="text-align:center; color:#aaa; margin-top:0;">大郎，看看咱家库存够不够？</p>
                ${itemsHtml}
                <div style="margin-top:20px; font-size:0.9em; background:rgba(0,0,0,0.2); padding:10px; border-radius:5px;">
                    💡 <b>经营提示：</b><br>
                    如果某个菜只能做 0 份，千万别开张！会被客人骂死的！<br>
                    请先去【进货】补充原材料。
                </div>
            </div>

            <div class="shop-footer" style="display:flex; gap:10px; padding:15px; border-top:1px solid rgba(255,255,255,0.1);">
                <button id="btn-cancel-prep" class="close-btn" style="flex:1;">再调整下</button>
                <button id="btn-start-business" class="unlock-btn" style="flex:2;">吉时已到，开张！</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-cancel-prep').onclick = () => overlay.remove();
    
    document.getElementById('btn-start-business').onclick = () => {
        // 简单检查一下是否所有菜都是0份
        let allZero = selectedRecipes.every(r => calculateMaxCraftable(r) === 0);
        if(allZero) {
            pushText("大郎！咱啥材料都没有，开张卖空气吗？先去进货吧！");
            return;
        }

        overlay.remove();
        if (typeof startCounterGame === 'function') {
            startCounterGame();
        }
    };
}


//研发引入
function showResearchPanel(){
  state = 'research';//修改页面状态
  renderResearchPanel();
}


    // 炊饼售卖逻辑（材料消耗）
function sell(product) {
      // 检查材料够不够
  for (let key in product.recipe) {
    if ((materials[key]||0) < product.recipe[key]) {
      pushText("材料不足，无法制作"+product.name);
      log('售卖失败：材料不足');
      return;
    }
  }

      // 扣材料
  for (let key in product.recipe) {
    materials[key] -= product.recipe[key];
  }
  let earn = product.price;
  let earnReputation = 0;//声望变化值初始为0
  let text = `你叫卖${product.name}，路人纷纷驻足，你顺利卖出几份。`;
      // 新闻与时辰buff
      if (product.id === "veggie" && newsEffect.bigOrder && Math.random()<0.5 && timeIdx>=2) {//timeIdx>=2指酒楼一般不会大清早和上午来采购
        earn += 6; log("酒楼大批采购，收益翻倍，+6两，声望+2");
        text='城里酒楼的主食不够了，派伙计来大批采购你的炊饼，今天赚得满满当当！';
        earnReputation = 2;
      } else if (newsEffect.badWeather && (timeIdx==1||timeIdx==2)) {
        earn = Math.max(1, Math.floor(earn*0.5)); 
        favors[0].value += 1;//总之金莲很高兴
        log('天气炎热，顾客少，收益打折，但金莲不知为何很高兴，金莲好感+1');
        text='太阳暴晒，路人稀少，来买炊饼的更少啊。你干脆招呼着金莲去把家里的被子拿出来晒晒，晚上睡起来也暄软些。';
      } else if (newsEffect.vipChance && Math.random()<0.2 && timeIdx>=3) {
        earn += 8;
        log('+8两');
        text = '一位贵客赏了你不少银两，你看着手上的银子，心想要不要给金莲买点什么？';
        // 记录到主文本区
        pushText(text);
        // 进入送礼选择分支，不直接结束本轮
        setActions([
          { text: "买礼物给金莲", action: () => giveGiftToJinlian() },
          { text: "还是省点钱吧", action: () => { pushText("你决定省点钱，家计要紧，钱自然不能乱花。"); nextTime(); } }
        ]);
        // return用于进入分支后终止后续流程
        return;
      }
      money += earn;
      reputation += earnReputation;
      pushText(text);
      update();
      nextTime();
    }

//新的进货系统，准备修改为按需进货模式
    function shop() {
      pushText("今天要光顾哪家商铺？（行情每日浮动）");

  // 1. 直接 map，不要 filter(ch => ch.unlocked) 了！
      let buttons = purchaseChannels.map(ch => {
    // 获取 main.js 里算好的今日指数
        let volatility = marketVolatility[ch.id] || 1.0;

    // 新闻特殊影响
        if (newsEffect && newsEffect.cheapGoods && ch.id === 'market') volatility *= 0.8; 

    // 最终倍率
        let currentMultiplier = ch.baseMultiplier * volatility;

    // 涨跌标签
        let tag = "";
        if (volatility < 0.95) tag = "【🔻降价】";
        else if (volatility > 1.05) tag = "【🔺涨价】";

        return {
          text: `${ch.label} ${tag}`,
          action: () => openShopUI(ch, currentMultiplier)
        };
      });

      buttons.push({ text: '返回经营', action: showBusiness });
      setActions(buttons);
    }

    // 夜间折箩事件
    function triggerInnDiscardEvent() {
      pushText("奸商搓了搓手，暗示今晚酒楼有折箩，要不要顺便捎点？");
      setActions([
        { text:"顺便买折箩", action: ()=>buyInnDiscard() },
        { text:"只买我需要的", action: ()=>showBusiness() },
      ]);
    }
    function buyInnDiscard() {
      materials['肉'] += 2; materials['蔬菜'] += 2;
      pushText("你买了折箩，大量食材到手，但你最好祈祷第二天不要有顾客吃完腹泻……");
      window.hasInnDiscard = true;
      showBusiness();
    }

    // 宣传，准备重写
    function advertise() {
      pushText("还没想好怎么宣传……");
      showBusiness();
    }

//打开商店界面
function openShopUI(channel, multiplier) {
  currentMerchantId = channel.id;
  currentMultiplier = multiplier;
  currentCart = {};//购物车清空
  //计算今日总库存-今日已买过的数量
  let rawItems = channel.getInventoryData();
  //存储本次库存
  let inventory = rawItems.map(item => {
    //按照day和itemId保持同一天库存不变
    let seed = day * 1000 + item.id.length *10;
    //分步运算，不要把小括号混到一起
    let range = item.stockRange[1] - item.stockRange[0];
    let ratio = (Math.sin(seed) + 1) /2;
    let stockBase = Math.floor(ratio * range +item.stockRange[0]);

    let historyKey = `day_${day}`;//生成一个标识日期的字符串day_1
    let bought = 0;
    if (dailyShopHistory[historyKey] && dailyShopHistory[historyKey][channel.id]) {//确认已存在今天这一页，确认已存在今天在某商家处购买，才能存在购买历史
      bought = dailyShopHistory[historyKey][channel.id][item.id] || 0;
    }
    return {
      id: item.id,
      maxStock: Math.max(0, stockBase - bought)//剩余库存计算
    };
  });
    window._tempInventory = inventory;//存入全局变量，在调用addToCart购物车时刷新

    let oldOverlay = document.getElementById('shop-overlay');
    if (oldOverlay) oldOverlay.remove();

    let overlay = document.createElement('div');
    overlay.id = 'shop-overlay';

    //价格指数
    let priceIndex = Math.round(multiplier * 100);
    let priceColor = priceIndex > 100 ? '#ff6b6b' : '#51cf66';//贵的就显示红色，便宜的就显示绿色

    //html结构渲染
    overlay.innerHTML = `
    <div class="shop-header">
      <div>
        <span style="font-size:1.2em;font-weight:bold">${channel.label}</span>
        <span style="margin-left:10px;color:#aaa">${channel.desc}</span>
      </div>
      <div>
        价格指数：<span style="color:${priceColor}">${priceIndex}%</span>
        <button class="close-btn" onclick="closeShopUI()">关闭</button>
      </div>
    </div>

    <div class="shop-body">
      <div class="shop-left">
        <div class="goods-grid" id="shop-goods-list"></div>
      </div>
      
      <div class="shop-right">
        <h3 style="border-bottom:1px solid #555;padding-bottom:5px;margin-top:0">购物篮</h3>
        <div class="cart-list" id="shop-cart-list">
          <div style="color:#666;text-align:center;margin-top:20px">篮子是空的</div>
        </div>
        <div class="shop-footer">
          <div style="margin-bottom:10px">
            总计：<span id="cart-total-price" style="color:#ffcc00;font-size:1.2em">0</span> 文
            <br><span style="font-size:0.8em;color:#aaa">钱包余额：${money} 文</span>
          </div>
          <button id="btn-checkout" class="checkout-btn" disabled onclick="checkout()">结账</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  //商品列表渲染
  renderGoodsGrid(inventory);
}

//购物系统左侧商品网格
function renderGoodsGrid(inventory) {
  let container = document.getElementById('shop-goods-list');
  container.innerHTML = '';

  inventory.forEach(item => {
    let info = getMaterialInfo(item.id);
    let price = Math.ceil(info.basePrice * currentMultiplier);//向上取整避免小数
    //玩家现有库存
    let playerStock = materials[item.id] || 0;
    //购物车现有
    let inCart = currentCart[item.id] || 0;
    let displayStock = item.maxStock - inCart;

    let div = document.createElement('div');
    div.className = 'goods-item';

    //库存没有了的场合
    if (displayStock <= 0) {
      div.style.opacity = '0.4';
      div.style.cursor = 'not-allowed';
    } else {
      div.onclick = () => addToCart(item.id, price, item.maxStock);
    }
    div.innerHTML = `
      <img src="${info.img}" class="goods-img">
      <div style="font-weight:bold">${info.name}</div>
      <div class="price-tag">${price} 文</div>
      <div class="stock-tag">余:${displayStock} | 持:${playerStock}</div>
    `;
    container.appendChild(div);
  });
}

//加入购物车交互
window.addToCart = function(id, price, maxStock) {
  if (!currentCart[id]) currentCart[id] = 0;
  //检查是否超过最大库存
  if (currentCart[id] < maxStock) {
    currentCart[id]++;
    updateCartDisplay();
    //更新左侧的余量显示
    renderGoodsGrid(window._tempInventory);
  }
};
//右侧购物车显示
function updateCartDisplay() {
  let container = document.getElementById('shop-cart-list');
  let totalSpan = document.getElementById('cart-total-price');
  let btn = document.getElementById('btn-checkout');

  container.innerHTML = '';
  let total = 0;
  let count = 0;

  for (let id in currentCart) {
    let num = currentCart[id];
    if (num > 0) {
      let info = getMaterialInfo(id);
      let price = Math.ceil(info.basePrice * currentMultiplier);
      let cost = price * num;
      total += cost;
      count++;

      let row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <span>${info.name} x${num}</span>
        <span style="color:#ccc">${cost}文</span>
      `;
      container.appendChild(row);
    }
  }
  totalSpan.textContent = total;
  //余额不足的场合
  if (total > money) {
    totalSpan.style.color = '#ff4d4f';
    btn.textContent = "余额不足";
    btn.disabled = true;
    btn.style.background = '#555';
  } else if (count ===0) {
    btn.textContent = "结账";
    btn.disabled = true;
  } else {
    totalSpan.style.color = '#ffcc00';
    btn.textContent = `支付${total}文钱`;
    btn.disabled = false;
    btn.style.background = '#4CAF50';
  }
}

//结账的逻辑部分
window.checkout = function() {
  let total = 0;
  for (let id in currentCart) {
    let info = getMaterialInfo(id);
    let price = Math.ceil(info.basePrice * currentMultiplier);
    total += price * currentCart[id];
  }
  if (money < total) return;

  //先扣钱再加玩家已有的库存
  money -= total;
  let historyKey = `day_${day}`;
  if (!dailyShopHistory[historyKey]) dailyShopHistory[historyKey] = {};//如果day_1这样的key不存在就创建一个
  if (!dailyShopHistory[historyKey][currentMerchantId]) dailyShopHistory[historyKey][currentMerchantId] = {};//如果当前商家的key不存在就创建一个

  let logMsg = [];

  for (let id in currentCart) {
    let num = currentCart[id];
    if (num > 0) {
      //调用main.js的通用加货函数 (触发新发现)
      gainMaterial(id, num);
      //记录今日已买，防止刷库存
      let oldBought = dailyShopHistory[historyKey][currentMerchantId][id] || 0;
      dailyShopHistory[historyKey][currentMerchantId][id] = oldBought + num;
      
      let name = getMaterialInfo(id).name;
      logMsg.push(`${name}x${num}`);
    }
  }
  //文本框显示
  pushText(`采购完成！共花费${total}文，买入:${logMsg.join(',')}`);
  closeShopUI();
  update();//更新主界面金钱显示
};
window.closeShopUI = function() {
  let overlay = document.getElementById('shop-overlay');
  if (overlay) overlay.remove();
};