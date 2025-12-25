// 进货渠道这一块
const purchaseChannels = [
  {
    id: 'farmer', 
    unlocked: true, 
    label: '相熟农户',
    desc: '价格便宜(6折)，但种类有限',
    multiplier: 0.6, // 价格倍率
    // 定义这个渠道每次给什么东西
    package: { flour: 2, ghee: 2, vegetable: 2 }, 
    // 动态计算价格函数
    getPrice: function() {
      let totalBasePrice = 0;
      for (let [id, num] of Object.entries(this.package)) {
        totalBasePrice += getMaterialInfo(id).basePrice * num;
      }
      // 计算结果：总原价 * 倍率，并向上取整
      return Math.ceil(totalBasePrice * this.multiplier);
    },
    result: () => {
      // 发放固定包裹
      gainMaterial('flour', 2);
      gainMaterial('ghee', 2);
      gainMaterial('vegetable', 2);
      
      // 随机惊喜：兔子肉
      if (Math.random() < 0.2) {
        gainMaterial('meat', 1);
        pushText('相熟的农户姨姨神神秘秘地递给你一包东西——是兔子肉！');
      }
    }
  },
  {
    id: 'innkeeper', 
    unlocked: true, 
    label: '酒楼奸商',
    desc: '食材齐全，但有溢价(1.2倍)',
    multiplier: 1.2,
    package: { flour: 2, ghee: 2, vegetable: 2, meat: 2 },
    getPrice: function() {
      let totalBasePrice = 0;
      for (let [id, num] of Object.entries(this.package)) {
         totalBasePrice += getMaterialInfo(id).basePrice * num;
      }
      return Math.ceil(totalBasePrice * this.multiplier);
    },
    result: () => {
      gainMaterial('flour', 2);
      gainMaterial('ghee', 2);
      gainMaterial('vegetable', 2);
      gainMaterial('meat', 2);

      // 夜间概率触发折箩
      if (isNight() && Math.random() < 0.4) {
        triggerInnDiscardEvent();
        return false; // 阻止直接刷新页面，进入分支
      }
    }
  }
];

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


    // 时辰推进与夜晚重置
    function nextTime() {
      timeIdx++;
      if(timeIdx>=shichenArr.length){
        setTimeout(endDay,350);
      } else {
        showBusiness();
      }
      update();
      triggerRandomEvent();
    }
    function endDay() {
      day++;
      timeIdx=0;
      newsEffect = {};
      // 新的新闻
      let news = newsPool[Math.floor(Math.random() * newsPool.length)];
      news.effect();
      document.getElementById('news').textContent = "【今日街头新闻】" + news.txt;
      pushText(`第${day}天清晨，你又要开始新一天的生意了。`);
      log('新的一天开始了。');
      // 腹泻负面事件判定
      if (window.hasInnDiscard) {
        if (Math.random()<0.5) {
          pushText("次日清晨，有顾客腹泻，店铺声望下降！");
          reputation -= 3;
          log("腹泻事件：声望-3");
        }
        window.hasInnDiscard = false;
      }
      update();
      showBusiness();
    }