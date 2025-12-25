//data/materials.js，包括食材定义和图片，还要规定食材的价格，不同进货商的食材价格倍率不同


const materialsList = [
  { 
    id: "flour", 
    name: "面粉", 
    basePrice: 2, 
    img: "images/materials/flour.png",
    desc: "洁白的麦粉，做饼的灵魂。"
  },
  { 
    id: "ghee", 
    name: "酥油", 
    basePrice: 2, 
    img: "images/materials/ghee.png",
    desc: "中式糕饼最常用的油脂，层层起酥。" 
  },
  { 
    id: "vegetable", 
    name: "蔬菜", 
    basePrice: 2, 
    img: "images/materials/vegetable.png", 
    desc: "新鲜采摘的青菜。"
  },
  { 
    id: "meat", 
    name: "肉", 
    basePrice: 5, 
    img: "images/materials/meat.png", 
    desc: "肉。不管是兔子还是猪，好歹都是肉。"
  },
  { 
    id: "egg", 
    name: "鸡蛋", 
    basePrice: 2, 
    img: "images/materials/egg.png", 
    desc: "圆滚滚的鸡蛋。"
  },
  { 
    id: "milk", 
    name: "牛奶", 
    basePrice: 4, 
    img: "images/materials/milk.png", 
    desc: "新鲜挤出的牛奶，带着微甜的香气。"
  },
  { 
    id: "butter", 
    name: "黄油", 
    basePrice: 8, 
    img: "images/materials/butter.png", 
    desc: "昂贵的高级油脂，带有独特的奶香。"
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
}