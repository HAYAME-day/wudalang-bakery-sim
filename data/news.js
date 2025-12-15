 const newsPool = [
      { txt: "商队带来廉价牛羊肉，原料进货更便宜！", effect: ()=>{ newsEffect.cheapGoods = true; } },
      { txt: "城里流行香饼夹白肉，批发订单概率提升！", effect: ()=>{ newsEffect.bigOrder = true; } },
      { txt: "今日天气炎热，大家胃口差，销量略低。", effect: ()=>{ newsEffect.badWeather = true; } },
      { txt: "西门庆溜达过来说夹心，解锁新炊饼！", effect: ()=>{ unlockProduct('stuffed'); } },
      { txt: "坊间谣传：今日卖炊饼可能遇到贵客！", effect: ()=>{ newsEffect.vipChance = true; } },
      { txt: "听说有江南大厨路过本镇，带来肉夹心饼新配方！", effect: ()=>{ unlockProduct('meat'); } },
      { txt: "一切如常，安稳经商的一天。", effect: ()=>{} }
    ];
let newsEffect = {};