//data/materials.js，包括食材定义和图片，还要规定食材的价格，不同进货商的食材价格倍率不同


const materialsList = [
  // --- 基础农作物 (Crops) ---
  { 
    id: "flour", 
    name: "面粉", 
    basePrice: 2, 
    tags: ["crop", "basic"], // 农作物, 基础
    img: "images/materials/flour.png",
    desc: "洁白的麦粉，做饼的灵魂。"
  },
  { 
    id: "vegetable", 
    name: "蔬菜", 
    basePrice: 2, 
    tags: ["crop", "basic"], 
    img: "images/materials/vegetable.png", 
    desc: "新鲜采摘的青菜。"
  },
  { 
    id: "potato", 
    name: "土豆", 
    basePrice: 3, 
    tags: ["crop"], 
    img: "images/materials/potato.png", 
    desc: "蒸熟了的话是软软的，但是吃多了烧心。"
  },
  { 
    id: "scallion", 
    name: "大葱", 
    basePrice: 3, 
    tags: ["crop", "condiment"], // 既是农作物也是调味
    img: "images/materials/scallion.png", 
    desc: "辛辣翠绿的葱段，提味一绝。"
  },
  { 
    id: "chili", 
    name: "辣椒", 
    basePrice: 5, 
    tags: ["crop", "condiment"], 
    img: "images/materials/chili.png", 
    desc: "红彤彤的干辣椒，看着就让人冒汗。"
  },
  { 
    id: "fruit", 
    name: "浆果", 
    basePrice: 16, 
    tags: ["crop", "fruit"], 
    img: "images/materials/fruit.png", 
    desc: "许多种多汁水果的组合，酸酸甜甜。"
  },
  { 
    id: "sugar", 
    name: "糖块", 
    basePrice: 5, 
    tags: ["crop", "condiment"], 
    img: "images/materials/sugar.png", 
    desc: "调味品，普通的糖。"
  },

  // --- 畜产品 (Animal Products) ---
  { 
    id: "meat", 
    name: "肉", 
    basePrice: 5, 
    tags: ["animal"], // 畜产品
    img: "images/materials/meat.png", 
    desc: "肉。不管是兔子还是猪，好歹都是肉。"
  },
  { 
    id: "egg", 
    name: "鸡蛋", 
    basePrice: 2, 
    tags: ["animal"], 
    img: "images/materials/egg.png", 
    desc: "圆滚滚的鸡蛋。"
  },
  { 
    id: "yolk", 
    name: "蛋黄", 
    basePrice: 10, 
    tags: ["animal", "processed"], 
    img: "images/materials/yolk.png", 
    desc: "油润起沙的咸蛋黄，富得流油。"
  },

  // --- 奶制品/油脂/高端 (Dairy & High-end) ---
  { 
    id: "milk", 
    name: "牛奶", 
    basePrice: 4, 
    tags: ["animal", "dairy"], 
    img: "images/materials/milk.png", 
    desc: "新鲜挤出的牛奶，带着微甜的香气。"
  },
  { 
    id: "ghee", 
    name: "酥油", 
    basePrice: 2, 
    tags: ["animal", "dairy", "basic"], 
    img: "images/materials/ghee.png",
    desc: "中式糕饼最常用的油脂，层层起酥。" 
  },
  { 
    id: "butter", 
    name: "黄油", 
    basePrice: 10, 
    tags: ["animal", "dairy"], 
    img: "images/materials/butter.png", 
    desc: "昂贵的高级油脂，带有独特的奶香。"
  },
  { 
    id: "cream", 
    name: "奶油", 
    basePrice: 12, 
    tags: ["animal", "dairy"], 
    img: "images/materials/cream.png", 
    desc: "昂贵的奶制品，像霜一样轻盈。"
  },
  { 
    id: "cheese", 
    name: "奶酪", 
    basePrice: 18, 
    tags: ["animal", "dairy", "fermented"], // 发酵品
    img: "images/materials/cheese.png", 
    desc: "发酵后的浓缩奶香，异域风情。"
  },

  // --- 调味与加工品 (Condiments & Processed) ---
  { 
    id: "bakingSoda", 
    name: "苏打粉", 
    basePrice: 8, 
    tags: ["condiment"], 
    img: "images/materials/bakingSoda.png", 
    desc: "还算常见的原材料粉，据说可以让饼变得蓬松。"
  },
  { 
    id: "jam", 
    name: "果酱", 
    basePrice: 18, 
    tags: ["fruit", "processed"], // 加工品
    img: "images/materials/jam.png", 
    desc: "用当季水果熬制的甜蜜酱料，封存了夏天的味道。"
  },
  { 
    id: "snowSugar", 
    name: "雪花洋糖", 
    basePrice: 18, 
    tags: ["condiment", "imported"], // 舶来品
    img: "images/materials/snowSugar.png", 
    desc: "舶来品，很细的糖。"
  }
];

//数组转换
const materialMap = {};
materialsList.forEach(item => {
  materialMap[item.id] = item;
});

//调用主键id获取信息
function getMaterialInfo(id) {
  // 如果找不到id则返回一个安全的默认对象，防止报错
  return materialMap[id] || { 
    id: id, 
    name: "未知物品", 
    basePrice: 0, 
    img: "", 
    desc: "数据缺失" 
  };
}

//根据id获取图片
function getMaterialIconHtml(id) {
  const info = getMaterialInfo(id);
  if (!info.img) return "❓"; // 如果没有图片路径，显示问号
  return `<img src="${info.img}" class="mat-icon" title="${info.name}" style="width:24px;height:24px;vertical-align:middle;">`;
  //函数调用的时候直接限定图片尺寸
}