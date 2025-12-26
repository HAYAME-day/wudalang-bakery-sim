//进货渠道这一块
//进货需要分类定义，农户卖基础款，集市卖基础+偶尔出现高端，奸商只卖高端

const purchaseChannels = [
  {
    id: 'farmer', 
    label: '相熟农户',
    baseMultiplier: 0.6,
    desc: '老实人，只卖地里长出来的东西。',
    // 逻辑：筛选所有标签包含 "crop" 的物品
    getInventory: () => materialsList
      .filter(m => m.tags.includes('crop'))
      .map(m => m.id)
  },
  {
    id: 'market', 
    label: '清晨集市',
    baseMultiplier: 1.0, 
    desc: '这里汇集了各种肉蛋和调料。',
    // 逻辑：筛选 "animal"(畜产) 或 "condiment"(调料)
    // 并且排除掉太高级的 "dairy"(奶制品) 以防和酒楼抢生意
    getInventory: function() {
      // 每天随机一下集市的货
      return getDailyMarketInventory();
    }
  },
  {
    id: 'innkeeper', 
    label: '酒楼奸商',
    baseMultiplier: 1.4, 
    desc: '专门卖那些进口货、发酵品和高级奶制品。',
    // 逻辑：筛选 "imported"(舶来), "fermented"(发酵), "dairy"(奶)
    getInventory: () => materialsList
      .filter(m => m.tags.includes('imported') || m.tags.includes('fermented') || m.tags.includes('dairy'))
      .map(m => m.id)
  }
];

// 2. 集市的伪随机逻辑 (配合标签系统)
function getDailyMarketInventory() {
  // 基础池：所有畜产品(肉蛋) + 调味品
  let pool = materialsList.filter(m => 
    (m.tags.includes('animal') || m.tags.includes('condiment')) && 
    !m.tags.includes('dairy') && // 不卖高级奶
    !m.tags.includes('imported') // 不卖进口货
  );
  
  let dailyItems = [];
  
  // 遍历池子，根据天数决定今天卖不卖
  pool.forEach((item, index) => {
    // 基础肉蛋类(meat, egg)常驻，其他的随机出现
    if (item.id === 'meat' || item.id === 'egg' || item.id === 'scallion') {
      dailyItems.push(item.id);
    } else {
      // 伪随机：利用 sin 函数，保证同一天结果一致
      let pseudoRandom = Math.sin(day * 100 + index);
      if (pseudoRandom > -0.2) { // 70% 概率出现
        dailyItems.push(item.id);
      }
    }
  });
  
  return dailyItems;
}

// 经营主按钮
function showBusiness() {
  state = 'business';
  //找到当前选中的菜谱对象并售卖
  let selectedRecipe = recipes.find(r => r.id === selectedRecipeId && r.unlocked);//遍历寻找第一个既被选中id又已经解锁的对象
  let mainBtn = selectedRecipe
    ? [{ text: `卖${selectedRecipe.name}`,action: ()=>sell(selectedRecipe)}]
    : [];//没有选中菜谱的时候，就没有按钮出现
  setActions([
    ...mainBtn,
    { text: '进货', action: shop },
    { text: '宣传', action: advertise },
    { text: '研发', action: showResearchPanel },
    { text: '结束今日', action: endDay }
  ]);
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

// 进货系统
function shop() {
  // 动态生成按钮，显示动态计算的价格
  setActions(
    purchaseChannels.filter(ch => ch.unlocked).map(ch => {
      let currentPrice = ch.getPrice();
      return {
        text: `${ch.label} (${currentPrice}钱)`,
        action: () => purchase(ch, currentPrice)
      };
    }).concat([{text:'返回', action: showBusiness}])
  );
  pushText('请选择进货渠道：');
}
    function purchase(channel, cost) {
      if (money < cost) {
        pushText("钱不够了，无法采购。");
        log('进货失败：余额不足');
        return;
      }
      money -= cost;
      let branch = channel.result();
      update();
      if (branch === false) return; // 特殊分支事件已处理
      pushText(`向${channel.label}进货成功！消费${cost}文。`);
      log('进货成功。');
      showBusiness();
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

